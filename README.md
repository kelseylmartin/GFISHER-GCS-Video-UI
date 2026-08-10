# GCS Video Portal Generator

This tool scrapes a specified Google Cloud Storage (GCS) bucket for `.mp4` videos and generates a 100% self-contained, searchable, and paginated HTML portal.

By inlining the video metadata directly into the HTML using Webpack, the resulting portal can be hosted directly inside a private, authenticated GCS bucket without triggering CORS or Google API `400 Bad Request` errors.

## Project Structure

```text
.
├── generate_list.py      # Python script to scrape GCS and create data.js
├── package.json          # Node.js dependencies and build scripts
├── webpack.config.js     # Webpack configuration for inlining JS into HTML
├── requirements.txt      # Python dependencies
├── site/
│   └── index.html        # The frontend UI template
└── dist/                 # Created after build
    └── index.html        # The final, bundled output to upload
```

## Prerequisites

1. **Python 3.7+** installed.
2. **Node.js and npm** installed.
3. **Google Cloud CLI** installed and authenticated.
   * Run `gcloud auth application-default login` so the Python script has permissions to list the files in your private bucket.

## 1. Setup & Installation

First, install the required dependencies for both Python and Node.js.

**Install Python Dependencies:**
```bash
pip install -r requirements.txt
```

**Install Node.js Dependencies (Webpack):**
```bash
npm install
```

## 2. Development Workflow

Generating the portal is a two-step process: fetch the data, then bundle the UI.

### Step A: Fetch the Video Data
Run the Python script, passing the GCS URI of the bucket and prefix (folder) you want to scan.

```bash
python generate_list.py gs://my-bucket-name/path/to/videos/
```
*What this does:* Scans the bucket for `.mp4` files, extracts their names and authenticated paths, and saves them into a global variable inside `./site/data.js`.

### Step B: Bundle the Application
Use Webpack to compile the HTML and JavaScript into a single file.

```bash
npm run build
```
*What this does:* Webpack reads the `site/index.html` template and the newly generated `site/data.js` file. It injects the data directly into a `<script>` tag inside the HTML, and outputs a single, standalone file at `./dist/index.html`.

## 3. Deployment

Upload the generated **`./dist/index.html`** file to your GCS bucket.

Because the UI and the data are packaged into a single file, users can open this HTML file directly from the authenticated Google Cloud Storage console. The portal will load instantly, allow blazing-fast searching and pagination, and seamlessly play videos in a new tab using the user's existing Google credentials.


# Disclaimer

This repository is a scientific product and is not official communication of the National Oceanic and
Atmospheric Administration, or the United States Department of Commerce. All NOAA GitHub project
code is provided on an ‘as is’ basis and the user assumes responsibility for its use. Any claims against the
Department of Commerce or Department of Commerce bureaus stemming from the use of this GitHub
project will be governed by all applicable Federal law. Any reference to specific commercial products,
processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or
imply their endorsement, recommendation or favoring by the Department of Commerce. The Department
of Commerce seal and logo, or the seal and logo of a DOC bureau, shall not be used in any manner to
imply endorsement of any commercial product or activity by DOC or the United States Government.
