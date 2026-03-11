const http = require("http");
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const PORT = 3002;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let url = req.url.split("?")[0];
    if (url === "/") url = "/popup.html";

    const filePath = path.join(distDir, url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found: " + url);
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`Preview server running on http://localhost:${PORT}`);
  });
