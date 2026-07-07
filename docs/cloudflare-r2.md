# Cloudflare R2 configuration

1. Create a bucket in Cloudflare R2.
2. Create an API token with object read/write permissions.
3. Fill the backend environment variables with your bucket endpoint and credentials.
4. Optionally configure a custom domain for public object URLs.
5. Ensure the bucket policy allows public read access for uploaded assets if you want direct public URLs.
