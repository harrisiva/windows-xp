import { CLIPPY_MESSAGES } from "../lib/config";
import {
  ICON_CONTEXT_MENU_TARGETS,
  START_MENU_LEFT_ITEMS,
  START_MENU_RIGHT_ITEMS,
} from "../constants/ui";

// Icon renderer is intentionally centralized so icon styles stay consistent
// between desktop items and any future icon mirrors (taskbar/start menu).
function IconGraphic({ type }) {
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

export function DesktopGeminiStatusWidget({
  statusRef,
  status,
  position,
  onPointerDown,
  onRefresh,
}) {
  // Uses right-click and button-click refresh behaviors provided by App.
  return (
    <section
      ref={statusRef}
      className="desktop-gemini-status"
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onContextMenu={onRefresh}
      aria-label="Gemini connection status"
    >
      <span className={`gemini-status-chip gemini-status-chip--${status}`} aria-live="polite">
        <span className="gemini-status-robot" aria-hidden="true">🤖</span>
        <span>
          {status === "active" ? "Active" : status === "checking" ? "Checking" : "Inactive"}
        </span>
      </span>
      <button
        className="gemini-refresh-btn"
        type="button"
        aria-label="Refresh Gemini status"
        title="Refresh Gemini status"
        onClick={onRefresh}
      >
        ↻
      </button>
    </section>
  );
}

export function DesktopIcons({ icons, onIconPointerDown, onIconRightClick, iconDoubleClickHandlers }) {
  return (
    <>
      {icons.map((icon) => (
        // Double-click opens app; pointer down participates in drag interactions.
        <div
          key={icon.id}
          className={`icon ${icon.type.endsWith("shortcut") ? "icon--shortcut" : ""}`}
          style={{ left: icon.x, top: icon.y }}
          onPointerDown={(event) => onIconPointerDown(event, icon.id)}
          onDoubleClick={iconDoubleClickHandlers[icon.id]}
          onContextMenu={
            ICON_CONTEXT_MENU_TARGETS.has(icon.id)
              ? (event) => onIconRightClick(event, icon.id)
              : undefined
          }
          aria-label={`${icon.label} icon`}
        >
          <div className="icon-image" title={icon.label}>
            <IconGraphic type={icon.type} />
          </div>
          <div className="icon-label">{icon.label}</div>
        </div>
      ))}
    </>
  );
}

export function ClippyAssistant({ zIndex, bubbleOpen, customMessage, messageIndex, onToggle }) {
  return (
    // Assistant intentionally sits outside taskbar so it can float near desktop icons.
    <section className="xp-dog" aria-label="Desktop assistant" style={{ zIndex }}>
      <button type="button" className="xp-dog-btn" onClick={onToggle} aria-label="Toggle assistant bubble">
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
      {bubbleOpen && (
        <div className="xp-dog-bubble" role="status" aria-live="polite">
          {customMessage || CLIPPY_MESSAGES[messageIndex]}
        </div>
      )}
    </section>
  );
}

export function IconContextMenu({ menu, onPropertiesClick, onDeleteIconClick }) {
  if (!menu.visible) {
    return null;
  }

  return (
    // Context actions are intentionally minimal to match current desktop feature scope.
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
  );
}

export function StartMenu({ isOpen, actions }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Static menu composition is driven by constants in `constants/ui`.
    <section className="start-menu" role="dialog" aria-label="Start menu" onClick={(event) => event.stopPropagation()}>
      <div className="start-menu-top">
        <div className="start-avatar" />
        <div className="start-user">harri</div>
      </div>
      <div className="start-menu-body">
        <div className="start-left">
          {START_MENU_LEFT_ITEMS.map((item) => (
            item.type === "divider" ? (
              <hr key={item.id} className="start-divider" />
            ) : (
              <button
                key={item.id}
                className="start-item"
                type="button"
                onClick={item.action ? actions[item.action] : undefined}
              >
                {item.label}
              </button>
            )
          ))}
        </div>
        <div className="start-right">
          {START_MENU_RIGHT_ITEMS.map((item) => (
            <button key={item.id} className="start-link" type="button">
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="start-menu-bottom">
        <button className="start-power" type="button">Turn Off Computer</button>
      </div>
    </section>
  );
}

export function Taskbar({ openTaskbarItems, onStartButtonClick, onTaskbarWindowClick }) {
  return (
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
            // Clicking a taskbar item promotes that window in z-order.
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
        <button className="tray-button" type="button">EN</button>
        <button className="tray-button tray-button-time" type="button">
          {new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date())}
        </button>
      </div>
    </footer>
  );
}
