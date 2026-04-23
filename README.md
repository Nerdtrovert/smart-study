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

## Deployment notes
- Render: add `apt-get install -y ghostscript` as build command for PDF compression
- Set all .env vars in Render/Netlify dashboard
- DRIVE_FOLDER_ID: create a folder in Drive, share it with your service account email

## Course code labels
- Upload flow needs only `subject_code` (and branch for notes).
- Branch grouping comes from uploaded note records, not from `courseCodes.json`.
- Keep `frontend/src/data/courseCodes.json` updated with `code -> course name` to display `CODE - Name` in the frontend.
