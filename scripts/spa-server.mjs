import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
const [root, port] = [process.argv[2], Number(process.argv[3])];
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".png": "image/png",
};
createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const tryFile = async (p) => {
    try {
      return await readFile(p);
    } catch {
      return null;
    }
  };
  let buf = extname(url) ? await tryFile(join(root, url)) : null;
  if (!buf) buf = await tryFile(join(root, "index.html")); // fallback SPA
  res.writeHead(200, { "content-type": mime[extname(url)] || "text/html" });
  res.end(buf);
}).listen(port, () => console.log("up", port));
