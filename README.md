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
- Render persistence: mount a persistent disk on the backend service and set `DATA_DIR` to that mount path (example: `/var/data/smart-study/data`) so `notes.json`, `pyqs.json`, `requests.json`, and `admins.json` survive redeploys
- Recovery: if catalog JSON is lost but PDFs still exist in Drive, run `npm run rebuild-catalog` inside `backend` or call `POST /api/admin/rebuild-catalog` as the main admin
- Upload naming: new PDFs are saved to Drive with canonical filenames and embedded metadata so rebuilds can recover them much more reliably
- Downloading live data: as main admin, use `GET /api/admin/data/notes/download` (or `pyqs`, `requests`, `admins`) to download the current persistent JSON file
