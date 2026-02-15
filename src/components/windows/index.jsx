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
