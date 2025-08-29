# SoF Event Extractor

A full-stack web application for extracting maritime event data from documents using AI-powered OCR and natural language processing.

## Features

- **Document Processing**: Upload images and documents for OCR processing
- **AI-Powered Extraction**: Uses Azure Computer Vision and Google Gemini AI for accurate data extraction
- **Event Timeline**: Visualize extracted events in an interactive timeline
- **Export Options**: Export results as JSON or CSV
- **Modern UI**: Built with React and Tailwind CSS

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React.js
- **OCR**: Azure Computer Vision
- **AI Processing**: Google Gemini
- **Deployment**: Render

## Deployment on Render

### Step 1: Prepare Your Repository
Your repository is already configured with the necessary files for Render deployment.

### Step 2: Deploy Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository (`https://github.com/Sourabsb/tbi_hackathon`)
4. Configure the service:
   - **Name**: `sof-event-extractor-backend`
   - **Runtime**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables:
   - `AZURE_API_KEY`: Your Azure Computer Vision API key
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `AZURE_ENDPOINT`: Your Azure endpoint URL (e.g., `https://your-resource.cognitiveservices.azure.com/`)

6. Click **Create Web Service**

### Step 3: Deploy Frontend Service
1. In Render Dashboard, click **New** → **Static Site**
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: `sof-event-extractor-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variable:
   - `REACT_APP_API_URL`: Your backend service URL (will be something like `https://sof-event-extractor-backend.onrender.com`)

5. Click **Create Static Site**

### Step 4: Update CORS (Optional)
After both services are deployed, update the backend's CORS settings if needed:
- In the backend service settings, you can add your frontend URL to the allowed origins

## Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your API keys
uvicorn app:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000` and proxy API requests to `http://localhost:8000`.

## Environment Variables

### Backend (.env)
```
AZURE_API_KEY=your_azure_api_key
AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## File Structure

```
tbi_hackathon/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── render.yaml         # Render deployment config
│   ├── .env.example        # Environment variables template
│   └── README.md           # Backend documentation
├── frontend/
│   ├── src/                # React application source
│   ├── public/             # Static assets
│   ├── package.json        # Node dependencies
│   ├── render.yaml         # Render deployment config
│   └── _redirects          # SPA routing rules
└── README.md               # Main project documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.
