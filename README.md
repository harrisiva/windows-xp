# Windows XP Desktop (Web Edition)

An interactive Windows XP-inspired desktop built with React + Vite + Express.

It recreates classic XP vibes while adding playful features like:
- Draggable desktop icons and windows
- Start menu and taskbar with open-window entries
- `readme.txt` (editable per session)
- CMD window with Gemini-backed responses
- XP-style mini games (Pinball + Tetris)
- Clippy assistant with chat bubble interactions

## Preview

### Classic XP Desktop
<img width="1470" height="917" alt="Windows XP desktop clone" src="https://github.com/user-attachments/assets/a11d6f9e-3702-4991-8d6d-b31d33dd5c1b" />

### Apps + Games
<img width="1470" height="917" alt="Windows XP apps and games" src="https://github.com/user-attachments/assets/ac76b140-d7b3-4f96-9e87-63ad8a0eaf3d" />

### Gemini in CMD
<img width="1470" height="918" alt="image" src="https://github.com/user-attachments/assets/7dc4548c-6986-444b-a453-9e8e1984d75d" />

## Tech Stack

- Frontend: React 18 + Vite
- Backend: Express
- AI: `@google/genai`
- Styling: Plain CSS (XP-themed custom UI)

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run in development (recommended)
Use two terminals:

Terminal A (API):
```bash
npm run dev:api
```

Terminal B (UI):
```bash
npm run dev:ui
```

Open `http://localhost:5173`.

Notes:
- Vite proxies `/api/*` requests to Express on `http://localhost:3000`.
- Gemini key validation and CMD chat require the backend to be running.

### 3. Run as production-like single server
```bash
npm run build
npm start
```

Open `http://localhost:3000`.

## Gemini Setup

1. Launch the app.
2. Double-click the Gemini key shortcut on desktop.
3. Paste your Gemini API key and save.
4. Open CMD and send prompts.

The key is stored only for the current browser session (refresh clears session UI state where applicable).

## Project Structure

```text
src/
  components/
    DesktopShell.jsx      # desktop/taskbar/start menu/clippy/ui shell
    WindowFrame.jsx       # reusable XP-style window primitive
    windows/index.jsx     # app windows (Explorer, Notepad, CMD, etc.)
  constants/ui.js         # window ids/layout/constants
  lib/
    api.js                # frontend API helpers
    config.js             # icon + assistant message defaults
    games.jsx             # Pinball/Tetris implementations
    utils.js              # formatting/sizing helpers
  App.jsx                 # desktop orchestration and interaction state
server.js                 # API endpoints + production static hosting
```

## Contributing

Issues and PRs are welcome.

If you propose UI changes, keep the XP visual language and interaction model consistent (dragging, taskbar behavior, window chrome, etc.).
