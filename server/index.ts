import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import path from "path";

// Inline log function to avoid vite.js import
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Inline serveStatic function to avoid vite.js import
function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "client/dist");
  
  // In Vercel, serve from public directory or fallback gracefully
  app.use(express.static(distPath, { fallthrough: true }));
  
  // Fallback for SPA routing
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send("Static files not found - this is expected in serverless environment");
      }
    });
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register API routes
registerRoutes(app);

// Handle static files in production (Vercel)
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

// For development (Replit), start traditional server
if (process.env.NODE_ENV === "development") {
  const server = createServer(app);
  
  (async () => {
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, server);
    } catch (err) {
      console.warn("Vite setup failed, falling back to static serving:", err);
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

// Export Express app for Vercel serverless
export default app;