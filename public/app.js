const { useEffect, useRef, useState } = React;

window.XPDesktop = window.XPDesktop || {};
const {
  PinballGame,
  TetrisGame,
  DEFAULT_ICONS,
  CLIPPY_MESSAGES,
  calculateResponsivePinballSize,
  formatGeminiOutputForCmd,
} = window.XPDesktop;

function App() {
  const GEMINI_KEY_GLOBAL = "__geminiApiKeySession";
  const TASKBAR_HEIGHT = 40;
  const ICON_WIDTH = 92;
  const ICON_HEIGHT = 96;
  const ICON_GAP = 14;
  const DESKTOP_PADDING = 12;
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
    "properties",
    "explorer",
    "notepad",
    "cmd",
    "gemini",
    "pinball",
    "tetris",
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

  function renderIconGraphic(type) {
    if (type === "computer") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="10" width="48" height="31" rx="4" fill="#bfd9ff" stroke="#2d5f9f" strokeWidth="2" />
          <rect x="12" y="14" width="40" height="21" fill="#65a9f0" />
          <rect x="26" y="41" width="12" height="7" fill="#bec6d1" stroke="#6e7482" strokeWidth="1.5" />
          <rect x="18" y="48" width="28" height="6" rx="2" fill="#d6dde8" stroke="#79808d" strokeWidth="1.5" />
        </svg>
      );
    }

    if (type === "recycle-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M22 16h20l3 6H19l3-6z" fill="#d3def0" stroke="#5f6c84" strokeWidth="1.5" />
          <rect x="18" y="22" width="28" height="30" rx="4" fill="#eaf0fb" stroke="#67748e" strokeWidth="2" />
          <path d="M24 27h4v19h-4zM30 27h4v19h-4zM36 27h4v19h-4z" fill="#a9b9d8" />
        </svg>
      );
    }

    if (type === "cmd-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="8" y="14" width="48" height="34" rx="4" fill="#0f1a2b" stroke="#4d647f" strokeWidth="2" />
          <path d="M17 30l6-5-6-5" fill="none" stroke="#d8e9ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 34h14" stroke="#d8e9ff" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="22" y="48" width="20" height="6" rx="2" fill="#c6d6ea" stroke="#7185a0" strokeWidth="1.5" />
        </svg>
      );
    }

    if (type === "gemini-shortcut") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="geminiBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4dcff" />
              <stop offset="100%" stopColor="#baa1ee" />
            </linearGradient>
          </defs>
          <path d="M32 8l8 14 14 8-14 8-8 14-8-14-14-8 14-8z" fill="url(#geminiBg)" stroke="#6d5aa4" strokeWidth="2" />
          <circle cx="32" cy="30" r="5" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    }

    if (type === "pinball-app") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="pinballBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5db2ff" />
              <stop offset="100%" stopColor="#184f96" />
            </linearGradient>
          </defs>
          <rect x="10" y="8" width="44" height="48" rx="8" fill="url(#pinballBg)" stroke="#2e4f7a" strokeWidth="2" />
          <circle cx="32" cy="23" r="8" fill="#ffd97e" stroke="#9b5f16" strokeWidth="2" />
          <rect x="16" y="39" width="14" height="5" rx="2" fill="#e8f5ff" />
          <rect x="34" y="39" width="14" height="5" rx="2" fill="#e8f5ff" />
        </svg>
      );
    }

    if (type === "tetris-app") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="10" y="10" width="44" height="44" rx="6" fill="#0f1f3a" stroke="#4a6ca2" strokeWidth="2" />
          <rect x="16" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="26" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="36" y="18" width="10" height="10" fill="#45d8ff" />
          <rect x="26" y="30" width="10" height="10" fill="#ff5b66" />
          <rect x="36" y="30" width="10" height="10" fill="#ff5b66" />
          <rect x="16" y="40" width="10" height="10" fill="#ffe34f" />
          <rect x="26" y="40" width="10" height="10" fill="#ffe34f" />
        </svg>
      );
    }

    if (type === "text-file") {
      return (
        <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M16 7h30l9 9v41H16z" fill="#ffffff" stroke="#738ba8" strokeWidth="2" />
          <path d="M46 7v9h9" fill="#e0ecfb" />
          <rect x="20" y="13" width="22" height="6" rx="1.5" fill="#4f87cd" />
          <path d="M22 27h26M22 33h26M22 39h21" stroke="#3b6fa9" strokeWidth="2" />
          <rect x="18" y="46" width="35" height="2" fill="#d7e4f5" />
        </svg>
      );
    }

    return (
      <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="8" y="8" width="48" height="48" rx="6" fill="#d5e6ff" stroke="#3b6aa8" strokeWidth="2" />
        <path d="M18 30h28" stroke="#5b7fae" strokeWidth="2" />
      </svg>
    );
  }

  const openTaskbarItems = [
    (isLoading || error || siteInfo) && { id: "properties", label: "My Computer Properties", kind: "properties" },
    explorerOpen && { id: "explorer", label: "My Computer", kind: "explorer" },
    notepadOpen && { id: "notepad", label: "readme.txt - Notepad", kind: "notepad" },
    cmdOpen && { id: "cmd", label: "C:\\WINDOWS\\system32\\cmd.exe", kind: "cmd" },
    geminiOpen && { id: "gemini", label: "Gemini API Key", kind: "gemini" },
    pinballOpen && { id: "pinball", label: "3D Pinball", kind: "pinball" },
    tetrisOpen && { id: "tetris", label: "Tetris", kind: "tetris" },
  ].filter(Boolean);
  const openWindowIds = new Set(openTaskbarItems.map((item) => item.id));
  const topOpenWindowId = [...windowStack].reverse().find((id) => openWindowIds.has(id)) || null;
  const clippyTopWindowIds = new Set(["gemini", "cmd"]);
  const clippyZIndex = clippyTopWindowIds.has(topOpenWindowId) ? 90 : 26;

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

  return (
    <main ref={desktopRef} className="desktop">
      <section
        ref={desktopGeminiRef}
        className="desktop-gemini-status"
        style={{ left: desktopGeminiPos.x, top: desktopGeminiPos.y }}
        onPointerDown={onDesktopGeminiStatusPointerDown}
        onContextMenu={onDesktopGeminiRefresh}
        aria-label="Gemini connection status"
      >
        <span className={`gemini-status-chip gemini-status-chip--${geminiStatus}`} aria-live="polite">
          <span className="gemini-status-robot" aria-hidden="true">🤖</span>
          <span>
            {geminiStatus === "active"
              ? "Active"
              : geminiStatus === "checking"
                ? "Checking"
                : "Inactive"}
          </span>
        </span>
        <button
          className="gemini-refresh-btn"
          type="button"
          aria-label="Refresh Gemini status"
          title="Refresh Gemini status"
          onClick={onDesktopGeminiRefresh}
        >
          ↻
        </button>
      </section>

      {icons.map((icon) => (
        <div
          key={icon.id}
          className={`icon ${icon.type.endsWith("shortcut") ? "icon--shortcut" : ""}`}
          style={{ left: icon.x, top: icon.y }}
          onPointerDown={(event) => onIconPointerDown(event, icon.id)}
          onDoubleClick={
            icon.id === "computer"
              ? openExplorer
              : icon.id === "readme"
                ? openReadme
              : icon.id === "cmd"
                ? openCmd
                : icon.id === "gemini"
                  ? openGeminiKey
                : icon.id === "pinball"
                  ? openPinball
                  : icon.id === "tetris"
                    ? openTetris
                  : undefined
          }
          onContextMenu={
            icon.id === "computer" || icon.id === "recycle" || icon.id === "cmd"
              ? (event) => onIconRightClick(event, icon.id)
              : undefined
          }
          aria-label={`${icon.label} icon`}
        >
          <div className="icon-image" title={icon.label}>
            {renderIconGraphic(icon.type)}
          </div>
          <div className="icon-label">{icon.label}</div>
        </div>
      ))}

      <section className="xp-dog" aria-label="Desktop assistant" style={{ zIndex: clippyZIndex }}>
        <button type="button" className="xp-dog-btn" onClick={onDogClick} aria-label="Toggle assistant bubble">
          <div className="xp-dog-sprite" aria-hidden="true">
            <svg className="xp-clippy-svg" viewBox="0 0 180 220" role="img" aria-label="Clippy">
              <g shapeRendering="crispEdges">
                <path
                  className="xp-clippy-body"
                  d="M96 20c32 0 58 25 58 56 0 21-11 38-28 48v56c0 17-14 31-30 31s-30-14-30-31V92c0-18 14-32 32-32s32 14 32 32v71c0 8-6 14-14 14s-14-6-14-14v-49"
                />
                <path
                  className="xp-clippy-shade"
                  d="M96 34c23 0 42 17 42 39 0 14-7 26-18 33v72c0 12-10 22-22 22s-22-10-22-22V93c0-12 10-21 22-21s22 9 22 21v66"
                />
                <g className="xp-clippy-eyes">
                  <ellipse className="xp-clippy-eye" cx="58" cy="58" rx="18" ry="12" transform="rotate(-11 58 58)" />
                  <ellipse className="xp-clippy-eye" cx="123" cy="62" rx="18" ry="12" transform="rotate(11 123 62)" />
                  <ellipse className="xp-clippy-pupil xp-clippy-pupil--left" cx="60" cy="60" rx="7" ry="5" />
                  <ellipse className="xp-clippy-pupil xp-clippy-pupil--right" cx="125" cy="64" rx="7" ry="5" />
                </g>
                <path className="xp-clippy-brow" d="M34 42h34" />
                <path className="xp-clippy-brow" d="M111 46h34" />
              </g>
            </svg>
          </div>
        </button>
        {dogBubbleOpen && (
          <div className="xp-dog-bubble" role="status" aria-live="polite">
            {dogCustomMessage || CLIPPY_MESSAGES[dogMessageIndex]}
          </div>
        )}
      </section>

      {menu.visible && (
        <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
          {menu.targetId === "computer" && (
            <button className="context-item" onClick={onPropertiesClick}>
              Properties
            </button>
          )}
          {(menu.targetId === "recycle" || menu.targetId === "cmd") && (
            <button className="context-item" onClick={onDeleteIconClick}>
              Delete
            </button>
          )}
        </div>
      )}

      {(isLoading || error || siteInfo) && (
        <section
          ref={windowRef}
          className="properties-window"
          style={{ left: windowPos.x, top: windowPos.y, zIndex: getWindowZ("properties") }}
          onPointerDown={() => bringWindowToFront("properties")}
          role="dialog"
          aria-label="Properties window"
        >
          <div className="window-header" onPointerDown={onWindowHeaderPointerDown}>
            <span className="window-title">My Computer Properties</span>
            <button className="close-btn" onClick={closeProperties} aria-label="Close">
              ×
            </button>
          </div>
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
        </section>
      )}

      {explorerOpen && (
        <section
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
          role="dialog"
          aria-label="File Explorer"
        >
          <div className="window-header" onPointerDown={onExplorerHeaderPointerDown}>
            <span className="window-title">My Computer</span>
            <button className="close-btn" onClick={closeExplorer} aria-label="Close Explorer">
              ×
            </button>
          </div>
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
          <div
            className="explorer-resize-handle"
            onPointerDown={onExplorerResizePointerDown}
            aria-hidden="true"
          />
        </section>
      )}

      {notepadOpen && (
        <section
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
          role="dialog"
          aria-label="Notepad"
        >
          <div className="window-header" onPointerDown={onNotepadHeaderPointerDown}>
            <span className="window-title">readme.txt - Notepad</span>
            <button className="close-btn" onClick={closeReadme} aria-label="Close Notepad">
              ×
            </button>
          </div>
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
          <div
            className="notepad-resize-handle"
            onPointerDown={onNotepadResizePointerDown}
            aria-hidden="true"
          />
        </section>
      )}

      {cmdOpen && (
        <section
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
          role="dialog"
          aria-label="Command Prompt"
        >
          <div className="window-header cmd-header" onPointerDown={onCmdHeaderPointerDown}>
            <span className="window-title">C:\WINDOWS\system32\cmd.exe</span>
            <div className="window-actions">
              <button className="toolbar-btn" type="button" onClick={() => changeCmdFontSize(-1)}>A-</button>
              <button className="toolbar-btn" type="button" onClick={() => changeCmdFontSize(1)}>A+</button>
              <button className="close-btn" onClick={closeCmd} aria-label="Close Command Prompt">
                ×
              </button>
            </div>
          </div>
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
          <div
            className="cmd-resize-handle"
            onPointerDown={onCmdResizePointerDown}
            aria-hidden="true"
          />
        </section>
      )}

      {geminiOpen && (
        <section
          ref={geminiRef}
          className="gemini-window"
          style={{ left: geminiPos.x, top: geminiPos.y, zIndex: getWindowZ("gemini") }}
          onPointerDown={() => bringWindowToFront("gemini")}
          role="dialog"
          aria-label="Gemini API Key"
        >
          <div className="window-header" onPointerDown={onGeminiHeaderPointerDown}>
            <span className="window-title">Gemini API Key</span>
            <button className="close-btn" onClick={closeGeminiKey} aria-label="Close Gemini API Key">
              ×
            </button>
          </div>
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
        </section>
      )}

      {pinballOpen && (
        <section
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
          role="dialog"
          aria-label="3D Pinball"
        >
          <div className="window-header" onPointerDown={onPinballHeaderPointerDown}>
            <span className="window-title">3D Pinball for Windows - Space Cadet</span>
            <div className="window-actions">
              <button className="close-btn" onClick={closePinball} aria-label="Close Pinball">
                ×
              </button>
            </div>
          </div>
          <PinballGame isOpen={pinballOpen} />
        </section>
      )}

      {tetrisOpen && (
        <section
          ref={tetrisRef}
          className="tetris-window"
          style={{ left: tetrisPos.x, top: tetrisPos.y, zIndex: getWindowZ("tetris") }}
          onPointerDown={() => bringWindowToFront("tetris")}
          role="dialog"
          aria-label="Tetris"
        >
          <div className="window-header" onPointerDown={onTetrisHeaderPointerDown}>
            <span className="window-title">Tetris</span>
            <button className="close-btn" onClick={closeTetris} aria-label="Close Tetris">
              ×
            </button>
          </div>
          <TetrisGame isOpen={tetrisOpen} />
        </section>
      )}

      {startMenuOpen && (
        <section className="start-menu" role="dialog" aria-label="Start menu" onClick={(event) => event.stopPropagation()}>
          <div className="start-menu-top">
            <div className="start-avatar" />
            <div className="start-user">harri</div>
          </div>
          <div className="start-menu-body">
            <div className="start-left">
              <button className="start-item" type="button">
                Internet
              </button>
              <button className="start-item" type="button">
                E-mail
              </button>
              <hr className="start-divider" />
              <button className="start-item" type="button">
                My Documents
              </button>
              <button className="start-item" type="button">
                My Pictures
              </button>
              <button className="start-item" type="button">
                My Music
              </button>
              <button className="start-item" type="button">
                My Recent Documents
              </button>
              <button className="start-item" type="button" onClick={openPinball}>
                3D Pinball
              </button>
              <button className="start-item" type="button" onClick={openTetris}>
                Tetris
              </button>
            </div>
            <div className="start-right">
              <button className="start-link" type="button">
                My Computer
              </button>
              <button className="start-link" type="button">
                Control Panel
              </button>
              <button className="start-link" type="button">
                Printers and Faxes
              </button>
              <button className="start-link" type="button">
                Help and Support
              </button>
              <button className="start-link" type="button">
                Search
              </button>
              <button className="start-link" type="button">
                Run...
              </button>
            </div>
          </div>
          <div className="start-menu-bottom">
            <button className="start-power" type="button">
              Turn Off Computer
            </button>
          </div>
        </section>
      )}

      <footer className="taskbar" aria-hidden="true">
        <button className="start-button" type="button" onClick={onStartButtonClick}>
          <span className="start-orb">
            <span className="orb-red" />
            <span className="orb-green" />
            <span className="orb-blue" />
            <span className="orb-yellow" />
          </span>
          <span className="start-text">start</span>
        </button>
        <div className="taskbar-segment">
          <div className="taskbar-windows">
            {openTaskbarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="taskbar-window-btn"
                onClick={() => onTaskbarWindowClick(item.kind)}
                title={item.label}
              >
                <span className={`taskbar-window-dot taskbar-window-dot--${item.kind}`} aria-hidden="true" />
                <span className="taskbar-window-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="taskbar-tray">
          <button className="tray-button" type="button">
            EN
          </button>
          <button className="tray-button tray-button-time" type="button">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date())}
          </button>
        </div>
      </footer>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
