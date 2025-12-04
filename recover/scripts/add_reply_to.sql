-- Migration: add reply_to_id to messages and allow item_id to be nullable
-- Run this in Supabase SQL editor or via psql connected to your DB.

-- 1) Add nullable reply_to_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'reply_to_id'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN reply_to_id integer;
    END IF;
END$$;

-- 2) Optionally add a foreign key constraint pointing to messages(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' AND tc.table_name = 'messages' AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'reply_to_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_reply_to_fkey
        FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
    END IF;
END$$;

-- 3) Make item_id nullable (if the column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'item_id'
    ) THEN
        BEGIN
            EXECUTE 'ALTER TABLE public.messages ALTER COLUMN item_id DROP NOT NULL';
        EXCEPTION WHEN undefined_column THEN
            -- ignore if column does not exist
            NULL;
        END;
    END IF;
END$$;

-- Verify by selecting the table structure
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name='messages';
