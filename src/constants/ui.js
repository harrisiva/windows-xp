// Session/global keys shared between windows inside this SPA runtime.
export const APP_STORAGE_KEYS = Object.freeze({
  GEMINI_SESSION_KEY: "__geminiApiKeySession",
});

// Core desktop geometry used by drag/resize clamping and initial placement.
export const DESKTOP_LAYOUT = Object.freeze({
  TASKBAR_HEIGHT: 40,
  ICON_WIDTH: 92,
  ICON_HEIGHT: 96,
  ICON_GAP: 14,
  DESKTOP_PADDING: 12,
});

// Canonical window ids for z-index ordering and taskbar activation mapping.
export const WINDOW_IDS = Object.freeze({
  PROPERTIES: "properties",
  EXPLORER: "explorer",
  NOTEPAD: "notepad",
  CMD: "cmd",
  GEMINI: "gemini",
  PAINT: "paint",
  PINBALL: "pinball",
  TETRIS: "tetris",
});

// Icons that support the desktop context menu.
export const ICON_CONTEXT_MENU_TARGETS = new Set(["computer", "recycle", "cmd"]);

// Windows above which Clippy can float when they are focused.
export const CLIPPY_TOP_WINDOW_IDS = new Set([WINDOW_IDS.GEMINI, WINDOW_IDS.CMD]);

// Data-driven start menu definitions keep the menu layout reusable and easy to extend.
export const START_MENU_LEFT_ITEMS = Object.freeze([
  { id: "internet", label: "Internet" },
  { id: "email", label: "E-mail" },
  { id: "divider-1", type: "divider" },
  { id: "documents", label: "My Documents" },
  { id: "pictures", label: "My Pictures" },
  { id: "music", label: "My Music" },
  { id: "recent", label: "My Recent Documents" },
  { id: "paint", label: "Paint", action: "openPaint" },
  { id: "pinball", label: "3D Pinball", action: "openPinball" },
  { id: "tetris", label: "Tetris", action: "openTetris" },
]);

export const START_MENU_RIGHT_ITEMS = Object.freeze([
  { id: "my-computer", label: "My Computer" },
  { id: "control-panel", label: "Control Panel" },
  { id: "printers", label: "Printers and Faxes" },
  { id: "help", label: "Help and Support" },
  { id: "search", label: "Search" },
  { id: "run", label: "Run..." },
]);
