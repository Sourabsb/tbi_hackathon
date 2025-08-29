# SoF Event Extractor Backend

FastAPI backend for maritime document processing using Azure OCR and Google Gemini AI.

## Deployment on Render

### Prerequisites
1. Create a Render account at https://render.com
2. Set up your Azure Computer Vision and Google Gemini API keys

### Backend Deployment
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `sof-event-extractor-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

4. Add Environment Variables:
   - `AZURE_API_KEY`: Your Azure Computer Vision API key
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `AZURE_ENDPOINT`: Your Azure endpoint URL

5. Deploy the backend service first

### Frontend Deployment
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository (same repo)
3. Configure the service:
   - **Name**: `sof-event-extractor-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variable:
   - `REACT_APP_API_URL`: Set this to your backend service URL (e.g., `https://sof-event-extractor-backend.onrender.com`)

5. Deploy the frontend service

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file with your API keys (copy from `.env.example`)

3. Run the server:
   ```bash
   uvicorn app:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `POST /api/upload` - Upload files for processing
- `GET /api/jobs` - Get all jobs
- `GET /api/result/{job_id}` - Get results for a job
- `POST /api/export/{job_id}` - Export results
- `GET /api/health` - Health check with configuration status
