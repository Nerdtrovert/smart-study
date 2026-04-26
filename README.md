# Smart Study — Dr. HNNCE

Study faster. Learn smarter. | 2022 Scheme

## Stack
- Frontend: React + Vite + react-pdf 
- Backend: Node.js + Express
- Storage: Google Drive API (pluggable)
- Data: notes.json + pyqs.json + requests.json

## Setup

### Backend
cd backend && npm install
npm run dev

### Frontend
cd frontend && npm install
npm run dev
Frontend runs on http://localhost:5175

## Deployment notes
- Render: add `apt-get install -y ghostscript` as build command for PDF compression
- Set all .env vars in Render/Netlify dashboard
- DRIVE_FOLDER_ID: create a folder in Drive, share it with your service account email
