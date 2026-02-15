import { useEffect, useRef, useState } from "react";
import WindowFrame from "../WindowFrame";

/**
 * Reusable properties/system details window.
 */
export function PropertiesWindow({
  open,
  windowRef,
  position,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  isLoading,
  error,
  siteInfo,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={windowRef}
      className="properties-window"
      style={{ left: position.x, top: position.y, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Properties window"
      onHeaderPointerDown={onHeaderPointerDown}
      title="My Computer Properties"
      onClose={onClose}
      closeAriaLabel="Close"
    >
      <div className="window-body">
        {isLoading && <p>Loading properties...</p>}
        {error && <p>{error}</p>}
        {siteInfo && (
          <>
            <div className="row"><span className="label">Owner:</span><span>{siteInfo.owner}</span></div>
            <div className="row"><span className="label">Storage:</span><span>{siteInfo.storage}</span></div>
            <div className="row">
              <span className="label">Additional cool information:</span>
              <ul className="list">
                {siteInfo.coolInfo.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="row"><span className="label">Status:</span><span>{siteInfo.uptimeHint}</span></div>
          </>
        )}
      </div>
    </WindowFrame>
  );
}

/**
 * My Computer / Explorer surface.
 */
export function ExplorerWindow({
  open,
  explorerRef,
  position,
  size,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  onResizePointerDown,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={explorerRef}
      className="explorer-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="File Explorer"
      onHeaderPointerDown={onHeaderPointerDown}
      title="My Computer"
      onClose={onClose}
      closeAriaLabel="Close Explorer"
      resizeHandle={<div className="explorer-resize-handle" onPointerDown={onResizePointerDown} aria-hidden="true" />}
    >
      {/* XP-style quick action strip with icon+label buttons. */}
      <div className="explorer-toolbar">
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">🔍</span><span>Search</span></button>
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">⭐</span><span>Favorites</span></button>
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">🕘</span><span>History</span></button>
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">🌐</span><span>Channels</span></button>
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">⛶</span><span>Fullscreen</span></button>
        <button className="toolbar-btn toolbar-btn--icon" type="button"><span className="tool-icon" aria-hidden="true">✉️</span><span>Mail</span></button>
      </div>
      {/* Two-column shell: left task pane + empty content surface. */}
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
  );
}

/**
 * Notepad editor window for readme content.
 */
export function NotepadWindow({
  open,
  notepadRef,
  position,
  size,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  onResizePointerDown,
  readmeContent,
  onChangeReadmeContent,
  readmeFontSize,
  onChangeReadmeFontSize,
}) {
  if (!open) {
    return null;
  }
  const lineCount = readmeContent ? readmeContent.split("\n").length : 1;
  const charCount = readmeContent.length;

  return (
    <WindowFrame
      ref={notepadRef}
      className="notepad-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Notepad"
      onHeaderPointerDown={onHeaderPointerDown}
      title="readme.txt - Notepad"
      onClose={onClose}
      closeAriaLabel="Close Notepad"
      resizeHandle={<div className="notepad-resize-handle" onPointerDown={onResizePointerDown} aria-hidden="true" />}
    >
      {/* Toolbar is visual-only for now; font controls are wired for editing comfort. */}
      <div className="notepad-toolbar">
        <button className="toolbar-btn" type="button">File</button>
        <button className="toolbar-btn" type="button">Edit</button>
        <button className="toolbar-btn" type="button">Format</button>
        <button className="toolbar-btn" type="button">View</button>
        <button className="toolbar-btn" type="button">Help</button>
        <span className="toolbar-spacer" />
        <button className="toolbar-btn" type="button" onClick={() => onChangeReadmeFontSize(-1)}>A-</button>
        <button className="toolbar-btn" type="button" onClick={() => onChangeReadmeFontSize(1)}>A+</button>
      </div>
      {/* Body remains a plain textarea to preserve XP notepad behavior. */}
      <div className="notepad-body">
        <textarea
          className="notepad-editor"
          value={readmeContent}
          onChange={(event) => onChangeReadmeContent(event.target.value)}
          style={{ fontSize: `${readmeFontSize}px` }}
          spellCheck={false}
        />
      </div>
      <div className="notepad-statusbar" aria-hidden="true">
        <span>UTF-8</span>
        <span>{lineCount} lines</span>
        <span>{charCount} chars</span>
      </div>
    </WindowFrame>
  );
}

/**
 * Command prompt emulator window.
 */
export function CmdWindow({
  open,
  cmdRef,
  cmdOutputRef,
  position,
  size,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  onResizePointerDown,
  cmdFontSize,
  onChangeCmdFontSize,
  cmdLines,
  cmdBusy,
  cmdInput,
  onChangeCmdInput,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={cmdRef}
      className="cmd-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Command Prompt"
      headerClassName="window-header cmd-header"
      onHeaderPointerDown={onHeaderPointerDown}
      title="C:\\WINDOWS\\system32\\cmd.exe"
      showDefaultClose={false}
      headerActions={(
        <div className="window-actions">
          {/* Keep font-size controls in title bar like classic terminal apps. */}
          <button className="toolbar-btn" type="button" onClick={() => onChangeCmdFontSize(-1)}>A-</button>
          <button className="toolbar-btn" type="button" onClick={() => onChangeCmdFontSize(1)}>A+</button>
          <button className="close-btn" onClick={onClose} aria-label="Close Command Prompt">×</button>
        </div>
      )}
      resizeHandle={<div className="cmd-resize-handle" onPointerDown={onResizePointerDown} aria-hidden="true" />}
    >
      <div className="cmd-body">
        {/* Output stream renders each entry with role-specific styling. */}
        <div className="cmd-output" ref={cmdOutputRef} style={{ fontSize: `${cmdFontSize}px` }}>
          {cmdLines.map((line, index) => (
            <div key={`cmd-line-${index}`} className={`cmd-line cmd-line--${line.kind}`}>{line.text}</div>
          ))}
          {cmdBusy && <div className="cmd-line cmd-line--system">Gemini is thinking...</div>}
        </div>
        <form
          className="cmd-input-row"
          style={{ fontSize: `${cmdFontSize}px` }}
          onSubmit={(event) => {
            event.preventDefault();
            // Submit is delegated so App can own async Gemini request lifecycle.
            onSubmit();
          }}
        >
          <span className="cmd-prompt">C:\&gt;</span>
          <input
            className="cmd-input"
            type="text"
            value={cmdInput}
            onChange={(event) => onChangeCmdInput(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={cmdBusy}
          />
        </form>
      </div>
    </WindowFrame>
  );
}

/**
 * Gemini key input and status details window.
 */
export function GeminiKeyWindow({
  open,
  geminiRef,
  position,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  geminiDraft,
  onChangeGeminiDraft,
  onSaveGeminiKey,
  geminiStatusMessage,
  geminiApiKey,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={geminiRef}
      className="gemini-window"
      style={{ left: position.x, top: position.y, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Gemini API Key"
      onHeaderPointerDown={onHeaderPointerDown}
      title="Gemini API Key"
      onClose={onClose}
      closeAriaLabel="Close Gemini API Key"
    >
      <div className="window-body">
        {/* Shows editable draft until Save promotes it to session-global key. */}
        <div className="row"><span className="label">API Key:</span></div>
        <input
          className="gemini-input"
          type="text"
          value={geminiDraft}
          onChange={(event) => onChangeGeminiDraft(event.target.value)}
          placeholder="Paste your Gemini API key"
        />
        <div className="gemini-actions">
          <button className="toolbar-btn" type="button" onClick={onSaveGeminiKey}>Save Key</button>
          <button className="toolbar-btn" type="button" onClick={onClose}>Close</button>
        </div>
        {/* Status text mirrors desktop chip state for quick troubleshooting. */}
        <div className="gemini-status">
          <div>Connection: {geminiStatusMessage}</div>
          <div>Current session key: {geminiApiKey || "(none)"}</div>
        </div>
      </div>
    </WindowFrame>
  );
}

/**
 * XP Paint-like drawing surface with pen/freehand tool only.
 */
export function PaintWindow({
  open,
  paintRef,
  position,
  size,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  onResizePointerDown,
}) {
  const canvasRef = useRef(null);
  const canvasHostRef = useRef(null);
  const drawRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const [penSize, setPenSize] = useState(2);

  useEffect(() => {
    if (!open) {
      return;
    }

    const canvas = canvasRef.current;
    const host = canvasHostRef.current;
    if (!canvas || !host) {
      return;
    }

    function resizeCanvasPreservingContent() {
      const oldWidth = canvas.width;
      const oldHeight = canvas.height;
      const snapshot = document.createElement("canvas");
      snapshot.width = oldWidth || 1;
      snapshot.height = oldHeight || 1;
      const snapCtx = snapshot.getContext("2d");
      if (snapCtx && oldWidth && oldHeight) {
        snapCtx.drawImage(canvas, 0, 0);
      }

      const nextWidth = Math.max(260, Math.floor(host.clientWidth));
      const nextHeight = Math.max(200, Math.floor(host.clientHeight));
      canvas.width = nextWidth;
      canvas.height = nextHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, nextWidth, nextHeight);
      ctx.drawImage(snapshot, 0, 0, Math.min(snapshot.width, nextWidth), Math.min(snapshot.height, nextHeight));
    }

    resizeCanvasPreservingContent();
    const resizeObserver = new ResizeObserver(() => resizeCanvasPreservingContent());
    resizeObserver.observe(host);

    return () => resizeObserver.disconnect();
  }, [open]);

  if (!open) {
    return null;
  }

  function getPointFromEvent(event) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(canvas.height, event.clientY - rect.top)),
    };
  }

  function startDraw(event) {
    if (event.button !== 0) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const point = getPointFromEvent(event);
    drawRef.current = { active: true, lastX: point.x, lastY: point.y };
    ctx.strokeStyle = "#121212";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = penSize;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.01, point.y + 0.01);
    ctx.stroke();
    canvas.setPointerCapture(event.pointerId);
  }

  function moveDraw(event) {
    if (!drawRef.current.active) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const point = getPointFromEvent(event);
    ctx.strokeStyle = "#121212";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = penSize;
    ctx.beginPath();
    ctx.moveTo(drawRef.current.lastX, drawRef.current.lastY);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    drawRef.current.lastX = point.x;
    drawRef.current.lastY = point.y;
  }

  function endDraw(event) {
    const canvas = canvasRef.current;
    drawRef.current.active = false;
    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <WindowFrame
      ref={paintRef}
      className="paint-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Paint"
      onHeaderPointerDown={onHeaderPointerDown}
      title="untitled - Paint"
      onClose={onClose}
      closeAriaLabel="Close Paint"
      resizeHandle={<div className="paint-resize-handle" onPointerDown={onResizePointerDown} aria-hidden="true" />}
    >
      <div className="paint-menu-row">
        <button type="button" className="toolbar-btn">File</button>
        <button type="button" className="toolbar-btn">Edit</button>
        <button type="button" className="toolbar-btn">View</button>
        <button type="button" className="toolbar-btn">Image</button>
        <button type="button" className="toolbar-btn">Colors</button>
        <button type="button" className="toolbar-btn">Help</button>
      </div>
      <div className="paint-toolbar">
        <button type="button" className="toolbar-btn paint-tool-btn paint-tool-btn--active">✎ Pen</button>
        <label className="paint-size">
          Size
          <select
            value={penSize}
            onChange={(event) => setPenSize(Number(event.target.value))}
          >
            <option value={1}>1 px</option>
            <option value={2}>2 px</option>
            <option value={3}>3 px</option>
            <option value={5}>5 px</option>
            <option value={7}>7 px</option>
          </select>
        </label>
        <button type="button" className="toolbar-btn" onClick={clearCanvas}>Clear</button>
      </div>
      <div className="paint-canvas-shell" ref={canvasHostRef}>
        <canvas
          ref={canvasRef}
          className="paint-canvas"
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      <div className="paint-statusbar" aria-hidden="true">Ready | Tool: Pen | Drag to draw freehand</div>
    </WindowFrame>
  );
}

/**
 * Pinball game container window.
 */
export function PinballWindow({
  open,
  pinballRef,
  position,
  size,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  children,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={pinballRef}
      className="pinball-window"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="3D Pinball"
      onHeaderPointerDown={onHeaderPointerDown}
      title="3D Pinball for Windows - Space Cadet"
      onClose={onClose}
      closeAriaLabel="Close Pinball"
    >
      {children}
    </WindowFrame>
  );
}

/**
 * Tetris game container window.
 */
export function TetrisWindow({
  open,
  tetrisRef,
  position,
  zIndex,
  onFocus,
  onHeaderPointerDown,
  onClose,
  children,
}) {
  if (!open) {
    return null;
  }

  return (
    <WindowFrame
      ref={tetrisRef}
      className="tetris-window"
      style={{ left: position.x, top: position.y, zIndex }}
      onPointerDown={onFocus}
      ariaLabel="Tetris"
      onHeaderPointerDown={onHeaderPointerDown}
      title="Tetris"
      onClose={onClose}
      closeAriaLabel="Close Tetris"
    >
      {children}
    </WindowFrame>
  );
}
