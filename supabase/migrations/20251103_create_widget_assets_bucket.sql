-- Create storage bucket for widget assets (logos, icons, etc.)
-- This bucket stores organization-specific widget customization assets

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'widget-assets',
  'widget-assets',
  true, -- Public bucket since these are widget display assets
  false,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/ico', 'image/x-icon'],
  2097152 -- 2MB max file size
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
-- Policy: Anyone can view widget assets (they're public display assets)
CREATE POLICY "Widget assets are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'widget-assets');

-- Policy: Authenticated users can upload widget assets for their organization
CREATE POLICY "Authenticated users can upload widget assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Only allow uploads to user's organization path
  (name ~ ('^organizations/' || (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1) || '/'))
);

-- Policy: Users can update their own organization's widget assets
CREATE POLICY "Users can update their organization widget assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Only allow updates to files in user's organization path
  (name ~ ('^organizations/' || (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1) || '/'))
)
WITH CHECK (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Only allow updates to files in user's organization path
  (name ~ ('^organizations/' || (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1) || '/'))
);

-- Policy: Users can delete their own organization's widget assets
CREATE POLICY "Users can delete their organization widget assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Only allow deletion of files in user's organization path
  (name ~ ('^organizations/' || (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1) || '/'))
);