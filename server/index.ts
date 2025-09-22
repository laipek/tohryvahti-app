import express from "express";
import { createServer } from "http";
import path from "node:path";
import fs from "node:fs";
import { registerRoutes } from "./routes.js";

function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
}
console.log("At server/index.ts")
const app = express();

// basic middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log("At server/index.ts before 'simple API logging'")
// simple API logging
app.use((req, res, next) => {
    const start = Date.now();
    let capturedJson: unknown;

    const originalJson = res.json.bind(res) as (body?: any) => any;
    res.json = (body: unknown) => {
        capturedJson = body;
        return originalJson(body as any);
    };

    res.on("finish", () => {
        if (req.path.startsWith("/api")) {
            const ms = Date.now() - start;
            let line = `${req.method} ${req.path} ${res.statusCode} in ${ms}ms`;
            if (capturedJson) {
                try {
                    const s = JSON.stringify(capturedJson);
                    line += ` :: ${s.length > 80 ? s.slice(0, 79) + "…" : s}`;
                } catch {
                    /* ignore JSON stringify errors */
                }
            }
            log(line);
        }
    });

    next();
});
console.log("At server/index.ts before 'sanity check'")
// Sanity check
app.all('/api/*', (req, _res, next) => {
    console.log('API HIT ->', req.method, req.path);
    next();
});

console.log("At server/index.ts before 'route registering'")
// always register API routes
registerRoutes(app);

// ─────────────────────────────────────────────────────────────────────────────
// DIFFERENCE: Vercel (serverless) vs local development
// ─────────────────────────────────────────────────────────────────────────────
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const isDev = process.env.NODE_ENV !== "production";

/**
 * On Vercel (serverless):
 * - DO NOT serve static frontend files via Express.
 * - Vercel automatically hosts the `dist/` build via its CDN.
 * - Vercel Functions call this file through the `api/index.ts` wrapper.
 *
 * On local development (Replit/your machine):
 * - You can integrate the Vite dev server into Express for hot reload,
 *   or simply run Vite separately and use a proxy for `/api`.
 */
if (!isVercel && isDev) {
    // DEV: Vite integrated into Express (like before)
    const server = createServer(app);

    (async () => {
        try {
            const { setupVite } = await import("./vite.js");
            await setupVite(app, server);
        } catch (err) {
            // fallback: try to serve local build files if available
            log("Vite setup failed, falling back to static serving", "dev");
            const distPath = path.resolve(process.cwd(), "dist");
            if (fs.existsSync(distPath)) {
                app.use(express.static(distPath));
                app.get(/^(?!\/api).*/, (_req, res) => {
                    res.sendFile(path.resolve(distPath, "index.html"));
                });
            } else {
                log("No local dist/ found; run `vite dev` for frontend development.", "dev");
            }
        }

        const port = parseInt(process.env.PORT || "5000", 10);
        server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
            log(`serving on port ${port}`);
        });
    })();
}

// Export Express app for Vercel serverless
export default app;