#!/usr/bin/env python3
"""Helper script: use a service account JSON to list available Generative Language models.
Usage: python scripts/get_models.py /path/to/service-account.json
"""
import sys
import os
import requests
from google.oauth2 import service_account
import google.auth.transport.requests


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/get_models.py /path/to/service-account.json")
        sys.exit(1)
    sa = os.path.expanduser(sys.argv[1])
    if not os.path.exists(sa):
        print("Service account JSON not found:", sa)
        sys.exit(1)
    creds = service_account.Credentials.from_service_account_file(sa, scopes=["https://www.googleapis.com/auth/cloud-platform"])
    req = google.auth.transport.requests.Request()
    creds.refresh(req)
    token = creds.token
    headers = {"Authorization": f"Bearer {token}"}
    url = "https://generativelanguage.googleapis.com/v1beta2/models"
    resp = requests.get(url, headers=headers, timeout=30)
    print("HTTP", resp.status_code)
    try:
        print(resp.json())
    except Exception:
        print(resp.text)


if __name__ == '__main__':
    main()
