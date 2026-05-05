# Smart Study

Smart Study is a web platform for Dr. HNNCE students to access semester-wise notes and previous-year question papers (PYQs), with an admin workflow for uploading, organizing, and managing study material.

## What this project does

- Lets students browse Notes and PYQs by scheme, semester, branch, and course code.
- Opens PDFs directly in-app and supports direct download.
- Provides search across subjects/modules.
- Lets students request missing materials.
- Gives admins a secure panel to upload, edit, delete, and recover catalog data from Google Drive.

## Tech used

- **Frontend:** React 18, Vite, React Router, Axios, react-pdf
- **Backend:** Node.js, Express, JWT auth, Multer
- **Storage:** Google Drive (PDF files) + JSON data store (`notes`, `pyqs`, `requests`, `admins`)

## Project structure

- `frontend/` — student + admin UI
- `backend/` — API, auth, upload pipeline, catalog rebuild, logs

## Quick start

1. Install dependencies:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
2. Configure environment in project root (`.env`) based on `.env.example`.
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`
5. Open the app at `http://localhost:5175`

## User flow summary

- **Students:** Home -> Notes/PYQs -> choose scheme/semester -> open subject -> read/download PDF.
- **Students:** Can submit missing-content requests from the Requests section.
- **Admins:** Login at `/admin` -> bulk upload notes/PYQs -> manage files -> monitor requests/logs.

## Deployment summary

- Keep backend JSON files on persistent storage (`DATA_DIR`) so data survives redeploys.
- Store Google Drive + admin/JWT secrets as environment variables.
- Use catalog rebuild when JSON is lost but PDFs are still available in Drive.
