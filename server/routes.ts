import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import http from "http";

const DJANGO_HOST = "127.0.0.1";
const DJANGO_PORT = 8000;

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
  headersToForward["host"] = `${DJANGO_HOST}:${DJANGO_PORT}`;

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

  const proxyReq = http.request(options, (proxyRes) => {
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
