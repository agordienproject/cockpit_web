# Frontend (React)

Create React App-based UI for the inspection dashboard and workflow.

## Prerequisites
- Node.js LTS (v18+ recommended)

## Environment
Copy the template and adjust values if needed:
```powershell
copy .env_template .env
```
Key variables:
- `REACT_APP_API_URL` — Base URL to the backend (e.g., http://127.0.0.1:3000)
- `REACT_APP_API_BASE_URL` — API base path (e.g., http://127.0.0.1:3000/api)
- `PORT` — Local dev server port (default 4000)

## Install & run
```powershell
npm install
npm start
```
The app will open at `http://localhost:4000` by default.

## Build
```powershell
npm run build
```
Outputs static files to `build/`.
