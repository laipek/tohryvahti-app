import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isProd = process.env.NODE_ENV === "production";
const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
    plugins: [
        react(),
        runtimeErrorOverlay(),
        ...( !isProd && isReplit
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
            ]
            : []),
    ],
    root: path.resolve(import.meta.dirname, "client"),

    publicDir: path.resolve(import.meta.dirname, "public"),

    build: {
        outDir: path.resolve(import.meta.dirname, "dist"),
        emptyOutDir: true,
    },

    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "client", "src"),
            "@shared": path.resolve(import.meta.dirname, "shared"),
            "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        },
    },

    server: {
        proxy: {
            "/api": "http://localhost:5000",
        },
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});