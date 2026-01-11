-- Add image_url column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN image_url text;

-- Create storage bucket for transaction receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('transaction-receipts', 'transaction-receipts', true);

-- Create storage policies for transaction receipts
CREATE POLICY "Anyone can view transaction receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'transaction-receipts');

CREATE POLICY "Admins can upload transaction receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-receipts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete transaction receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transaction-receipts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);