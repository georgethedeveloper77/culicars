-- 008_ocr_scans.sql

CREATE TABLE ocr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  image_url text NOT NULL,
  document_type "DocType",
  raw_ocr_result jsonb,
  extracted_plate text,
  extracted_vin text,
  extracted_chassis text,
  confidence float,
  confirmed_value text,
  source "OcrSource",
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OCR scans readable by owner" ON ocr_scans FOR SELECT USING (auth.uid()::uuid = user_id);
