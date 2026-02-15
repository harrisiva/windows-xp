import { useEffect, useRef, useState } from "react";
import { PinballGame, TetrisGame } from "./lib/games";
import { DEFAULT_ICONS, CLIPPY_MESSAGES } from "./lib/config";
import { calculateResponsivePinballSize, formatGeminiOutputForCmd } from "./lib/utils";
import { fetchSiteInfo, queryGeminiFromCmd, validateGeminiKey } from "./lib/api";
import {
  DesktopGeminiStatusWidget,
  DesktopIcons,
  ClippyAssistant,
  IconContextMenu,
  StartMenu,
  Taskbar,
} from "./components/DesktopShell";
import {
  CmdWindow,
  ExplorerWindow,
  GeminiKeyWindow,
  NotepadWindow,
  PaintWindow,
  PinballWindow,
  PropertiesWindow,
  TetrisWindow,
} from "./components/windows";
import {
  APP_STORAGE_KEYS,
  DESKTOP_LAYOUT,
  WINDOW_IDS,
  CLIPPY_TOP_WINDOW_IDS,
} from "./constants/ui";

/**
 * Root desktop orchestrator.
 * Owns global state, drag/resize interactions, and cross-window coordination.
 */
function App() {
  const GEMINI_KEY_GLOBAL = APP_STORAGE_KEYS.GEMINI_SESSION_KEY;
  const {
    TASKBAR_HEIGHT,
    ICON_WIDTH,
    ICON_HEIGHT,
    ICON_GAP,
    DESKTOP_PADDING,
  } = DESKTOP_LAYOUT;
  // Core desktop shell state.
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [paintOpen, setPaintOpen] = useState(false);
  const [pinballOpen, setPinballOpen] = useState(false);
  const [tetrisOpen, setTetrisOpen] = useState(false);
  const [windowStack, setWindowStack] = useState([
    WINDOW_IDS.PROPERTIES,
    WINDOW_IDS.EXPLORER,
    WINDOW_IDS.NOTEPAD,
    WINDOW_IDS.CMD,
    WINDOW_IDS.GEMINI,
    WINDOW_IDS.PAINT,
    WINDOW_IDS.PINBALL,
    WINDOW_IDS.TETRIS,
  ]);
  const [dogBubbleOpen, setDogBubbleOpen] = useState(false);
  const [dogMessageIndex, setDogMessageIndex] = useState(0);
  const [dogCustomMessage, setDogCustomMessage] = useState("");
  // Per-window state (open flags, position, size, content).
  const [readmeContent, setReadmeContent] = useState(
    "Welcome to this Windows XP desktop web app.\n\nYou can edit this file. Changes stay until you refresh the page."
  );
  const [readmeFontSize, setReadmeFontSize] = useState(13);
  const [explorerPos, setExplorerPos] = useState({ x: 160, y: 78 });
  const [explorerSize, setExplorerSize] = useState({ width: 640, height: 430 });
  const [notepadPos, setNotepadPos] = useState({ x: 220, y: 110 });
  const [notepadSize, setNotepadSize] = useState({ width: 620, height: 440 });
  const [cmdPos, setCmdPos] = useState({ x: 130, y: 84 });
  const [cmdSize, setCmdSize] = useState({ width: 920, height: 520 });
  const [geminiPos, setGeminiPos] = useState({ x: 280, y: 138 });
  const [paintPos, setPaintPos] = useState({ x: 240, y: 92 });
  const [paintSize, setPaintSize] = useState({ width: 760, height: 520 });
  const [pinballPos, setPinballPos] = useState({ x: 200, y: 86 });
  const [pinballSize, setPinballSize] = useState(() => {
    const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
    return calculateResponsivePinballSize(viewportWidth, viewportHeight, TASKBAR_HEIGHT);
  });
  const [tetrisPos, setTetrisPos] = useState({ x: 260, y: 96 });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window[GEMINI_KEY_GLOBAL] || "";
  });
  const [geminiDraft, setGeminiDraft] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window[GEMINI_KEY_GLOBAL] || "";
  });
  const [geminiStatus, setGeminiStatus] = useState("inactive");
  const [geminiStatusMessage, setGeminiStatusMessage] = useState("No API key validated yet.");
  const [desktopGeminiPos, setDesktopGeminiPos] = useState(() => {
    const margin = 6;
    const defaultY = 10;
    if (typeof window === "undefined") {
      return { x: margin, y: defaultY };
    }
    return {
      x: Math.max(margin, window.innerWidth - 200),
      y: defaultY,
    };
  });
  const [cmdInput, setCmdInput] = useState("");
  const [cmdFontSize, setCmdFontSize] = useState(14);
  const [cmdBusy, setCmdBusy] = useState(false);
  const [cmdLines, setCmdLines] = useState([
    { kind: "system", text: "Microsoft Windows XP [Version 5.1.2600]" },
    { kind: "system", text: "(C) Copyright 1985-2001 Microsoft Corp." },
    { kind: "blank", text: "" },
    { kind: "system", text: "Type a prompt and press Enter to chat with Gemini." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [icons, setIcons] = useState(() => DEFAULT_ICONS.map((icon, index) => ({ ...icon, x: 28, y: 36 + index * 110 })));
  // Mutable drag state avoids re-renders while pointer moves.
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const explorerRef = useRef(null);
  const notepadRef = useRef(null);
  const cmdRef = useRef(null);
  const cmdOutputRef = useRef(null);
  const geminiRef = useRef(null);
  const paintRef = useRef(null);
  const desktopGeminiRef = useRef(null);
  const pinballRef = useRef(null);
  const tetrisRef = useRef(null);

  /** Reads viewport and computes best-fit pinball window dimensions. */
  function getResponsivePinballSize() {
    return calculateResponsivePinballSize(window.innerWidth, window.innerHeight, TASKBAR_HEIGHT);
  }

  function clampPinballPositionToViewport(x, y, width, height) {
    const margin = 12;
    const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - height - margin);
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - width - margin)),
      y: Math.min(Math.max(margin, y), maxY),
    };
  }

  /** Promotes a window id to the top of the z-order stack. */
  function bringWindowToFront(windowId) {
    setWindowStack((prev) => [...prev.filter((id) => id !== windowId), windowId]);
  }

  /** Converts stack ordering into concrete z-index values. */
  function getWindowZ(windowId) {
    return 30 + windowStack.indexOf(windowId);
  }

  /**
   * Updates top-right status chip by validating Gemini API key against backend.
   */
  async function pingGeminiStatus(apiKey) {
    if (!apiKey) {
      setGeminiStatus("inactive");
      setGeminiStatusMessage("No API key validated yet.");
      return;
    }

    setGeminiStatus("checking");
    setGeminiStatusMessage("Pinging Gemini...");

    try {
      const { ok, payload } = await validateGeminiKey(apiKey);
      if (ok) {
        setGeminiStatus("active");
        setGeminiStatusMessage(payload.message || "Connected to Gemini API.");
        return;
      }

      setGeminiStatus("inactive");
      setGeminiStatusMessage(payload?.message || "Could not validate the Gemini key.");
    } catch {
      setGeminiStatus("inactive");
      setGeminiStatusMessage("Network error while checking Gemini status.");
    }
  }

  // Keep session key mirrored on window for compatibility with existing flows.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window[GEMINI_KEY_GLOBAL] = geminiApiKey;
    }
  }, [geminiApiKey]);

  // Auto-scroll command output as new lines arrive.
  useEffect(() => {
    if (!cmdOpen) {
      return;
    }
    const outputEl = cmdOutputRef.current;
    if (outputEl) {
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }, [cmdLines, cmdOpen]);

  // Ensure status widget starts in the top-right corner after first layout.
  useEffect(() => {
    const margin = 6;
    const top = 10;
    const chipWidth = desktopGeminiRef.current?.offsetWidth || 170;
    const nextX = Math.max(margin, window.innerWidth - chipWidth - margin);
    setDesktopGeminiPos({ x: nextX, y: top });
  }, []);

  // Clicking outside menus should close context + start menu overlays.
  useEffect(() => {
    function closeMenu() {
      setMenu((prev) => ({ ...prev, visible: false, targetId: null }));
      setStartMenuOpen(false);
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  /** Toggles start menu and prevents desktop-level click handlers from firing. */
  function onStartButtonClick(event) {
    event.stopPropagation();
    setStartMenuOpen((prev) => !prev);
  }

  // Global pointer/resize listeners for drag, resize, and viewport clamping.
  useEffect(() => {
    // Reflow desktop icons into a clean column-first grid on initial mount and refresh.
    function arrangeIcons(iconItems) {
      const desktop = desktopRef.current;
      if (!desktop) {
        return iconItems;
      }

      const availableHeight = Math.max(
        ICON_HEIGHT,
        desktop.clientHeight - TASKBAR_HEIGHT - DESKTOP_PADDING * 2
      );
      const rows = Math.max(1, Math.floor((availableHeight + ICON_GAP) / (ICON_HEIGHT + ICON_GAP)));

      return iconItems.map((icon, index) => {
        const column = Math.floor(index / rows);
        const row = index % rows;
        return {
          ...icon,
          x: DESKTOP_PADDING + column * (ICON_WIDTH + ICON_GAP),
          y: DESKTOP_PADDING + row * (ICON_HEIGHT + ICON_GAP),
        };
      });
    }

    setIcons((prev) => arrangeIcons(prev));

    function clampToViewport(x, y) {
      const popup = windowRef.current;
      if (!popup) {
        return { x, y };
      }

      const maxX = Math.max(12, window.innerWidth - popup.offsetWidth - 12);
      const maxY = Math.max(12, window.innerHeight - popup.offsetHeight - 12);
      return {
        x: Math.min(Math.max(12, x), maxX),
        y: Math.min(Math.max(12, y), maxY),
      };
    }

    function clampExplorerToViewport(x, y, width, height) {
      // Keep explorer fully visible, accounting for taskbar occupancy at the bottom.
      const margin = 12;
      const explorerWidth = width || explorerRef.current?.offsetWidth || 640;
      const explorerHeight = height || explorerRef.current?.offsetHeight || 430;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - explorerHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - explorerWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampExplorerSizeToViewport(width, height, x, y) {
      // Resizing is bounded both by minimum usable sizes and remaining viewport space.
      const margin = 12;
      const minWidth = 420;
      const minHeight = 280;
      const explorerRect = explorerRef.current?.getBoundingClientRect();
      const left = x ?? explorerRect?.left ?? 160;
      const top = y ?? explorerRect?.top ?? 78;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampNotepadToViewport(x, y, width, height) {
      const margin = 12;
      const notepadWidth = width || notepadRef.current?.offsetWidth || 620;
      const notepadHeight = height || notepadRef.current?.offsetHeight || 440;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - notepadHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - notepadWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampNotepadSizeToViewport(width, height, x, y) {
      // Prevent text editor from shrinking below a readable authoring size.
      const margin = 12;
      const minWidth = 420;
      const minHeight = 260;
      const notepadRect = notepadRef.current?.getBoundingClientRect();
      const left = x ?? notepadRect?.left ?? 220;
      const top = y ?? notepadRect?.top ?? 110;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampCmdToViewport(x, y, width, height) {
      const margin = 12;
      const cmdWidth = width || cmdRef.current?.offsetWidth || 940;
      const cmdHeight = height || cmdRef.current?.offsetHeight || 520;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - cmdHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - cmdWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampCmdSizeToViewport(width, height, x, y) {
      // CMD keeps larger minimums so prompt/output remain legible.
      const margin = 12;
      const minWidth = 520;
      const minHeight = 300;
      const cmdRect = cmdRef.current?.getBoundingClientRect();
      const left = x ?? cmdRect?.left ?? 130;
      const top = y ?? cmdRect?.top ?? 84;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampGeminiToViewport(x, y, width, height) {
      const margin = 12;
      const geminiWidth = width || geminiRef.current?.offsetWidth || 540;
      const geminiHeight = height || geminiRef.current?.offsetHeight || 240;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - geminiHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - geminiWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampPaintToViewport(x, y, width, height) {
      const margin = 12;
      const paintWidth = width || paintRef.current?.offsetWidth || 760;
      const paintHeight = height || paintRef.current?.offsetHeight || 520;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - paintHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - paintWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampPaintSizeToViewport(width, height, x, y) {
      const margin = 12;
      const minWidth = 500;
      const minHeight = 340;
      const paintRect = paintRef.current?.getBoundingClientRect();
      const left = x ?? paintRect?.left ?? 240;
      const top = y ?? paintRect?.top ?? 92;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
      };
    }

    function clampPinballToViewport(x, y, width, height) {
      const margin = 12;
      const pinballWidth = width || pinballRef.current?.offsetWidth || 610;
      const pinballHeight = height || pinballRef.current?.offsetHeight || 500;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - pinballHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - pinballWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampTetrisToViewport(x, y, width, height) {
      const margin = 12;
      const tWidth = width || tetrisRef.current?.offsetWidth || 360;
      const tHeight = height || tetrisRef.current?.offsetHeight || 520;
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - tHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - tWidth - margin)),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampDesktopGeminiToViewport(x, y, width, height) {
      // Status chip has tighter margins so it can sit close to screen corners.
      const margin = 6;
      const chipWidth = width || desktopGeminiRef.current?.offsetWidth || 170;
      const chipHeight = height || desktopGeminiRef.current?.offsetHeight || 32;
      const maxX = Math.max(margin, window.innerWidth - chipWidth - margin);
      const maxY = Math.max(margin, window.innerHeight - TASKBAR_HEIGHT - chipHeight - margin);
      return {
        x: Math.min(Math.max(margin, x), maxX),
        y: Math.min(Math.max(margin, y), maxY),
      };
    }

    function clampIconToDesktop(x, y) {
      const desktop = desktopRef.current;
      if (!desktop) {
        return { x, y };
      }

      const min = DESKTOP_PADDING;
      const maxX = Math.max(min, desktop.clientWidth - ICON_WIDTH - min);
      const maxY = Math.max(min, desktop.clientHeight - TASKBAR_HEIGHT - ICON_HEIGHT - min);
      return {
        x: Math.min(Math.max(min, x), maxX),
        y: Math.min(Math.max(min, y), maxY),
      };
    }

    function onPointerMove(event) {
      // Single pointer-move loop routes updates by drag target type.
      if (!dragState.current.target) {
        return;
      }

      if (dragState.current.target === "window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setWindowPos(clampToViewport(nextX, nextY));
      }

      if (dragState.current.target === "explorer-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setExplorerPos(clampExplorerToViewport(nextX, nextY));
      }

      if (dragState.current.target === "notepad-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setNotepadPos(clampNotepadToViewport(nextX, nextY));
      }

      if (dragState.current.target === "cmd-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setCmdPos(clampCmdToViewport(nextX, nextY));
      }

      if (dragState.current.target === "pinball-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setPinballPos(clampPinballToViewport(nextX, nextY));
      }

      if (dragState.current.target === "gemini-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setGeminiPos(clampGeminiToViewport(nextX, nextY));
      }

      if (dragState.current.target === "tetris-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setTetrisPos(clampTetrisToViewport(nextX, nextY));
      }

      if (dragState.current.target === "paint-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setPaintPos(clampPaintToViewport(nextX, nextY));
      }

      if (dragState.current.target === "desktop-gemini-status") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setDesktopGeminiPos(clampDesktopGeminiToViewport(nextX, nextY));
      }

      if (dragState.current.target === "explorer-resize") {
        // Resize operations use deltas from drag start to avoid cumulative drift.
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setExplorerSize(clampExplorerSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "notepad-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setNotepadSize(clampNotepadSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "cmd-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setCmdSize(clampCmdSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "paint-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setPaintSize(clampPaintSizeToViewport(nextWidth, nextHeight));
      }

      if (dragState.current.target === "icon") {
        // Icon drag operates in desktop-local coordinates, then clamps to grid bounds.
        const desktopRect = desktopRef.current?.getBoundingClientRect();
        if (!desktopRect || !dragState.current.id) {
          return;
        }

        const pointerX = event.clientX - desktopRect.left;
        const pointerY = event.clientY - desktopRect.top;
        const nextX = pointerX - dragState.current.offsetX;
        const nextY = pointerY - dragState.current.offsetY;
        const clamped = clampIconToDesktop(nextX, nextY);
        setIcons((prev) =>
          prev.map((icon) =>
            icon.id === dragState.current.id ? { ...icon, x: clamped.x, y: clamped.y } : icon
          )
        );
      }
    }

    function onPointerUp() {
      // End any active drag/resize gesture and restore default cursor behavior.
      dragState.current.target = null;
      dragState.current.id = null;
      document.body.classList.remove("is-dragging");
    }

    function onResize() {
      // Re-clamp all movable/resizable surfaces when viewport dimensions change.
      setWindowPos((prev) => clampToViewport(prev.x, prev.y));
      setExplorerSize((prev) => clampExplorerSizeToViewport(prev.width, prev.height));
      setExplorerPos((prev) => clampExplorerToViewport(prev.x, prev.y));
      setNotepadSize((prev) => clampNotepadSizeToViewport(prev.width, prev.height));
      setNotepadPos((prev) => clampNotepadToViewport(prev.x, prev.y));
      setCmdSize((prev) => clampCmdSizeToViewport(prev.width, prev.height));
      setCmdPos((prev) => clampCmdToViewport(prev.x, prev.y));
      setGeminiPos((prev) => clampGeminiToViewport(prev.x, prev.y));
      setPaintSize((prev) => clampPaintSizeToViewport(prev.width, prev.height));
      setPaintPos((prev) => clampPaintToViewport(prev.x, prev.y));
      const nextPinballSize = getResponsivePinballSize();
      setPinballSize(nextPinballSize);
      setPinballPos((prev) =>
        clampPinballToViewport(prev.x, prev.y, nextPinballSize.width, nextPinballSize.height)
      );
      setTetrisPos((prev) => clampTetrisToViewport(prev.x, prev.y));
      setDesktopGeminiPos((prev) => clampDesktopGeminiToViewport(prev.x, prev.y));
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function onIconRightClick(event, iconId) {
    event.preventDefault();
    setMenu({ visible: true, x: event.clientX, y: event.clientY, targetId: iconId });
  }

  /**
   * Loads and opens My Computer properties content from backend API.
   */
  async function onPropertiesClick() {
    setMenu((prev) => ({ ...prev, visible: false }));
    setError("");
    setIsLoading(true);
    bringWindowToFront("properties");

    try {
      const data = await fetchSiteInfo();
      setSiteInfo(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function closeProperties() {
    setSiteInfo(null);
    setError("");
  }

  function openExplorer() {
    bringWindowToFront("explorer");
    setExplorerOpen(true);
  }

  function closeExplorer() {
    setExplorerOpen(false);
  }

  function openReadme() {
    bringWindowToFront("notepad");
    setNotepadOpen(true);
  }

  function closeReadme() {
    setNotepadOpen(false);
  }

  function openCmd() {
    bringWindowToFront("cmd");
    setCmdOpen(true);
  }

  function closeCmd() {
    setCmdOpen(false);
  }

  function openPaint() {
    bringWindowToFront("paint");
    setPaintOpen(true);
    setStartMenuOpen(false);
  }

  function closePaint() {
    setPaintOpen(false);
  }

  /**
   * Sends command prompt input to Gemini, then appends response lines.
   */
  async function submitCmd() {
    const prompt = cmdInput.trim();
    if (!prompt || cmdBusy) {
      return;
    }

    setCmdInput("");
    setCmdBusy(true);
    setCmdLines((prev) => [...prev, { kind: "user", text: `C:\\> ${prompt}` }]);

    if (!geminiApiKey.trim()) {
      setCmdLines((prev) => [
        ...prev,
        { kind: "error", text: "Gemini API key missing. Open Gemini API Key shortcut and save a key first." },
      ]);
      setCmdBusy(false);
      return;
    }

    try {
      const { ok, payload } = await queryGeminiFromCmd({ apiKey: geminiApiKey.trim(), prompt });
      if (!ok) {
        throw new Error(payload?.message || "Gemini request failed.");
      }
      setCmdLines((prev) => [
        ...prev,
        { kind: "gemini", text: formatGeminiOutputForCmd(payload.response) },
      ]);
    } catch (err) {
      setCmdLines((prev) => [...prev, { kind: "error", text: err?.message || "Gemini request failed." }]);
    } finally {
      setCmdBusy(false);
    }
  }

  function openGeminiKey() {
    // Copy saved key into draft so users can view/edit current session value.
    bringWindowToFront("gemini");
    setGeminiDraft(geminiApiKey);
    setDogCustomMessage("");
    setGeminiOpen(true);
  }

  function closeGeminiKey() {
    setGeminiOpen(false);
  }

  function saveGeminiKey() {
    const trimmed = geminiDraft.trim();
    if (!trimmed) {
      setDogCustomMessage("I need a Gemini API key before I can save it.");
      setDogBubbleOpen(true);
      return;
    }
    setDogCustomMessage("");
    setGeminiApiKey(trimmed);
    setGeminiOpen(false);
    void pingGeminiStatus(trimmed);
  }

  function openPinball() {
    // Pinball re-centers each open so fixed-aspect gameplay stays fully visible.
    const nextPinballSize = getResponsivePinballSize();
    const centeredX = Math.floor((window.innerWidth - nextPinballSize.width) / 2);
    const centeredY = Math.max(12, Math.floor((window.innerHeight - TASKBAR_HEIGHT - nextPinballSize.height) / 2));
    const nextPinballPos = clampPinballPositionToViewport(
      centeredX,
      centeredY,
      nextPinballSize.width,
      nextPinballSize.height
    );
    setPinballSize(nextPinballSize);
    setPinballPos(nextPinballPos);
    bringWindowToFront("pinball");
    setPinballOpen(true);
    setStartMenuOpen(false);
  }

  function closePinball() {
    setPinballOpen(false);
  }

  function openTetris() {
    bringWindowToFront("tetris");
    setTetrisOpen(true);
    setStartMenuOpen(false);
  }

  function closeTetris() {
    setTetrisOpen(false);
  }

  function onDogClick() {
    setDogCustomMessage("");
    setDogBubbleOpen((prevOpen) => {
      if (prevOpen) {
        setDogMessageIndex((prev) => (prev + 1) % CLIPPY_MESSAGES.length);
      }
      return !prevOpen;
    });
  }

  function changeReadmeFontSize(delta) {
    setReadmeFontSize((prev) => Math.min(28, Math.max(10, prev + delta)));
  }

  function changeCmdFontSize(delta) {
    setCmdFontSize((prev) => Math.min(26, Math.max(11, prev + delta)));
  }

  function onDeleteIconClick() {
    if (!menu.targetId) {
      return;
    }

    setIcons((prev) => prev.filter((icon) => icon.id !== menu.targetId));
    setMenu({ visible: false, x: 0, y: 0, targetId: null });
  }

  /**
   * Centralized drag start helper used by all draggable windows/widgets/icons.
   */
  function beginDrag(nextDragState) {
    dragState.current = nextDragState;
    document.body.classList.add("is-dragging");
  }

  /**
   * Begins moving a window by its header bar.
   */
  function startWindowDrag(event, target, ref) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    beginDrag({
      target,
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  }

  /**
   * Begins resize interactions for windows that expose bottom-right handles.
   */
  function startResizeDrag(event, target, startWidth, startHeight) {
    if (event.button !== 0) {
      return;
    }

    beginDrag({
      target,
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth,
      startHeight,
    });
  }

  function onWindowHeaderPointerDown(event) {
    startWindowDrag(event, "window", windowRef);
  }

  function onExplorerHeaderPointerDown(event) {
    startWindowDrag(event, "explorer-window", explorerRef);
  }

  function onExplorerResizePointerDown(event) {
    startResizeDrag(event, "explorer-resize", explorerSize.width, explorerSize.height);
  }

  function onNotepadResizePointerDown(event) {
    startResizeDrag(event, "notepad-resize", notepadSize.width, notepadSize.height);
  }

  function onNotepadHeaderPointerDown(event) {
    startWindowDrag(event, "notepad-window", notepadRef);
  }

  function onCmdResizePointerDown(event) {
    startResizeDrag(event, "cmd-resize", cmdSize.width, cmdSize.height);
  }

  function onCmdHeaderPointerDown(event) {
    startWindowDrag(event, "cmd-window", cmdRef);
  }

  function onPinballHeaderPointerDown(event) {
    startWindowDrag(event, "pinball-window", pinballRef);
  }

  function onGeminiHeaderPointerDown(event) {
    startWindowDrag(event, "gemini-window", geminiRef);
  }

  function onTetrisHeaderPointerDown(event) {
    startWindowDrag(event, "tetris-window", tetrisRef);
  }

  function onPaintHeaderPointerDown(event) {
    startWindowDrag(event, "paint-window", paintRef);
  }

  function onPaintResizePointerDown(event) {
    startResizeDrag(event, "paint-resize", paintSize.width, paintSize.height);
  }

  function onDesktopGeminiStatusPointerDown(event) {
    startWindowDrag(event, "desktop-gemini-status", desktopGeminiRef);
  }

  function onIconPointerDown(event, iconId) {
    if (event.button !== 0) {
      return;
    }

    const desktopRect = desktopRef.current?.getBoundingClientRect();
    if (!desktopRect) {
      return;
    }

    const icon = icons.find((item) => item.id === iconId);
    if (!icon) {
      return;
    }

    const pointerX = event.clientX - desktopRect.left;
    const pointerY = event.clientY - desktopRect.top;
    // Store pointer-to-icon offset so icon does not "jump" under cursor while dragging.
    beginDrag({
      target: "icon",
      id: iconId,
      offsetX: pointerX - icon.x,
      offsetY: pointerY - icon.y,
    });
  }

  // Taskbar list is derived state from each window's open condition.
  const openTaskbarItems = [
    (isLoading || error || siteInfo) && { id: WINDOW_IDS.PROPERTIES, label: "My Computer Properties", kind: WINDOW_IDS.PROPERTIES },
    explorerOpen && { id: WINDOW_IDS.EXPLORER, label: "My Computer", kind: WINDOW_IDS.EXPLORER },
    notepadOpen && { id: WINDOW_IDS.NOTEPAD, label: "readme.txt - Notepad", kind: WINDOW_IDS.NOTEPAD },
    cmdOpen && { id: WINDOW_IDS.CMD, label: "C:\\WINDOWS\\system32\\cmd.exe", kind: WINDOW_IDS.CMD },
    geminiOpen && { id: WINDOW_IDS.GEMINI, label: "Gemini API Key", kind: WINDOW_IDS.GEMINI },
    paintOpen && { id: WINDOW_IDS.PAINT, label: "untitled - Paint", kind: WINDOW_IDS.PAINT },
    pinballOpen && { id: WINDOW_IDS.PINBALL, label: "3D Pinball", kind: WINDOW_IDS.PINBALL },
    tetrisOpen && { id: WINDOW_IDS.TETRIS, label: "Tetris", kind: WINDOW_IDS.TETRIS },
  ].filter(Boolean);
  // Highest visible window drives assistant layering behavior.
  const openWindowIds = new Set(openTaskbarItems.map((item) => item.id));
  const topOpenWindowId = [...windowStack].reverse().find((id) => openWindowIds.has(id)) || null;
  const clippyZIndex = CLIPPY_TOP_WINDOW_IDS.has(topOpenWindowId) ? 90 : 26;

  function onTaskbarWindowClick(windowId) {
    bringWindowToFront(windowId);
    setStartMenuOpen(false);
  }

  function onDesktopGeminiRefresh(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    void pingGeminiStatus(geminiApiKey.trim());
  }

  const iconDoubleClickHandlers = {
    computer: openExplorer,
    readme: openReadme,
    cmd: openCmd,
    gemini: openGeminiKey,
    paint: openPaint,
    pinball: openPinball,
    tetris: openTetris,
  };
  const startMenuActions = {
    openPaint,
    openPinball,
    openTetris,
  };

  return (
    // Desktop root hosts floating widgets, draggable icons, app windows, and taskbar.
    <main ref={desktopRef} className="desktop">
      <DesktopGeminiStatusWidget
        statusRef={desktopGeminiRef}
        status={geminiStatus}
        position={desktopGeminiPos}
        onPointerDown={onDesktopGeminiStatusPointerDown}
        onRefresh={onDesktopGeminiRefresh}
      />
      <DesktopIcons
        icons={icons}
        onIconPointerDown={onIconPointerDown}
        onIconRightClick={onIconRightClick}
        iconDoubleClickHandlers={iconDoubleClickHandlers}
      />
      <ClippyAssistant
        zIndex={clippyZIndex}
        bubbleOpen={dogBubbleOpen}
        customMessage={dogCustomMessage}
        messageIndex={dogMessageIndex}
        onToggle={onDogClick}
      />
      <IconContextMenu
        menu={menu}
        onPropertiesClick={onPropertiesClick}
        onDeleteIconClick={onDeleteIconClick}
      />

      <PropertiesWindow
        open={isLoading || Boolean(error) || Boolean(siteInfo)}
        windowRef={windowRef}
        position={windowPos}
        zIndex={getWindowZ("properties")}
        onFocus={() => bringWindowToFront("properties")}
        onHeaderPointerDown={onWindowHeaderPointerDown}
        onClose={closeProperties}
        isLoading={isLoading}
        error={error}
        siteInfo={siteInfo}
      />
      <ExplorerWindow
        open={explorerOpen}
        explorerRef={explorerRef}
        position={explorerPos}
        size={explorerSize}
        zIndex={getWindowZ("explorer")}
        onFocus={() => bringWindowToFront("explorer")}
        onHeaderPointerDown={onExplorerHeaderPointerDown}
        onClose={closeExplorer}
        onResizePointerDown={onExplorerResizePointerDown}
      />
      <NotepadWindow
        open={notepadOpen}
        notepadRef={notepadRef}
        position={notepadPos}
        size={notepadSize}
        zIndex={getWindowZ("notepad")}
        onFocus={() => bringWindowToFront("notepad")}
        onHeaderPointerDown={onNotepadHeaderPointerDown}
        onClose={closeReadme}
        onResizePointerDown={onNotepadResizePointerDown}
        readmeContent={readmeContent}
        onChangeReadmeContent={setReadmeContent}
        readmeFontSize={readmeFontSize}
        onChangeReadmeFontSize={changeReadmeFontSize}
      />
      <CmdWindow
        open={cmdOpen}
        cmdRef={cmdRef}
        cmdOutputRef={cmdOutputRef}
        position={cmdPos}
        size={cmdSize}
        zIndex={getWindowZ("cmd")}
        onFocus={() => bringWindowToFront("cmd")}
        onHeaderPointerDown={onCmdHeaderPointerDown}
        onClose={closeCmd}
        onResizePointerDown={onCmdResizePointerDown}
        cmdFontSize={cmdFontSize}
        onChangeCmdFontSize={changeCmdFontSize}
        cmdLines={cmdLines}
        cmdBusy={cmdBusy}
        cmdInput={cmdInput}
        onChangeCmdInput={setCmdInput}
        onSubmit={() => void submitCmd()}
      />
      <GeminiKeyWindow
        open={geminiOpen}
        geminiRef={geminiRef}
        position={geminiPos}
        zIndex={getWindowZ("gemini")}
        onFocus={() => bringWindowToFront("gemini")}
        onHeaderPointerDown={onGeminiHeaderPointerDown}
        onClose={closeGeminiKey}
        geminiDraft={geminiDraft}
        onChangeGeminiDraft={setGeminiDraft}
        onSaveGeminiKey={saveGeminiKey}
        geminiStatusMessage={geminiStatusMessage}
        geminiApiKey={geminiApiKey}
      />
      <PaintWindow
        open={paintOpen}
        paintRef={paintRef}
        position={paintPos}
        size={paintSize}
        zIndex={getWindowZ("paint")}
        onFocus={() => bringWindowToFront("paint")}
        onHeaderPointerDown={onPaintHeaderPointerDown}
        onClose={closePaint}
        onResizePointerDown={onPaintResizePointerDown}
      />
      <PinballWindow
        open={pinballOpen}
        pinballRef={pinballRef}
        position={pinballPos}
        size={pinballSize}
        zIndex={getWindowZ("pinball")}
        onFocus={() => bringWindowToFront("pinball")}
        onHeaderPointerDown={onPinballHeaderPointerDown}
        onClose={closePinball}
      >
        <PinballGame isOpen={pinballOpen} />
      </PinballWindow>
      <TetrisWindow
        open={tetrisOpen}
        tetrisRef={tetrisRef}
        position={tetrisPos}
        zIndex={getWindowZ("tetris")}
        onFocus={() => bringWindowToFront("tetris")}
        onHeaderPointerDown={onTetrisHeaderPointerDown}
        onClose={closeTetris}
      >
        <TetrisGame isOpen={tetrisOpen} />
      </TetrisWindow>

      <StartMenu
        isOpen={startMenuOpen}
        actions={startMenuActions}
      />
      <Taskbar
        openTaskbarItems={openTaskbarItems}
        onStartButtonClick={onStartButtonClick}
        onTaskbarWindowClick={onTaskbarWindowClick}
      />
    </main>
  );
}


export default App;
