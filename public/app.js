const { useEffect, useRef, useState } = React;

function PinballGame({ isOpen, onFitWindow }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState("Press Space to launch");
  const gameRef = useRef(null);

  function resetBall(state) {
    state.ball = {
      x: 525,
      y: 332,
      vx: 0,
      vy: 0,
      r: 8,
      launched: false,
    };
  }

  function resetGame() {
    const next = {
      table: { w: 560, h: 360 },
      ball: null,
      bumpers: [
        { x: 178, y: 118, r: 20, points: 50 },
        { x: 284, y: 156, r: 24, points: 75 },
        { x: 392, y: 112, r: 20, points: 50 },
      ],
      leftPaddle: { x: 136, y: 320, w: 96, h: 14 },
      rightPaddle: { x: 328, y: 320, w: 96, h: 14 },
    };
    resetBall(next);
    gameRef.current = next;
    setScore(0);
    setLives(3);
    setStatus("Press Space to launch");
  }

  function launchBall() {
    const state = gameRef.current;
    if (!state || state.ball.launched) {
      return;
    }
    state.ball.launched = true;
    state.ball.vx = -4.6 - Math.random() * 1.6;
    state.ball.vy = -10.8;
    setStatus("Use \u2190 and \u2192 to control flippers");
  }

  useEffect(() => {
    if (!isOpen) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    resetGame();

    function onKeyDown(event) {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = true;
      }
      if (event.key === "ArrowRight") {
        keysRef.current.right = true;
      }
      if (event.code === "Space") {
        event.preventDefault();
        launchBall();
      }
      if (event.key.toLowerCase() === "r") {
        resetGame();
      }
    }

    function onKeyUp(event) {
      if (event.key === "ArrowLeft") {
        keysRef.current.left = false;
      }
      if (event.key === "ArrowRight") {
        keysRef.current.right = false;
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return undefined;
    }

    function reflect(velocityX, velocityY, normalX, normalY) {
      const dot = velocityX * normalX + velocityY * normalY;
      return {
        x: velocityX - 2 * dot * normalX,
        y: velocityY - 2 * dot * normalY,
      };
    }

    function animate() {
      const state = gameRef.current;
      if (!state) {
        return;
      }

      const { table, ball, bumpers, leftPaddle, rightPaddle } = state;
      const activeLeftY = keysRef.current.left ? 304 : 320;
      const activeRightY = keysRef.current.right ? 304 : 320;

      if (ball.launched) {
        ball.vy += 0.19;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r <= 10) {
        ball.x = 10 + ball.r;
        ball.vx = Math.abs(ball.vx) * 0.98;
      }
      if (ball.x + ball.r >= table.w - 10) {
        ball.x = table.w - 10 - ball.r;
        ball.vx = -Math.abs(ball.vx) * 0.98;
      }
      if (ball.y - ball.r <= 10) {
        ball.y = 10 + ball.r;
        ball.vy = Math.abs(ball.vy) * 0.98;
      }

      bumpers.forEach((bumper) => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.hypot(dx, dy);
        const overlap = ball.r + bumper.r - distance;
        if (overlap > 0) {
          const nx = dx / (distance || 1);
          const ny = dy / (distance || 1);
          ball.x += nx * overlap;
          ball.y += ny * overlap;
          const reflected = reflect(ball.vx, ball.vy, nx, ny);
          ball.vx = reflected.x * 1.05;
          ball.vy = reflected.y * 1.05;
          setScore((prev) => prev + bumper.points);
        }
      });

      function paddleBounce(paddleX, paddleY, width, isLeft) {
        const paddleTop = paddleY;
        const paddleBottom = paddleY + 14;
        if (
          ball.y + ball.r >= paddleTop &&
          ball.y - ball.r <= paddleBottom &&
          ball.x >= paddleX &&
          ball.x <= paddleX + width &&
          ball.vy > 0
        ) {
          ball.y = paddleTop - ball.r - 0.5;
          const hitPos = (ball.x - (paddleX + width / 2)) / (width / 2);
          const push = isLeft ? -0.8 : 0.8;
          ball.vx = ball.vx * 0.55 + hitPos * 4.8 + push;
          ball.vy = -Math.abs(ball.vy) * 0.92 - 1.1;
          setScore((prev) => prev + 10);
        }
      }

      paddleBounce(leftPaddle.x, activeLeftY, leftPaddle.w, true);
      paddleBounce(rightPaddle.x, activeRightY, rightPaddle.w, false);

      if (ball.y - ball.r > table.h + 24) {
        setLives((prev) => {
          const nextLives = prev - 1;
          if (nextLives <= 0) {
            setStatus("Game over. Press R to restart");
            resetGame();
            return 3;
          }
          setStatus("Ball lost. Press Space to relaunch");
          resetBall(state);
          return nextLives;
        });
      }

      ctx.clearRect(0, 0, table.w, table.h);
      const bg = ctx.createLinearGradient(0, 0, 0, table.h);
      bg.addColorStop(0, "#112f68");
      bg.addColorStop(0.6, "#1f5fb6");
      bg.addColorStop(1, "#2663b4");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, table.w, table.h);

      ctx.fillStyle = "#0a2d63";
      ctx.fillRect(10, 10, table.w - 20, table.h - 20);

      const lane = ctx.createLinearGradient(table.w - 68, 14, table.w - 14, table.h - 14);
      lane.addColorStop(0, "#2d88e3");
      lane.addColorStop(1, "#0c3f86");
      ctx.fillStyle = lane;
      ctx.fillRect(table.w - 64, 14, 50, table.h - 28);

      bumpers.forEach((bumper) => {
        const glow = ctx.createRadialGradient(bumper.x, bumper.y, 4, bumper.x, bumper.y, bumper.r);
        glow.addColorStop(0, "#fff3ad");
        glow.addColorStop(0.5, "#f89a42");
        glow.addColorStop(1, "#9f2b0d");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#e7f5ff";
      ctx.strokeStyle = "#335985";
      ctx.lineWidth = 2;
      ctx.fillRect(leftPaddle.x, activeLeftY, leftPaddle.w, leftPaddle.h);
      ctx.strokeRect(leftPaddle.x, activeLeftY, leftPaddle.w, leftPaddle.h);
      ctx.fillRect(rightPaddle.x, activeRightY, rightPaddle.w, rightPaddle.h);
      ctx.strokeRect(rightPaddle.x, activeRightY, rightPaddle.w, rightPaddle.h);

      ctx.fillStyle = "#f6fbff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isOpen]);

  return (
    <div className="pinball-game">
      <div className="pinball-toolbar">
        <span>Score: {score}</span>
        <span>Lives: {lives}</span>
        <button type="button" className="pinball-launch-btn" onClick={onFitWindow}>
          Fit to Window
        </button>
        <button type="button" className="pinball-launch-btn" onClick={launchBall}>
          Launch
        </button>
      </div>
      <canvas ref={canvasRef} className="pinball-canvas" width={560} height={360} />
      <div className="pinball-status">{status}</div>
    </div>
  );
}

const DEFAULT_ICONS = [
  { id: "computer", label: "My Computer", type: "computer" },
  { id: "recycle", label: "Recycle Bin", type: "recycle-shortcut" },
  { id: "cmd", label: "Command Prompt", type: "cmd-shortcut" },
  { id: "readme", label: "readme.txt", type: "text-file" },
  { id: "pinball", label: "3D Pinball", type: "pinball-app" },
];

function App() {
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
  const [pinballOpen, setPinballOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState(
    "Welcome to this Windows XP desktop web app.\n\nYou can edit this file. Changes stay until you refresh the page."
  );
  const [readmeFontSize, setReadmeFontSize] = useState(13);
  const [explorerPos, setExplorerPos] = useState({ x: 160, y: 78 });
  const [explorerSize, setExplorerSize] = useState({ width: 640, height: 430 });
  const [notepadPos, setNotepadPos] = useState({ x: 220, y: 110 });
  const [notepadSize, setNotepadSize] = useState({ width: 620, height: 440 });
  const [pinballPos, setPinballPos] = useState({ x: 200, y: 86 });
  const [pinballSize, setPinballSize] = useState({ width: 610, height: 500 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [icons, setIcons] = useState(() => DEFAULT_ICONS.map((icon, index) => ({ ...icon, x: 28, y: 36 + index * 110 })));
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const explorerRef = useRef(null);
  const notepadRef = useRef(null);
  const pinballRef = useRef(null);

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

    function clampPinballSizeToViewport(width, height, x, y) {
      const margin = 12;
      const minWidth = 460;
      const minHeight = 360;
      const pinballRect = pinballRef.current?.getBoundingClientRect();
      const left = x ?? pinballRect?.left ?? 200;
      const top = y ?? pinballRect?.top ?? 86;
      const maxWidth = Math.max(minWidth, window.innerWidth - left - margin);
      const maxHeight = Math.max(minHeight, window.innerHeight - TASKBAR_HEIGHT - top - margin);
      return {
        width: Math.min(Math.max(minWidth, width), maxWidth),
        height: Math.min(Math.max(minHeight, height), maxHeight),
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

      if (dragState.current.target === "pinball-window") {
        const nextX = event.clientX - dragState.current.offsetX;
        const nextY = event.clientY - dragState.current.offsetY;
        setPinballPos(clampPinballToViewport(nextX, nextY));
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

      if (dragState.current.target === "pinball-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setPinballSize(clampPinballSizeToViewport(nextWidth, nextHeight));
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
      setPinballSize((prev) => clampPinballSizeToViewport(prev.width, prev.height));
      setPinballPos((prev) => clampPinballToViewport(prev.x, prev.y));
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
    setExplorerOpen(true);
  }

  function closeExplorer() {
    setExplorerOpen(false);
  }

  function openReadme() {
    setNotepadOpen(true);
  }

  function closeReadme() {
    setNotepadOpen(false);
  }

  function openPinball() {
    setPinballOpen(true);
    setStartMenuOpen(false);
  }

  function closePinball() {
    setPinballOpen(false);
  }

  function changeReadmeFontSize(delta) {
    setReadmeFontSize((prev) => Math.min(28, Math.max(10, prev + delta)));
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

  function onPinballResizePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      target: "pinball-resize",
      id: null,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: pinballSize.width,
      startHeight: pinballSize.height,
    };
    document.body.classList.add("is-dragging");
  }

  function fitPinballToWindow() {
    const margin = 12;
    const maxWidth = window.innerWidth - margin * 2;
    const maxHeight = window.innerHeight - TASKBAR_HEIGHT - margin * 2;
    const width = Math.max(460, Math.min(maxWidth, Math.floor(maxHeight * (560 / 360))));
    const height = Math.max(360, Math.min(maxHeight, Math.floor(width * (360 / 560)) + 78));
    setPinballPos({ x: margin, y: margin });
    setPinballSize({ width, height });
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

  return (
    <main ref={desktopRef} className="desktop">
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
                : icon.id === "pinball"
                  ? openPinball
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
          style={{ left: windowPos.x, top: windowPos.y }}
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
          }}
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
            <button className="toolbar-btn" type="button">File</button>
            <button className="toolbar-btn" type="button">Edit</button>
            <button className="toolbar-btn" type="button">View</button>
            <button className="toolbar-btn" type="button">Tools</button>
            <button className="toolbar-btn" type="button">Help</button>
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
          }}
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

      {pinballOpen && (
        <section
          ref={pinballRef}
          className="pinball-window"
          style={{
            left: pinballPos.x,
            top: pinballPos.y,
            width: pinballSize.width,
            height: pinballSize.height,
          }}
          role="dialog"
          aria-label="3D Pinball"
        >
          <div className="window-header" onPointerDown={onPinballHeaderPointerDown}>
            <span className="window-title">3D Pinball for Windows - Space Cadet</span>
            <button className="close-btn" onClick={closePinball} aria-label="Close Pinball">
              ×
            </button>
          </div>
          <PinballGame isOpen={pinballOpen} onFitWindow={fitPinballToWindow} />
          <div
            className="pinball-resize-handle"
            onPointerDown={onPinballResizePointerDown}
            aria-hidden="true"
          />
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
        <div className="taskbar-segment" />
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
