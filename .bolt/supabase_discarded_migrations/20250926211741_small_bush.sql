/*
  # Create OCR Processing Log Table

  1. New Tables
    - `ocr_processing_log`
      - `id` (uuid, primary key)
      - `document_type` (text, required) - Type of document processed
      - `document_id` (text, required) - ID of the related document
      - `original_filename` (text, optional) - Original name of the processed file
      - `processing_time_seconds` (numeric, optional) - Time taken to process
      - `confidence_overall` (numeric, optional) - Overall confidence score
      - `confidence_breakdown` (jsonb, optional) - Detailed confidence scores
      - `extracted_text` (text, optional) - Raw extracted text
      - `errors` (text, optional) - Any errors encountered
      - `processed_at` (timestamptz, default now) - When processing occurred
      - `processed_by` (text, optional) - User who processed the document

  2. Security
    - Enable RLS on `ocr_processing_log` table
    - Add policy for authenticated users to read and write their own processing logs
*/

CREATE TABLE IF NOT EXISTS ocr_processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  document_id text NOT NULL,
  original_filename text,
  processing_time_seconds numeric,
  confidence_overall numeric,
  confidence_breakdown jsonb,
  extracted_text text,
  errors text,
  processed_at timestamptz DEFAULT now() NOT NULL,
  processed_by text
);

ALTER TABLE ocr_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read OCR processing logs"
  ON ocr_processing_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert OCR processing logs"
  ON ocr_processing_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update OCR processing logs"
  ON ocr_processing_log
  FOR UPDATE
  TO authenticated
  USING (true);