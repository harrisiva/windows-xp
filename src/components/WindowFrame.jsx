import { forwardRef } from "react";

const WindowFrame = forwardRef(function WindowFrame(
  {
    className,
    style,
    onPointerDown,
    role = "dialog",
    ariaLabel,
    headerClassName = "window-header",
    onHeaderPointerDown,
    title,
    onClose,
    closeAriaLabel = "Close",
    showDefaultClose = true,
    headerActions = null,
    children,
    resizeHandle = null,
  },
  ref
) {
  return (
    <section
      ref={ref}
      className={className}
      style={style}
      onPointerDown={onPointerDown}
      role={role}
      aria-label={ariaLabel}
    >
      <div className={headerClassName} onPointerDown={onHeaderPointerDown}>
        <span className="window-title">{title}</span>
        {showDefaultClose ? (
          <div className="window-actions">
            {headerActions}
            {onClose && (
              <button className="close-btn" onClick={onClose} aria-label={closeAriaLabel}>
                ×
              </button>
            )}
          </div>
        ) : (
          headerActions
        )}
      </div>
      {children}
      {resizeHandle}
    </section>
  );
});

export default WindowFrame;
