import { useEffect, useRef, useState } from "react";
import { PinballGame, TetrisGame } from "./lib/games";
import { DEFAULT_ICONS, CLIPPY_MESSAGES } from "./lib/config";
import { calculateResponsivePinballSize, formatGeminiOutputForCmd } from "./lib/utils";
import WindowFrame from "./components/WindowFrame";
import {
  DesktopGeminiStatusWidget,
  DesktopIcons,
  ClippyAssistant,
  IconContextMenu,
  StartMenu,
  Taskbar,
} from "./components/DesktopShell";
import {
  APP_STORAGE_KEYS,
  DESKTOP_LAYOUT,
  WINDOW_IDS,
  CLIPPY_TOP_WINDOW_IDS,
} from "./constants/ui";

function App() {
  const GEMINI_KEY_GLOBAL = APP_STORAGE_KEYS.GEMINI_SESSION_KEY;
  const {
    TASKBAR_HEIGHT,
    ICON_WIDTH,
    ICON_HEIGHT,
    ICON_GAP,
    DESKTOP_PADDING,
  } = DESKTOP_LAYOUT;
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [pinballOpen, setPinballOpen] = useState(false);
  const [tetrisOpen, setTetrisOpen] = useState(false);
  const [windowStack, setWindowStack] = useState([
    WINDOW_IDS.PROPERTIES,
    WINDOW_IDS.EXPLORER,
    WINDOW_IDS.NOTEPAD,
    WINDOW_IDS.CMD,
    WINDOW_IDS.GEMINI,
    WINDOW_IDS.PINBALL,
    WINDOW_IDS.TETRIS,
  ]);
  const [dogBubbleOpen, setDogBubbleOpen] = useState(false);
  const [dogMessageIndex, setDogMessageIndex] = useState(0);
  const [dogCustomMessage, setDogCustomMessage] = useState("");
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
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const explorerRef = useRef(null);
  const notepadRef = useRef(null);
  const cmdRef = useRef(null);
  const cmdOutputRef = useRef(null);
  const geminiRef = useRef(null);
  const desktopGeminiRef = useRef(null);
  const pinballRef = useRef(null);
  const tetrisRef = useRef(null);

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

  function bringWindowToFront(windowId) {
    setWindowStack((prev) => [...prev.filter((id) => id !== windowId), windowId]);
  }

  function getWindowZ(windowId) {
    return 30 + windowStack.indexOf(windowId);
  }

  async function pingGeminiStatus(apiKey) {
    if (!apiKey) {
      setGeminiStatus("inactive");
      setGeminiStatusMessage("No API key validated yet.");
      return;
    }

    setGeminiStatus("checking");
    setGeminiStatusMessage("Pinging Gemini...");

    try {
      const response = await fetch("/api/validate-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const payload = await response.json();
      if (response.ok && payload?.ok) {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window[GEMINI_KEY_GLOBAL] = geminiApiKey;
    }
  }, [geminiApiKey]);

  useEffect(() => {
    if (!cmdOpen) {
      return;
    }
    const outputEl = cmdOutputRef.current;
    if (outputEl) {
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }, [cmdLines, cmdOpen]);

  useEffect(() => {
    const margin = 6;
    const top = 10;
    const chipWidth = desktopGeminiRef.current?.offsetWidth || 170;
    const nextX = Math.max(margin, window.innerWidth - chipWidth - margin);
    setDesktopGeminiPos({ x: nextX, y: top });
  }, []);

  useEffect(() => {
    function closeMenu() {
      setMenu((prev) => ({ ...prev, visible: false, targetId: null }));
      setStartMenuOpen(false);
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  function onStartButtonClick(event) {
    event.stopPropagation();
    setStartMenuOpen((prev) => !prev);
  }

  useEffect(() => {
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

      if (dragState.current.target === "desktop-gemini-status") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setDesktopGeminiPos(clampDesktopGeminiToViewport(nextX, nextY));
      }

      if (dragState.current.target === "explorer-resize") {
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

      if (dragState.current.target === "icon") {
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
      dragState.current.target = null;
      dragState.current.id = null;
      document.body.classList.remove("is-dragging");
    }

    function onResize() {
      setWindowPos((prev) => clampToViewport(prev.x, prev.y));
      setExplorerSize((prev) => clampExplorerSizeToViewport(prev.width, prev.height));
      setExplorerPos((prev) => clampExplorerToViewport(prev.x, prev.y));
      setNotepadSize((prev) => clampNotepadSizeToViewport(prev.width, prev.height));
      setNotepadPos((prev) => clampNotepadToViewport(prev.x, prev.y));
      setCmdSize((prev) => clampCmdSizeToViewport(prev.width, prev.height));
      setCmdPos((prev) => clampCmdToViewport(prev.x, prev.y));
      setGeminiPos((prev) => clampGeminiToViewport(prev.x, prev.y));
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

  async function onPropertiesClick() {
    setMenu((prev) => ({ ...prev, visible: false }));
    setError("");
    setIsLoading(true);
    bringWindowToFront("properties");

    try {
      const response = await fetch("/api/site-info");
      if (!response.ok) {
        throw new Error("Could not load properties.");
      }
      const data = await response.json();
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
      const response = await fetch("/api/cmd-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: geminiApiKey.trim(), prompt }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
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

  function onWindowHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (!windowRef.current) {
      return;
    }

    const rect = windowRef.current.getBoundingClientRect();
    dragState.current = {
      target: "window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onExplorerHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = explorerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "explorer-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onExplorerResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "explorer-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: explorerSize.width,
      startHeight: explorerSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function onNotepadResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "notepad-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: notepadSize.width,
      startHeight: notepadSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function onNotepadHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = notepadRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "notepad-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onCmdResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "cmd-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: cmdSize.width,
      startHeight: cmdSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function onCmdHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = cmdRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "cmd-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onPinballHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = pinballRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "pinball-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onGeminiHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = geminiRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "gemini-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onTetrisHeaderPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = tetrisRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "tetris-window",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
  }

  function onDesktopGeminiStatusPointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    const rect = desktopGeminiRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    dragState.current = {
      target: "desktop-gemini-status",
      id: null,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.classList.add("is-dragging");
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
    dragState.current = {
      target: "icon",
      id: iconId,
      offsetX: pointerX - icon.x,
      offsetY: pointerY - icon.y,
    };
    document.body.classList.add("is-dragging");
  }

  const openTaskbarItems = [
    (isLoading || error || siteInfo) && { id: WINDOW_IDS.PROPERTIES, label: "My Computer Properties", kind: WINDOW_IDS.PROPERTIES },
    explorerOpen && { id: WINDOW_IDS.EXPLORER, label: "My Computer", kind: WINDOW_IDS.EXPLORER },
    notepadOpen && { id: WINDOW_IDS.NOTEPAD, label: "readme.txt - Notepad", kind: WINDOW_IDS.NOTEPAD },
    cmdOpen && { id: WINDOW_IDS.CMD, label: "C:\\WINDOWS\\system32\\cmd.exe", kind: WINDOW_IDS.CMD },
    geminiOpen && { id: WINDOW_IDS.GEMINI, label: "Gemini API Key", kind: WINDOW_IDS.GEMINI },
    pinballOpen && { id: WINDOW_IDS.PINBALL, label: "3D Pinball", kind: WINDOW_IDS.PINBALL },
    tetrisOpen && { id: WINDOW_IDS.TETRIS, label: "Tetris", kind: WINDOW_IDS.TETRIS },
  ].filter(Boolean);
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
    pinball: openPinball,
    tetris: openTetris,
  };
  const startMenuActions = {
    openPinball,
    openTetris,
  };

  return (
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

      {(isLoading || error || siteInfo) && (
        <WindowFrame
          ref={windowRef}
          className="properties-window"
          style={{ left: windowPos.x, top: windowPos.y, zIndex: getWindowZ("properties") }}
          onPointerDown={() => bringWindowToFront("properties")}
          ariaLabel="Properties window"
          onHeaderPointerDown={onWindowHeaderPointerDown}
          title="My Computer Properties"
          onClose={closeProperties}
          closeAriaLabel="Close"
        >
          <div className="window-body">
            {isLoading && <p>Loading properties...</p>}
            {error && <p>{error}</p>}
            {siteInfo && (
              <>
                <div className="row">
                  <span className="label">Owner:</span>
                  <span>{siteInfo.owner}</span>
                </div>
                <div className="row">
                  <span className="label">Storage:</span>
                  <span>{siteInfo.storage}</span>
                </div>
                <div className="row">
                  <span className="label">Additional cool information:</span>
                  <ul className="list">
                    {siteInfo.coolInfo.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="row">
                  <span className="label">Status:</span>
                  <span>{siteInfo.uptimeHint}</span>
                </div>
              </>
            )}
          </div>
        </WindowFrame>
      )}

      {explorerOpen && (
        <WindowFrame
          ref={explorerRef}
          className="explorer-window"
          style={{
            left: explorerPos.x,
            top: explorerPos.y,
            width: explorerSize.width,
            height: explorerSize.height,
            zIndex: getWindowZ("explorer"),
          }}
          onPointerDown={() => bringWindowToFront("explorer")}
          ariaLabel="File Explorer"
          onHeaderPointerDown={onExplorerHeaderPointerDown}
          title="My Computer"
          onClose={closeExplorer}
          closeAriaLabel="Close Explorer"
          resizeHandle={(
            <div
              className="explorer-resize-handle"
              onPointerDown={onExplorerResizePointerDown}
              aria-hidden="true"
            />
          )}
        >
          <div className="explorer-toolbar">
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🔍
              </span>
              <span>Search</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ⭐
              </span>
              <span>Favorites</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🕘
              </span>
              <span>History</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                🌐
              </span>
              <span>Channels</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ⛶
              </span>
              <span>Fullscreen</span>
            </button>
            <button className="toolbar-btn toolbar-btn--icon" type="button">
              <span className="tool-icon" aria-hidden="true">
                ✉️
              </span>
              <span>Mail</span>
            </button>
          </div>
          <div className="explorer-body">
            <aside className="explorer-sidebar">
              <div className="sidebar-title">Tasks</div>
              <div className="sidebar-item">System Tasks</div>
              <div className="sidebar-item">Other Places</div>
              <div className="sidebar-item">Details</div>
            </aside>
            <div className="explorer-content">
              <div className="explorer-path">C:\</div>
              <div className="explorer-empty">This folder is empty.</div>
            </div>
          </div>
        </WindowFrame>
      )}

      {notepadOpen && (
        <WindowFrame
          ref={notepadRef}
          className="notepad-window"
          style={{
            left: notepadPos.x,
            top: notepadPos.y,
            width: notepadSize.width,
            height: notepadSize.height,
            zIndex: getWindowZ("notepad"),
          }}
          onPointerDown={() => bringWindowToFront("notepad")}
          ariaLabel="Notepad"
          onHeaderPointerDown={onNotepadHeaderPointerDown}
          title="readme.txt - Notepad"
          onClose={closeReadme}
          closeAriaLabel="Close Notepad"
          resizeHandle={(
            <div
              className="notepad-resize-handle"
              onPointerDown={onNotepadResizePointerDown}
              aria-hidden="true"
            />
          )}
        >
          <div className="notepad-toolbar">
            <button className="toolbar-btn" type="button">File</button>
            <button className="toolbar-btn" type="button">Edit</button>
            <button className="toolbar-btn" type="button">Format</button>
            <button className="toolbar-btn" type="button">View</button>
            <button className="toolbar-btn" type="button">Help</button>
            <span className="toolbar-spacer" />
            <button className="toolbar-btn" type="button" onClick={() => changeReadmeFontSize(-1)}>A-</button>
            <button className="toolbar-btn" type="button" onClick={() => changeReadmeFontSize(1)}>A+</button>
          </div>
          <div className="notepad-body">
            <textarea
              className="notepad-editor"
              value={readmeContent}
              onChange={(event) => setReadmeContent(event.target.value)}
              style={{ fontSize: `${readmeFontSize}px` }}
              spellCheck={false}
            />
          </div>
        </WindowFrame>
      )}

      {cmdOpen && (
        <WindowFrame
          ref={cmdRef}
          className="cmd-window"
          style={{
            left: cmdPos.x,
            top: cmdPos.y,
            width: cmdSize.width,
            height: cmdSize.height,
            zIndex: getWindowZ("cmd"),
          }}
          onPointerDown={() => bringWindowToFront("cmd")}
          ariaLabel="Command Prompt"
          headerClassName="window-header cmd-header"
          onHeaderPointerDown={onCmdHeaderPointerDown}
          title="C:\\WINDOWS\\system32\\cmd.exe"
          showDefaultClose={false}
          headerActions={(
            <div className="window-actions">
              <button className="toolbar-btn" type="button" onClick={() => changeCmdFontSize(-1)}>A-</button>
              <button className="toolbar-btn" type="button" onClick={() => changeCmdFontSize(1)}>A+</button>
              <button className="close-btn" onClick={closeCmd} aria-label="Close Command Prompt">
                ×
              </button>
            </div>
          )}
          resizeHandle={(
            <div
              className="cmd-resize-handle"
              onPointerDown={onCmdResizePointerDown}
              aria-hidden="true"
            />
          )}
        >
          <div className="cmd-body">
            <div className="cmd-output" ref={cmdOutputRef} style={{ fontSize: `${cmdFontSize}px` }}>
              {cmdLines.map((line, index) => (
                <div key={`cmd-line-${index}`} className={`cmd-line cmd-line--${line.kind}`}>
                  {line.text}
                </div>
              ))}
              {cmdBusy && <div className="cmd-line cmd-line--system">Gemini is thinking...</div>}
            </div>
            <form
              className="cmd-input-row"
              style={{ fontSize: `${cmdFontSize}px` }}
              onSubmit={(event) => {
                event.preventDefault();
                void submitCmd();
              }}
            >
              <span className="cmd-prompt">C:\&gt;</span>
              <input
                className="cmd-input"
                type="text"
                value={cmdInput}
                onChange={(event) => setCmdInput(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={cmdBusy}
              />
            </form>
          </div>
        </WindowFrame>
      )}

      {geminiOpen && (
        <WindowFrame
          ref={geminiRef}
          className="gemini-window"
          style={{ left: geminiPos.x, top: geminiPos.y, zIndex: getWindowZ("gemini") }}
          onPointerDown={() => bringWindowToFront("gemini")}
          ariaLabel="Gemini API Key"
          onHeaderPointerDown={onGeminiHeaderPointerDown}
          title="Gemini API Key"
          onClose={closeGeminiKey}
          closeAriaLabel="Close Gemini API Key"
        >
          <div className="window-body">
            <div className="row">
              <span className="label">API Key:</span>
            </div>
            <input
              className="gemini-input"
              type="text"
              value={geminiDraft}
              onChange={(event) => setGeminiDraft(event.target.value)}
              placeholder="Paste your Gemini API key"
            />
            <div className="gemini-actions">
              <button className="toolbar-btn" type="button" onClick={saveGeminiKey}>
                Save Key
              </button>
              <button className="toolbar-btn" type="button" onClick={closeGeminiKey}>
                Close
              </button>
            </div>
            <div className="gemini-status">
              <div>Connection: {geminiStatusMessage}</div>
              <div>Current session key: {geminiApiKey || "(none)"}</div>
            </div>
          </div>
        </WindowFrame>
      )}

      {pinballOpen && (
        <WindowFrame
          ref={pinballRef}
          className="pinball-window"
          style={{
            left: pinballPos.x,
            top: pinballPos.y,
            width: pinballSize.width,
            height: pinballSize.height,
            zIndex: getWindowZ("pinball"),
          }}
          onPointerDown={() => bringWindowToFront("pinball")}
          ariaLabel="3D Pinball"
          onHeaderPointerDown={onPinballHeaderPointerDown}
          title="3D Pinball for Windows - Space Cadet"
          onClose={closePinball}
          closeAriaLabel="Close Pinball"
        >
          <PinballGame isOpen={pinballOpen} />
        </WindowFrame>
      )}

      {tetrisOpen && (
        <WindowFrame
          ref={tetrisRef}
          className="tetris-window"
          style={{ left: tetrisPos.x, top: tetrisPos.y, zIndex: getWindowZ("tetris") }}
          onPointerDown={() => bringWindowToFront("tetris")}
          ariaLabel="Tetris"
          onHeaderPointerDown={onTetrisHeaderPointerDown}
          title="Tetris"
          onClose={closeTetris}
          closeAriaLabel="Close Tetris"
        >
          <TetrisGame isOpen={tetrisOpen} />
        </WindowFrame>
      )}

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
