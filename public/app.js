const { useEffect, useRef, useState } = React;

function App() {
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0 });
  const [siteInfo, setSiteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowPos, setWindowPos] = useState({ x: 120, y: 120 });
  const [icons, setIcons] = useState([
    { id: "computer", label: "My Computer", x: 28, y: 36, type: "computer" },
    { id: "recycle", label: "Recycle Bin", x: 28, y: 132, type: "recycle" },
  ]);
  const dragState = useRef({ target: null, id: null, offsetX: 0, offsetY: 0 });
  const desktopRef = useRef(null);
  const windowRef = useRef(null);

  useEffect(() => {
    function closeMenu() {
      setMenu((prev) => ({ ...prev, visible: false }));
    }

    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
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

    function clampIconToDesktop(x, y) {
      const desktop = desktopRef.current;
      if (!desktop) {
        return { x, y };
      }

      const iconWidth = 92;
      const iconHeight = 96;
      const min = 8;
      const maxX = Math.max(min, desktop.clientWidth - iconWidth - min);
      const maxY = Math.max(min, desktop.clientHeight - iconHeight - min);
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

  function onComputerRightClick(event) {
    event.preventDefault();
    setMenu({ visible: true, x: event.clientX, y: event.clientY });
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

    return (
      <svg className="icon-svg" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M22 16h20l3 6H19l3-6z" fill="#d3def0" stroke="#5f6c84" strokeWidth="1.5" />
        <rect x="18" y="22" width="28" height="30" rx="4" fill="#eaf0fb" stroke="#67748e" strokeWidth="2" />
        <path d="M24 27h4v19h-4zM30 27h4v19h-4zM36 27h4v19h-4z" fill="#a9b9d8" />
      </svg>
    );
  }

  return (
    <main ref={desktopRef} className="desktop">
      {icons.map((icon) => (
        <div
          key={icon.id}
          className="icon"
          style={{ left: icon.x, top: icon.y }}
          onPointerDown={(event) => onIconPointerDown(event, icon.id)}
          onContextMenu={icon.id === "computer" ? onComputerRightClick : undefined}
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
          <button className="context-item" onClick={onPropertiesClick}>
            Properties
          </button>
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
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
