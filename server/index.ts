import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
// Import only external dependencies - avoid all relative imports for Vercel
import multer from "multer";
import { z } from "zod";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
const { Pool } = pg;
import { graffitiReports } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
// Inline vite functions to avoid relative imports
import path from "path";
const log = console.log;
const serveStatic = (app: any) => {
  // Serve static files from client/dist
  app.use(express.static(path.join(process.cwd(), 'client/dist')));
  app.use('*', (req: any, res: any) => {
    res.sendFile(path.join(process.cwd(), 'client/dist/index.html'));
  });
};

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

// Initialize database connection directly (inline to avoid imports)
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

// Initialize Firebase for server-side storage  
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "graffititracker-17552.firebasestorage.app",
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(firebaseApp);

// Configure multer for optimized file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit per file for smartphone photos
    files: 5, // Allow up to 5 files
    fieldSize: 200 * 1024 * 1024, // 200MB total form size limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    
    // Check specific image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
      return cb(new Error('Only JPEG, PNG, and WebP images are supported'));
    }
    
    cb(null, true);
  }
});

// INLINE ROUTES - Essential endpoints to avoid import issues
// Health check endpoint to verify server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all graffiti reports (admin only) - inline database query
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await db.select().from(graffitiReports).orderBy(desc(graffitiReports.timestamp));
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

// Get validated reports (public) - inline database query
app.get("/api/reports/validated", async (req, res) => {
  try {
    const reports = await db.select().from(graffitiReports)
      .where(eq(graffitiReports.validated, 'approved'))
      .orderBy(desc(graffitiReports.timestamp));
    res.json(reports);
  } catch (error) {
    console.error("Error fetching validated reports:", error);
    res.status(500).json({ message: "Failed to fetch validated reports" });
  }
});

// Get single graffiti report - inline database query
app.get("/api/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const [report] = await db.select().from(graffitiReports).where(eq(graffitiReports.id, id));
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

// Error handler - don't throw to avoid function crashes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  // Don't throw - causes Vercel function crashes
});

// Serve static files in production
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  serveStatic(app);
}

// Export app for Vercel serverless functions
export default app;

// Only start HTTP server locally, not on Vercel
if (!process.env.VERCEL) {
  (async () => {
    const server = createServer(app);
    
    // Setup Vite in development (simplified for inline version)
    if (app.get("env") === "development") {
      log("Development mode - Vite setup skipped in inlined version");
    }

    // Start server locally
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
