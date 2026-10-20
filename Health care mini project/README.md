# Healthcare IoT Mini Project — separate frontend and backend

## Folder structure
- `frontend/` — HTML, CSS and browser JavaScript
- `backend/` — Node.js + Express API and JSON demo storage

## Run backend locally
1. Install Node.js 18 or later.
2. Open VS Code Terminal in the `backend` folder.
3. Run `npm install`
4. Run `npm start`
5. Backend API is at `http://localhost:5000`.

## Open frontend locally
Open `frontend/index.html` in a browser, or use VS Code Live Server.
The frontend currently calls `http://localhost:5000`.

## When deploying online
Deploy the backend as a Node.js web service and note its public URL. Then edit `frontend/app.js`:
`const API_BASE = "http://localhost:5000";`
replace the localhost address with the deployed backend URL. Host the `frontend/` folder on a static hosting service such as GitHub Pages or Netlify. Configure backend CORS to allow only the frontend domain before production use.

## Notes
This is an educational demo, not a medical device. Use fictional records only. JSON-file storage may not persist on some hosting providers; use a managed database for persistent online storage.
