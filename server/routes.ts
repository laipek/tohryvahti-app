import type { Express } from "express";
import { storage } from "./storage.js";
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

export function registerRoutes(app: Express): void {
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

      // Generate folder structure based on datetime and report ID
      const now = new Date();
      const dateFolder = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeFolder = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
      
      // Create temporary report to get ID for folder naming
      const tempReportData = {
        photos: [], // Will be updated after upload
        latitude,
        longitude,
        district,
        description,
        name,
        email,
        status,
        validated
      };
      
      const validatedTempData = insertGraffitiReportSchema.parse(tempReportData);
      const tempReport = await storage.createReport(validatedTempData);
      const reportId = tempReport.id;
      
      // Create folder structure: reports/YYYY-MM-DD/HH-MM-SS-reportID/
      const reportFolder = `reports/${dateFolder}/${timeFolder}-${reportId}`;
      
      // Process uploaded images with parallel upload for better performance
      const uploadedFiles = req.files as Express.Multer.File[];
      
      console.log(`Starting parallel upload of ${uploadedFiles.length} files...`);
      const uploadPromises = uploadedFiles.map(async (file, index) => {
        try {
          // Try Firebase Storage first with organized folder structure
          const fileName = `${reportFolder}/image-${index + 1}-${file.originalname}`;
          const storageRef = ref(firebaseStorage, fileName);
          const snapshot = await uploadBytes(storageRef, file.buffer);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log(`Successfully uploaded ${fileName} to Firebase Storage`);
          return downloadURL;
        } catch (firebaseError: any) {
          console.log('Firebase Storage failed, using base64 fallback:', firebaseError.code || firebaseError.message);
          
          // Fallback: Convert to base64 and store in database
          const mimeType = file.mimetype;
          const base64Data = file.buffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64Data}`;
          
          console.log(`Using base64 fallback for ${file.originalname} (${file.size} bytes)`);
          return dataUrl;
        }
      });
      
      // Wait for all uploads to complete in parallel
      const photoUrls = await Promise.all(uploadPromises);
      console.log(`Parallel upload completed: ${photoUrls.length} files processed`);
      
      // Create CSV content asynchronously for better performance
      const csvContent = [
        'Field,Value',
        `Report ID,${reportId}`,
        `Date,${now.toISOString().split('T')[0]}`,
        `Time,${now.toISOString().split('T')[1].split('.')[0]}`,
        `Latitude,${latitude}`,
        `Longitude,${longitude}`,
        `District,${district}`,
        `Description,"${description.replace(/"/g, '""')}"`, // Escape quotes in CSV
        `Graffiti Type,${req.body.graffitiType || 'Not specified'}`,
        `Name,${name || 'Anonymous'}`,
        `Email,${email || 'Not provided'}`,
        `Status,${status}`,
        `Validation Status,${validated}`,
        `Number of Photos,${photoUrls.length}`,
        `Photo URLs,"${photoUrls.join('; ')}"`,
        `Submission Timestamp,${now.toISOString()}`
      ].join('\n');
      
      // Perform database update and CSV storage in parallel
      try {
        const csvFileName = `${reportFolder}/report-${reportId}.csv`;
        const csvBuffer = Buffer.from(csvContent, 'utf8');
        const csvStorageRef = ref(firebaseStorage, csvFileName);
        await uploadBytes(csvStorageRef, csvBuffer);
        console.log(`Successfully uploaded CSV file: ${csvFileName}`);
        
        // Store CSV URL and folder path in database for future access
        await storage.updateReportMetadata(reportId, reportFolder, `https://firebasestorage.googleapis.com/v0/b/graffititracker-17552.firebasestorage.app/o/${encodeURIComponent(csvFileName)}?alt=media`);
      } catch (csvError) {
        console.log('Failed to upload CSV file to Firebase Storage, storing locally:', csvError);
        
        // Fallback: Store CSV content and folder path in database
        await storage.updateReportMetadata(reportId, reportFolder, csvContent);
      }

      console.log('Processing report:', {
        reportId,
        latitude,
        longitude,
        district,
        description,
        photoUrls: photoUrls.length,
        name,
        email,
        status,
        validated,
        folderPath: reportFolder
      });

      if (photoUrls.length === 0) {
        return res.status(500).json({ message: "Failed to process any images" });
      }

      // Update the temporary report with photo URLs
      const updatedReportData = {
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

      const validatedData = insertGraffitiReportSchema.parse(updatedReportData);
      
      // Update the existing report instead of creating a new one
      const updatedReport = await storage.updateReportPhotos(reportId, photoUrls);
      
      console.log('Report updated successfully with photos:', reportId);
      res.status(201).json(updatedReport || tempReport);
    } catch (error) {
      console.error('Error creating report:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      // Handle multer errors with Finnish error messages
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: "Tiedosto on liian suuri. Enimmäiskoko on 25MB per tiedosto.",
            messageEn: "File too large. Maximum file size is 25MB per file.",
            messageSv: "Filen är för stor. Maximal filstorlek är 25MB per fil."
          });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: "Liian monta tiedostoa. Enintään 5 tiedostoa sallittu.",
            messageEn: "Too many files. Maximum 5 files allowed.",
            messageSv: "För många filer. Högst 5 filer tillåtna."
          });
        }
        return res.status(400).json({ 
          message: "Tiedoston latausvirhe: " + error.message,
          messageEn: "File upload error: " + error.message,
          messageSv: "Filuppladdningsfel: " + error.message
        });
      }
      
      // Handle custom file filter errors
      if (error instanceof Error && (error.message === 'Only image files are allowed' || 
          error.message === 'Only JPEG, PNG, and WebP images are supported')) {
        return res.status(400).json({ 
          message: error.message 
        });
      }
      
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Bulk update reports
  app.patch("/api/reports/bulk-update", async (req, res) => {
    try {
      const { reportIds, updates } = req.body;
      
      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ message: "reportIds must be a non-empty array" });
      }
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: "updates object is required" });
      }
      
      // Validate update fields
      const allowedUpdates = ['district', 'status', 'validated', 'ownership'];
      const updateKeys = Object.keys(updates);
      const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
      
      if (invalidKeys.length > 0) {
        return res.status(400).json({ 
          message: `Invalid update fields: ${invalidKeys.join(', ')}` 
        });
      }
      
      // Validate update values
      if (updates.status && !["new", "progress", "cleaned"].includes(updates.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      if (updates.validated && !["pending", "approved", "rejected"].includes(updates.validated)) {
        return res.status(400).json({ message: "Invalid validation value" });
      }
      
      if (updates.ownership && !["city", "ely", "private"].includes(updates.ownership)) {
        return res.status(400).json({ message: "Invalid ownership value" });
      }
      
      // Perform bulk update
      const updatedReports = [];
      for (const reportId of reportIds) {
        if (typeof reportId !== 'number' || isNaN(reportId)) {
          continue; // Skip invalid IDs
        }
        
        try {
          const updatedReport = await storage.bulkUpdateReport(reportId, updates);
          if (updatedReport) {
            updatedReports.push(updatedReport);
          }
        } catch (error: any) {
          console.error(`Failed to update report ${reportId}:`, error);
          // Continue with other reports even if one fails
        }
      }
      
      res.json({ 
        message: `Successfully updated ${updatedReports.length} of ${reportIds.length} reports`,
        updatedReports 
      });
    } catch (error: any) {
      console.error("Error in bulk update:", error);
      res.status(500).json({ message: "Failed to perform bulk update" });
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

  // Update graffiti report details
  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }
      
      const updatedReport = await storage.updateReport(id, updateData, "admin");
      
      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
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

  // Routes registered successfully
}
