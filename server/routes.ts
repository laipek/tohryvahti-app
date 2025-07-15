import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertGraffitiReportSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin route debugging for deployment
  app.get("/admin", (req, res, next) => {
    console.log("Admin route accessed:", req.url);
    next();
  });

  // Health check endpoint to verify server is running
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get all graffiti reports (admin only)
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get validated reports (public)
  app.get("/api/reports/validated", async (req, res) => {
    try {
      const reports = await storage.getValidatedReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching validated reports:", error);
      res.status(500).json({ message: "Failed to fetch validated reports" });
    }
  });

  // Get pending reports (admin only)
  app.get("/api/reports/pending", async (req, res) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      res.status(500).json({ message: "Failed to fetch pending reports" });
    }
  });

  // Get single graffiti report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Create new graffiti report
  app.post("/api/reports", upload.array('photos', 1), async (req, res) => {
    try {
      // Parse and validate request body
      const reportData = {
        ...req.body,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        photos: req.files ? (req.files as Express.Multer.File[]).map(file => {
          const mimeType = file.mimetype;
          const base64Data = file.buffer.toString('base64');
          return `data:${mimeType};base64,${base64Data}`;
        }) : []
      };

      const validatedData = insertGraffitiReportSchema.parse(reportData);
      const report = await storage.createReport(validatedData);
      
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Update report status
  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const { status } = req.body;
      if (!["new", "progress", "cleaned"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedReport = await storage.updateReportStatus(id, status, 'admin');
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report status:", error);
      res.status(500).json({ message: "Failed to update report status" });
    }
  });

  // Update report validation status (admin only)
  app.patch("/api/reports/:id/validate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const { validated } = req.body;
      if (!["pending", "approved", "rejected"].includes(validated)) {
        return res.status(400).json({ message: "Invalid validation status" });
      }

      const updatedReport = await storage.updateReportValidation(id, validated, 'admin');
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report validation:", error);
      res.status(500).json({ message: "Failed to update report validation" });
    }
  });

  // Update report property ownership (admin only)
  app.patch("/api/reports/:id/property", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const { propertyOwner, propertyDescription } = req.body;
      if (!["city", "ely-keskus", "private"].includes(propertyOwner)) {
        return res.status(400).json({ message: "Invalid property owner. Must be: city, ely-keskus, or private" });
      }

      const updatedReport = await storage.updateReportProperty(id, propertyOwner, propertyDescription, 'admin');
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report property:", error);
      res.status(500).json({ message: "Failed to update report property" });
    }
  });

  // Get reports by status
  app.get("/api/reports/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      if (!["new", "progress", "cleaned"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const reports = await storage.getReportsByStatus(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports by status:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get reports by district
  app.get("/api/reports/district/:district", async (req, res) => {
    try {
      const { district } = req.params;
      const reports = await storage.getReportsByDistrict(district);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports by district:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get report history
  app.get("/api/reports/:id/history", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const history = await storage.getReportHistory(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching report history:", error);
      res.status(500).json({ message: "Failed to fetch report history" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const success = await storage.deleteReport(id);
      
      if (success) {
        res.json({ message: "Report deleted successfully" });
      } else {
        res.status(404).json({ error: "Report not found" });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
