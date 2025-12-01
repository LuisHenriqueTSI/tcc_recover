import os
import base64
import re
import json
import requests
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from google.oauth2 import service_account
import google.auth.transport.requests
from typing import Dict

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get('/models')
def list_models():
    """Diagnostic endpoint: list available models using current credentials.
    Tries service account (Authorization Bearer) first, falls back to GOOGLE_API_KEY.
    """
    sa_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    api_key = os.getenv('GOOGLE_API_KEY')
    headers = {'Content-Type': 'application/json'}

    if sa_path and os.path.exists(sa_path):
        try:
            token = _get_google_access_token()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f'Error obtaining access token: {e}')
        headers['Authorization'] = f'Bearer {token}'
        url = 'https://generativelanguage.googleapis.com/v1beta2/models'
    elif api_key:
        url = f'https://generativelanguage.googleapis.com/v1beta2/models?key={api_key}'
    else:
        raise HTTPException(status_code=400, detail='No GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY configured')

    resp = requests.get(url, headers=headers, timeout=30)
    try:
        data = resp.json()
    except Exception:
        data = {'text': resp.text}
    if resp.status_code != 200:
        logger.error('List models failed %s %s', resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail={'status': resp.status_code, 'body': data})
    return data


def _get_google_access_token() -> str:
    sa_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not sa_path or not os.path.exists(sa_path):
        raise RuntimeError('GOOGLE_APPLICATION_CREDENTIALS not set or file not found')
    creds = service_account.Credentials.from_service_account_file(sa_path, scopes=["https://www.googleapis.com/auth/cloud-platform"])
    request = google.auth.transport.requests.Request()
    creds.refresh(request)
    return creds.token


def _call_generative_api(image_bytes: bytes, model: str | None = None) -> str:
    """Call the Generative Language API.

    The model can be provided explicitly or via the `GENERATIVE_MODEL` env var.
    """
    # allow overriding the default model via environment
    if not model:
        model = os.getenv('GENERATIVE_MODEL', 'models/gemini-1.5-mini')
    # Simplified: require a Service Account JSON and use OAuth2 access token.
    # This avoids API key confusion and ensures calls have project identity.
    sa_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not sa_path or not os.path.exists(sa_path):
        raise RuntimeError('Service account JSON required. Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON for project access.')
    headers = {'Content-Type': 'application/json'}
    path_model = model if model.startswith('models/') else f'models/{model}'
    # get token from service account
    token = _get_google_access_token()
    headers['Authorization'] = f'Bearer {token}'
    url = f'https://generativelanguage.googleapis.com/v1beta2/{path_model}:generate'

    # Embed image as base64 in the request and ask Gemini to return JSON only
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    prompt = (
        "You will be given an image. Analyze it and return ONLY a single JSON object with the following keys:"
        " title, category, description, status, attributes. "
        "attributes must be an object that may contain breed, color, brand, model if available. "
        "Do not return any explanation or other text. Return valid JSON only."
    )

    body = {
        "input": {
            "text": prompt,
            "image": [
                {
                    "mime_type": "image/jpeg",
                    "content": image_b64
                }
            ]
        }
    }

    # headers already prepared above (may include Authorization if using service account)
    resp = requests.post(url, headers=headers, json=body, timeout=60)
    if resp.status_code == 200:
        return resp.text

    logger.error('Generative API error %s for url %s: %s', resp.status_code, url, resp.text)
    # For clarity, map common error codes to actionable messages
    if resp.status_code == 403:
        raise HTTPException(status_code=502, detail='Permission denied when calling Generative Language API. Check that the service account has the required roles and that the API is enabled for the project.')
    if resp.status_code == 404:
        raise HTTPException(status_code=502, detail='Model not found. Verify that the requested model is available to your project and that GENERATIVE_MODEL is correct.')
    raise HTTPException(status_code=502, detail=f'Generative API error: {resp.status_code} {resp.text}')
    return resp.text


def _extract_json_from_text(text: str):
    # Try to find a JSON object in the text
    try:
        # direct parse if it's valid JSON
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def _fallback_heuristic(text: str) -> Dict:
    # Very small heuristic extraction (in case Gemini returns plain caption)
    t = text.strip()
    lower = t.lower()
    attrs = {}
    colors = ['black', 'white', 'brown', 'gray', 'grey', 'gold', 'silver', 'red', 'blue', 'green', 'yellow']
    found_colors = [c for c in colors if c in lower]
    if found_colors:
        attrs['color'] = found_colors
    phone_brands = ['iphone', 'samsung', 'xiaomi', 'motorola', 'huawei', 'oneplus']
    found_brands = [b for b in phone_brands if b in lower]
    if found_brands:
        attrs['brand'] = found_brands
    animals = ['dog', 'cat', 'cachorro', 'gato']
    category = 'other'
    if any(a in lower for a in animals):
        category = 'animal'
    elif found_brands:
        category = 'electronics'

    return {
        'title': t[:60],
        'category': category,
        'description': t,
        'status': 'lost',
        'attributes': attrs
    }


@router.post('/analyze')
async def analyze_image(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        raw = _call_generative_api(contents)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        # return fallback caption as error
        return _fallback_heuristic(str(e))

    # try to extract JSON from response
    parsed = _extract_json_from_text(raw)
    if parsed:
        return parsed

    # fallback: try to parse known keys in raw text
    heuristic = _extract_json_from_text(raw) or _fallback_heuristic(raw)
    return heuristic
