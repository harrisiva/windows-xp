/**
 * Calculates pinball window dimensions that preserve game aspect ratio
 * while fitting available viewport space above the taskbar.
 */
function calculateResponsivePinballSize(viewportWidth, viewportHeight, taskbarHeight) {
  const margin = 24;
  const minWindowWidth = 420;
  const minWindowHeight = 320;
  const maxWindowWidth = Math.max(320, viewportWidth - margin);
  const maxWindowHeight = Math.max(300, viewportHeight - taskbarHeight - margin);
  const clampedMinWidth = Math.min(minWindowWidth, maxWindowWidth);
  const clampedMinHeight = Math.min(minWindowHeight, maxWindowHeight);

  const canvasAspectWidth = 620;
  const canvasAspectHeight = 420;
  const horizontalChrome = 16; // pinball-game horizontal padding
  const verticalChrome = 100; // title bar + toolbar/status + paddings

  const maxCanvasWidthFromHeight = Math.max(
    200,
    Math.floor(((maxWindowHeight - verticalChrome) * canvasAspectWidth) / canvasAspectHeight)
  );
  const idealWindowWidth = Math.floor(viewportWidth * 0.56);
  const fittedWindowWidth = Math.min(maxWindowWidth, maxCanvasWidthFromHeight + horizontalChrome, idealWindowWidth);

  const windowWidth = Math.min(maxWindowWidth, Math.max(clampedMinWidth, fittedWindowWidth));
  const canvasWidth = Math.max(200, windowWidth - horizontalChrome);
  const canvasHeight = Math.floor((canvasWidth * canvasAspectHeight) / canvasAspectWidth);
  const windowHeight = Math.min(
    maxWindowHeight,
    Math.max(clampedMinHeight, canvasHeight + verticalChrome)
  );

  return { width: windowWidth, height: windowHeight };
}

/**
 * Converts markdown-ish Gemini output into terminal-friendly plain text.
 */
function formatGeminiOutputForCmd(rawText) {
  if (typeof rawText !== "string") {
    return "Gemini returned an empty response.";
  }

  let text = rawText.replace(/\r\n/g, "\n");

  text = text.replace(/```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const header = lang ? `[${lang}]\n` : "";
    return `${header}${String(code || "").replace(/\n+$/g, "")}`;
  });

  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/^#{1,6}\s*/gm, "");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*\n]+)\*/g, "$1");
  text = text.replace(/_([^_\n]+)_/g, "$1");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)");
  text = text.replace(/^\s*>\s?/gm, "| ");
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/^\s*\d+\.\s+/gm, (value) => value.trimStart());
  text = text.replace(/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/gm, "----------------");
  text = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text || "Gemini returned an empty response.";
}

export { calculateResponsivePinballSize, formatGeminiOutputForCmd };
