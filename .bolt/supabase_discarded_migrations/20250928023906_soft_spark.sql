/*
  # Add file attachment columns to gastos and ingresos tables

  1. New Columns Added
    - `evt_gastos` table:
      - `archivo_adjunto` (text) - URL of the uploaded file
      - `archivo_nombre` (text) - Original filename
      - `archivo_tamaño` (bigint) - File size in bytes
      - `archivo_tipo` (text) - MIME type of the file
    
    - `evt_ingresos` table:
      - `archivo_adjunto` (text) - URL of the uploaded file
      - `archivo_nombre` (text) - Original filename
      - `archivo_tamaño` (bigint) - File size in bytes
      - `archivo_tipo` (text) - MIME type of the file

  2. Purpose
    - Support file upload functionality for expense and income records
    - Replace OCR processing with manual file attachment system
    - Maintain file metadata for better organization

  3. Notes
    - All columns are nullable to maintain backward compatibility
    - File URLs will point to Supabase Storage bucket 'documents'
    - File size is stored in bytes for accurate tracking
*/

-- Add file attachment columns to evt_gastos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_gastos' AND column_name = 'archivo_adjunto'
  ) THEN
    ALTER TABLE evt_gastos ADD COLUMN archivo_adjunto TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_gastos' AND column_name = 'archivo_nombre'
  ) THEN
    ALTER TABLE evt_gastos ADD COLUMN archivo_nombre TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_gastos' AND column_name = 'archivo_tamaño'
  ) THEN
    ALTER TABLE evt_gastos ADD COLUMN archivo_tamaño BIGINT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_gastos' AND column_name = 'archivo_tipo'
  ) THEN
    ALTER TABLE evt_gastos ADD COLUMN archivo_tipo TEXT;
  END IF;
END $$;

-- Add file attachment columns to evt_ingresos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'archivo_adjunto'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN archivo_adjunto TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'archivo_nombre'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN archivo_nombre TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'archivo_tamaño'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN archivo_tamaño BIGINT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'archivo_tipo'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN archivo_tipo TEXT;
  END IF;
END $$;