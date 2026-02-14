const express = require("express");
const path = require("path");
let GoogleGenAI;
try {
  ({ GoogleGenAI } = require("@google/genai"));
} catch {
  GoogleGenAI = null;
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/site-info", (req, res) => {
  res.json({
    owner: "Harri",
    storage: "big brain",
    coolInfo: [
      "Built as a desktop-style single page app.",
      "Right-click the Computer icon to open properties.",
      "Express powers the API and serves the app."
    ],
    uptimeHint: "Fueled by coffee and curiosity."
  });
});

app.post("/api/validate-gemini-key", async (req, res) => {
  const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      status: "inactive",
      message: "Missing API key.",
    });
  }

  if (!GoogleGenAI) {
    return res.status(500).json({
      ok: false,
      status: "inactive",
      message: "Gemini SDK not installed. Run npm install @google/genai.",
    });
  }

  const timeoutMs = 7000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Gemini connection timed out. Please try again.")), timeoutMs);
  });

  try {
    const ai = new GoogleGenAI({ apiKey });

    async function verifyModelAccess() {
      if (!ai?.models?.list || typeof ai.models.list !== "function") {
        throw new Error("Gemini SDK missing models.list()");
      }

      const callVariants = [
        () => ai.models.list({ pageSize: 1 }),
        () => ai.models.list({ config: { pageSize: 1 } }),
        () => ai.models.list(),
      ];

      let lastError;
      for (const call of callVariants) {
        try {
          const result = await call();
          if (result && typeof result[Symbol.asyncIterator] === "function") {
            for await (const _model of result) {
              break;
            }
            return true;
          }
          if (result && Array.isArray(result.models)) {
            return true;
          }
          if (result && typeof result === "object") {
            return true;
          }
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Gemini models.list() failed.");
    }

    await Promise.race([verifyModelAccess(), timeoutPromise]);

    return res.json({
      ok: true,
      status: "active",
      message: "Connected to Gemini API.",
    });
  } catch (error) {
    const rawMessage = typeof error?.message === "string" ? error.message : "";
    const isAuthError =
      /invalid|unauth|permission|forbidden|api key|401|403/i.test(rawMessage);
    const isTimeout = /timed out/i.test(rawMessage);

    const message = isTimeout
      ? "Gemini connection timed out. Please try again."
      : isAuthError
        ? "Gemini API key is not valid for model access."
        : "Could not verify Gemini model access right now.";

    return res.status(isAuthError ? 401 : 503).json({
      ok: false,
      status: "inactive",
      message,
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
