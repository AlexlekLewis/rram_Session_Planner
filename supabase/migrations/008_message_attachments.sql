-- ============================================================
-- Add attachments column to sp_assistant_messages
-- Stores metadata (filename, mediaType, size) for images/PDFs
-- attached to AI Coach messages. Base64 data is NOT stored.
-- ============================================================

ALTER TABLE sp_assistant_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

COMMENT ON COLUMN sp_assistant_messages.attachments IS 'Attachment metadata array [{id, filename, mediaType, size}]. Base64 data not persisted.';
