import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertGraffitiReportSchema } from "@shared/schema";
import { z } from "zod";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit per file
    files: 5, // Allow up to 5 files
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
  app.post("/api/reports", upload.array('photos', 5), async (req, res) => {
    try {
      console.log('Received form data:', req.body);
      console.log('Received files:', req.files ? req.files.length : 0);
      
      // Extract data from form
      const latitude = parseFloat(req.body.latitude);
      const longitude = parseFloat(req.body.longitude);
      const district = req.body.district;
      const description = req.body.description;
      const name = req.body.name || null;
      const email = req.body.email || null;
      const status = req.body.status || 'new';
      const validated = req.body.validated || 'pending';

      console.log('Parsed data:', { latitude, longitude, district, description, name, email, status, validated });

      // Check if files were uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No image file provided. Please upload at least one image." });
      }

      // Process uploaded images - try Firebase first, fallback to base64
      const uploadedFiles = req.files as Express.Multer.File[];
      const photoUrls: string[] = [];

      for (const file of uploadedFiles) {
        try {
          // Try Firebase Storage first
          const fileName = `graffiti-reports/${Date.now()}-${file.originalname}`;
          const storageRef = ref(firebaseStorage, fileName);
          const snapshot = await uploadBytes(storageRef, file.buffer);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log(`Successfully uploaded ${fileName} to Firebase Storage`);
          photoUrls.push(downloadURL);
        } catch (firebaseError: any) {
          console.log('Firebase Storage failed, using base64 fallback:', firebaseError.code || firebaseError.message);
          
          // Fallback: Convert to base64 and store in database
          const mimeType = file.mimetype;
          const base64Data = file.buffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64Data}`;
          
          console.log(`Using base64 fallback for ${file.originalname} (${file.size} bytes)`);
          photoUrls.push(dataUrl);
        }
      }

      console.log('Processing report:', {
        latitude,
        longitude,
        district,
        description,
        photoUrls: photoUrls.length,
        name,
        email,
        status,
        validated
      });

      if (photoUrls.length === 0) {
        return res.status(500).json({ message: "Failed to process any images" });
      }

      // Create report data
      const reportData = {
        photos: photoUrls,
        latitude,
        longitude,
        district,
        description,
        name,
        email,
        status,
        validated
      };

      const validatedData = insertGraffitiReportSchema.parse(reportData);
      const report = await storage.createReport(validatedData);
      
      console.log('Report created successfully:', report.id);
      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "File too large. Maximum file size is 20MB." 
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: "Too many files. Maximum 5 images allowed." 
          });
        }
        return res.status(400).json({ 
          message: `File upload error: ${error.message}` 
        });
      }
      
      // Handle custom file filter errors
      if (error.message === 'Only image files are allowed' || 
          error.message === 'Only JPEG, PNG, and WebP images are supported') {
        return res.status(400).json({ 
          message: error.message 
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
