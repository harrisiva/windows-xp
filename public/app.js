const { useEffect, useRef, useState } = React;

const DEFAULT_ICONS = [
  { id: "computer", label: "My Computer", type: "computer" },
  { id: "recycle", label: "Recycle Bin", type: "recycle-shortcut" },
  { id: "cmd", label: "Command Prompt", type: "cmd-shortcut" },
];

function App() {
  const TASKBAR_HEIGHT = 40;
  const ICON_WIDTH = 92;
  const ICON_HEIGHT = 96;
  const ICON_GAP = 14;
  const DESKTOP_PADDING = 12;
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
  const [siteInfo, setSiteInfo] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerPos, setExplorerPos] = useState({ x: 160, y: 78 });
  const [explorerSize, setExplorerSize] = useState({ width: 640, height: 430 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [icons, setIcons] = useState(() => DEFAULT_ICONS.map((icon, index) => ({ ...icon, x: 28, y: 36 + index * 110 })));
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);
  const explorerRef = useRef(null);

  useEffect(() => {
    function closeMenu() {
      setMenu((prev) => ({ ...prev, visible: false, targetId: null }));
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

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

      if (dragState.current.target === "explorer-resize") {
        const deltaX = event.clientX - dragState.current.startX;
        const deltaY = event.clientY - dragState.current.startY;
        const nextWidth = dragState.current.startWidth + deltaX;
        const nextHeight = dragState.current.startHeight + deltaY;
        setExplorerSize(clampExplorerSizeToViewport(nextWidth, nextHeight));
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
          onDoubleClick={icon.id === "computer" ? openExplorer : undefined}
          onContextMenu={(event) => onIconRightClick(event, icon.id)}
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
            <span className="toolbar-btn">File</span>
            <span className="toolbar-btn">Edit</span>
            <span className="toolbar-btn">View</span>
            <span className="toolbar-btn">Tools</span>
            <span className="toolbar-btn">Help</span>
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

      <footer className="taskbar" aria-hidden="true">
        <button className="start-button" type="button">
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
