import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import http from "http";
import https from "https";

// Allow Django backend to be configured via environment variables
// For local development: localhost:8000
// For Render: django-backend.onrender.com:443
const DJANGO_HOST = process.env.DJANGO_HOST || "127.0.0.1";
const DJANGO_PORT = parseInt(process.env.DJANGO_PORT || "8000", 10);
const USE_HTTPS = DJANGO_PORT === 443 || process.env.DJANGO_HTTPS === "true";

function proxyToDjango(req: Request, res: Response) {
  const rawBody: Buffer | undefined = (req as any).rawBody as Buffer | undefined;
  const contentType = req.headers["content-type"] || "";
  const isJson = contentType.includes("application/json");

  console.log(`[proxy] ${req.method} ${req.url}, content-type: ${contentType.split(";")[0]}`);

  const headersToForward: http.OutgoingHttpHeaders = {};
  for (const [key, val] of Object.entries(req.headers)) {
    if (key.toLowerCase() === "host") continue;
    if (key.toLowerCase() === "transfer-encoding") continue;
    headersToForward[key] = val;
  }
  // For HTTPS on port 443, don't include the port in the Host header
  headersToForward["host"] = USE_HTTPS && DJANGO_PORT === 443 
    ? DJANGO_HOST 
    : `${DJANGO_HOST}:${DJANGO_PORT}`;

  if (isJson) {
    if (rawBody && rawBody.length > 0) {
      headersToForward["content-length"] = rawBody.length;
    } else {
      headersToForward["content-length"] = 0;
    }
  }

  const options: http.RequestOptions = {
    hostname: DJANGO_HOST,
    port: DJANGO_PORT,
    path: req.url,
    method: req.method,
    headers: headersToForward,
  };

  // Use HTTPS for remote backends (like Render), HTTP for localhost
  const httpLib = USE_HTTPS ? https : http;
  
  const proxyReq = httpLib.request(options, (proxyRes) => {
    console.log(`[proxy] ← ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy] error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: "Backend service unavailable." });
    }
  });

  if (isJson) {
    if (rawBody && rawBody.length > 0) {
      proxyReq.write(rawBody);
    }
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.all("/api/*splat", (req, res) => {
    req.url = req.url.replace(/^\/api/, "") || "/";
    proxyToDjango(req, res);
  });

  return httpServer;
}
