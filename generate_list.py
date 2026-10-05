import os
import json
import urllib.parse
from google.cloud import storage

def parse_gcs_uri(gcs_uri):
    """Extracts bucket name and optional prefix from a gs:// URI or path string."""
    path = gcs_uri.replace("gs://", "").strip()
    parts = path.split("/", 1)
    bucket_name = parts[0]
    prefix = parts[1] if len(parts) > 1 and parts[1] else None
    return bucket_name, prefix

def generate_video_js(gcs_uri, output_file="./site/data.js"):
    """
    Scrapes a GCS bucket for videos, uses subdirectories as metadata tags,
    and generates a JavaScript data file.
    """
    bucket_name, prefix = parse_gcs_uri(gcs_uri)

    print(f"Scanning bucket: {bucket_name}...")
    if prefix:
        print(f"Filtering by prefix: {prefix}")
    
    # Initialize the GCS client. It will automatically use your local 
    # Application Default Credentials (e.g., from `gcloud auth application-default login`)
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    
    # Pass the prefix to list_blobs to only fetch objects in that subdirectory
    blobs = bucket.list_blobs(prefix=prefix)
    
    videos = []
    supported_extensions = ('.avi',)
    
    for blob in blobs:
        if not blob.name.lower().endswith(supported_extensions):
            continue
            
        # Parse the path. Everything before the file name becomes a tier/tag
        parts = blob.name.split('/')
        filename = parts[-1]
        tiers = parts[:-1]
        
        # Construct the authenticated storage.cloud.google.com URL
        # We quote the name to handle spaces and special characters in paths
        encoded_path = urllib.parse.quote(blob.name)
        url = f"https://storage.cloud.google.com/{bucket_name}/{encoded_path}"
        
        # Keep tiers as an array for direct JSON injection
        videos.append({
            "filename": filename,
            "tiersArray": tiers,
            "url": url,
            "full_path": blob.name
        })

    print(f"Found {len(videos)} videos. Generating data file...")

    # Ensure the directory exists before writing
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    # Convert to JSON and wrap in a JavaScript variable declaration
    json_data = json.dumps(videos, indent=4)
    js_content = f"window.masterVideoData = {json_data};\n"

    # Write the standalone JavaScript file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Success! Data file generated at: {os.path.abspath(output_file)}")
    print(f"You can now upload your index.html and {os.path.abspath(output_file)} together.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate a JS data file for a video portal.")
    parser.add_argument("gcs_uri", help="The GCS URI (e.g., gs://bucket-name or gs://bucket-name/path/to/folder/)")
    parser.add_argument("--output", default="./site/data.js", help="Path to save the output JS file")
    
    args = parser.parse_args()
    generate_video_js(args.gcs_uri, args.output)
