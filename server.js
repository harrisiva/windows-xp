const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
