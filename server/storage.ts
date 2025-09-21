import { graffitiReports, reportHistory, type GraffitiReport, type InsertGraffitiReport, type ReportHistoryEntry, type InsertReportHistoryEntry } from "@shared/schema";
import { db } from "./db.js";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getAllReports(): Promise<GraffitiReport[]>;
  getReport(id: number): Promise<GraffitiReport | undefined>;
  createReport(report: InsertGraffitiReport): Promise<GraffitiReport>;
  updateReportStatus(id: number, status: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  updateReportValidation(id: number, validated: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  updateReport(id: number, updateData: Partial<GraffitiReport>, adminUser?: string): Promise<GraffitiReport | undefined>;
  getReportsByStatus(status: string): Promise<GraffitiReport[]>;
  getReportsByDistrict(district: string): Promise<GraffitiReport[]>;
  getValidatedReports(): Promise<GraffitiReport[]>;
  getPendingReports(): Promise<GraffitiReport[]>;
  getReportHistory(reportId: number): Promise<ReportHistoryEntry[]>;
  addHistoryEntry(entry: InsertReportHistoryEntry): Promise<ReportHistoryEntry>;
  deleteReport(id: number): Promise<boolean>;
  updateReportPhotos(id: number, photoUrls: string[]): Promise<GraffitiReport | undefined>;
  updateReportMetadata(id: number, folderPath: string, csvData: string): Promise<GraffitiReport | undefined>;
  bulkUpdateReport(id: number, updates: Partial<GraffitiReport>): Promise<GraffitiReport | undefined>;
}

export class MemStorage implements IStorage {
  private reports: Map<number, GraffitiReport>;
  private history: Map<number, ReportHistoryEntry>;
  private currentId: number;
  private currentHistoryId: number;

  constructor() {
    this.reports = new Map();
    this.history = new Map();
    this.currentId = 1;
    this.currentHistoryId = 1;
    // No mock data - clean start
  }

  // Clean storage with no mock data

  async getAllReports(): Promise<GraffitiReport[]> {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getReport(id: number): Promise<GraffitiReport | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertGraffitiReport): Promise<GraffitiReport> {
    const id = this.currentId++;
    const report: GraffitiReport = {
      id,
      photos: insertReport.photos as string[],
      latitude: insertReport.latitude,
      longitude: insertReport.longitude,
      district: insertReport.district,
      description: insertReport.description,
      graffitiType: insertReport.graffitiType || null,
      name: insertReport.name || null,
      email: insertReport.email || null,
      status: insertReport.status || "new",
      validated: insertReport.validated || "pending",
      propertyOwner: insertReport.propertyOwner || null,
      propertyDescription: insertReport.propertyDescription || null,
      csvData: null,
      folderPath: null,
      timestamp: new Date()
    };
    
    this.reports.set(id, report);
    
    // Add creation history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'created',
      oldValue: null,
      newValue: 'Report created',
      adminUser: null,
      notes: `Report submitted from ${insertReport.district}`
    });
    
    return report;
  }

  async updateReportStatus(id: number, status: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const oldStatus = report.status;
    const updatedReport = { ...report, status };
    this.reports.set(id, updatedReport);
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'status_changed',
      oldValue: oldStatus,
      newValue: status,
      adminUser: adminUser || 'admin',
      notes: `Status changed from ${oldStatus} to ${status}`
    });
    
    return updatedReport;
  }

  async updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const oldOwner = report.propertyOwner || 'none';
    const updatedReport = { ...report, propertyOwner, propertyDescription: propertyDescription || null };
    this.reports.set(id, updatedReport);
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'property_updated',
      oldValue: oldOwner,
      newValue: propertyOwner,
      adminUser: adminUser || 'admin',
      notes: `Property owner updated: ${propertyDescription || 'No description'}`
    });
    
    return updatedReport;
  }

  async getReportsByStatus(status: string): Promise<GraffitiReport[]> {
    return Array.from(this.reports.values())
      .filter(report => report.status === status)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getReportsByDistrict(district: string): Promise<GraffitiReport[]> {
    return Array.from(this.reports.values())
      .filter(report => report.district === district)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async updateReportValidation(id: number, validated: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const oldValidation = report.validated;
    const updatedReport = { ...report, validated };
    this.reports.set(id, updatedReport);
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'validated',
      oldValue: oldValidation,
      newValue: validated,
      adminUser: adminUser || 'admin',
      notes: `Validation status changed from ${oldValidation} to ${validated}`
    });
    
    return updatedReport;
  }

  async updateReport(id: number, updateData: Partial<GraffitiReport>, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const oldReport = { ...report };
    const updatedReport = { ...report, ...updateData, id: report.id, timestamp: report.timestamp };
    this.reports.set(id, updatedReport);
    
    // Track what fields changed for history
    const changes: string[] = [];
    if (updateData.description !== undefined && updateData.description !== oldReport.description) {
      changes.push(`description: "${oldReport.description}" → "${updateData.description}"`);
    }
    if (updateData.district !== undefined && updateData.district !== oldReport.district) {
      changes.push(`district: "${oldReport.district}" → "${updateData.district}"`);
    }
    if (updateData.graffitiType !== undefined && updateData.graffitiType !== oldReport.graffitiType) {
      changes.push(`graffiti type: "${oldReport.graffitiType}" → "${updateData.graffitiType}"`);
    }
    if (updateData.name !== undefined && updateData.name !== oldReport.name) {
      changes.push(`name: "${oldReport.name || 'None'}" → "${updateData.name || 'None'}"`);
    }
    if (updateData.email !== undefined && updateData.email !== oldReport.email) {
      changes.push(`email: "${oldReport.email || 'None'}" → "${updateData.email || 'None'}"`);
    }
    if (updateData.latitude !== undefined && updateData.latitude !== oldReport.latitude) {
      changes.push(`latitude: ${oldReport.latitude} → ${updateData.latitude}`);
    }
    if (updateData.longitude !== undefined && updateData.longitude !== oldReport.longitude) {
      changes.push(`longitude: ${oldReport.longitude} → ${updateData.longitude}`);
    }
    
    // Add history entry if there were changes
    if (changes.length > 0) {
      await this.addHistoryEntry({
        reportId: id,
        action: 'updated',
        oldValue: null,
        newValue: 'updated',
        adminUser: adminUser || 'admin',
        notes: `Report updated: ${changes.join(', ')}`
      });
    }
    
    return updatedReport;
  }

  async getReportHistory(reportId: number): Promise<ReportHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => entry.reportId === reportId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addHistoryEntry(entry: InsertReportHistoryEntry): Promise<ReportHistoryEntry> {
    const id = this.currentHistoryId++;
    const historyEntry: ReportHistoryEntry = {
      id,
      reportId: entry.reportId,
      action: entry.action,
      oldValue: entry.oldValue || null,
      newValue: entry.newValue,
      adminUser: entry.adminUser || null,
      notes: entry.notes || null,
      timestamp: new Date()
    };
    
    this.history.set(id, historyEntry);
    return historyEntry;
  }

  async getValidatedReports(): Promise<GraffitiReport[]> {
    return Array.from(this.reports.values())
      .filter(report => report.validated === "approved")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getPendingReports(): Promise<GraffitiReport[]> {
    return Array.from(this.reports.values())
      .filter(report => report.validated === "pending")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async deleteReport(id: number): Promise<boolean> {
    const report = this.reports.get(id);
    if (!report) {
      return false;
    }

    // Clean up Firebase Storage folder if it exists
    if (report.folderPath) {
      await this.cleanupFirebaseFolder(report.folderPath);
    }

    this.reports.delete(id);
    // Also remove all history entries for this report
    const historyEntries = Array.from(this.history.values()).filter(h => h.reportId === id);
    historyEntries.forEach(entry => this.history.delete(entry.id));
    
    return true;
  }

  // Clean up entire Firebase Storage folder for a report
  async cleanupFirebaseFolder(folderPath: string): Promise<void> {
    try {
      const { getStorage, ref, listAll, deleteObject } = await import('firebase/storage');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: "graffititracker-17552.firebasestorage.app",
        appId: process.env.VITE_FIREBASE_APP_ID,
      };
      
      const firebaseApp = initializeApp(firebaseConfig);
      const firebaseStorage = getStorage(firebaseApp);
      
      // List all items in the folder
      const folderRef = ref(firebaseStorage, folderPath);
      const listResult = await listAll(folderRef);
      
      // Delete all files in the folder
      const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
      
      console.log(`Successfully cleaned up Firebase Storage folder: ${folderPath}`);
      console.log(`Deleted ${listResult.items.length} files from folder`);
      
    } catch (error) {
      console.error('Error cleaning up Firebase Storage folder:', error);
      // Don't throw error - deletion from database should still proceed
    }
  }

  async updateReportPhotos(id: number, photoUrls: string[]): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) {
      return undefined;
    }
    
    const updatedReport = { ...report, photos: photoUrls };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async updateReportMetadata(id: number, folderPath: string, csvData: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) {
      return undefined;
    }
    
    const updatedReport = { ...report, folderPath, csvData };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async bulkUpdateReport(id: number, updates: Partial<GraffitiReport>): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }
}

export class DatabaseStorage implements IStorage {
  async getAllReports(): Promise<GraffitiReport[]> {
    const reports = await db.select().from(graffitiReports).orderBy(desc(graffitiReports.timestamp));
    return reports;
  }

  async getReport(id: number): Promise<GraffitiReport | undefined> {
    const [report] = await db.select().from(graffitiReports).where(eq(graffitiReports.id, id));
    return report || undefined;
  }

  async createReport(insertReport: InsertGraffitiReport): Promise<GraffitiReport> {
    const [report] = await db
      .insert(graffitiReports)
      .values({
        photos: insertReport.photos as string[],
        latitude: insertReport.latitude,
        longitude: insertReport.longitude,
        district: insertReport.district,
        description: insertReport.description,
        name: insertReport.name || null,
        email: insertReport.email || null,
        status: insertReport.status || "new",
        validated: insertReport.validated || "pending",
        propertyOwner: insertReport.propertyOwner || null,
        propertyDescription: insertReport.propertyDescription || null
      })
      .returning();
    
    // Add creation history entry
    await this.addHistoryEntry({
      reportId: report.id,
      action: 'created',
      oldValue: null,
      newValue: 'Report created',
      adminUser: null,
      notes: `Report submitted from ${insertReport.district}`
    });
    
    return report;
  }

  async updateReportStatus(id: number, status: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = await this.getReport(id);
    if (!report) return undefined;
    
    const oldStatus = report.status;
    const [updatedReport] = await db
      .update(graffitiReports)
      .set({ status })
      .where(eq(graffitiReports.id, id))
      .returning();
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'status_changed',
      oldValue: oldStatus,
      newValue: status,
      adminUser: adminUser || 'admin',
      notes: `Status changed from ${oldStatus} to ${status}`
    });
    
    // Regenerate CSV file with updated data
    if (updatedReport) {
      await this.regenerateReportCsv(updatedReport);
    }
    
    return updatedReport;
  }

  async updateReportValidation(id: number, validated: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = await this.getReport(id);
    if (!report) return undefined;
    
    const oldValidation = report.validated;
    const [updatedReport] = await db
      .update(graffitiReports)
      .set({ validated })
      .where(eq(graffitiReports.id, id))
      .returning();
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'validated',
      oldValue: oldValidation,
      newValue: validated,
      adminUser: adminUser || 'admin',
      notes: `Validation changed from ${oldValidation} to ${validated}`
    });
    
    // Regenerate CSV file with updated data
    if (updatedReport) {
      await this.regenerateReportCsv(updatedReport);
    }
    
    return updatedReport;
  }

  async updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string, adminUser?: string): Promise<GraffitiReport | undefined> {
    const report = await this.getReport(id);
    if (!report) return undefined;
    
    const oldOwner = report.propertyOwner || 'none';
    const [updatedReport] = await db
      .update(graffitiReports)
      .set({ 
        propertyOwner, 
        propertyDescription: propertyDescription || null 
      })
      .where(eq(graffitiReports.id, id))
      .returning();
    
    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'property_updated',
      oldValue: oldOwner,
      newValue: propertyOwner,
      adminUser: adminUser || 'admin',
      notes: `Property owner updated: ${propertyDescription || 'No description'}`
    });
    
    // Regenerate CSV file with updated data
    if (updatedReport) {
      await this.regenerateReportCsv(updatedReport);
    }
    
    return updatedReport;
  }

  async updateReport(id: number, updateData: Partial<GraffitiReport>, adminUser?: string): Promise<GraffitiReport | undefined> {
    const existingReport = await this.getReport(id);
    if (!existingReport) return undefined;

    // Track what fields changed for history
    const changes: string[] = [];
    if (updateData.description !== undefined && updateData.description !== existingReport.description) {
      changes.push(`description: "${existingReport.description}" → "${updateData.description}"`);
    }
    if (updateData.district !== undefined && updateData.district !== existingReport.district) {
      changes.push(`district: "${existingReport.district}" → "${updateData.district}"`);
    }
    if (updateData.graffitiType !== undefined && updateData.graffitiType !== existingReport.graffitiType) {
      changes.push(`graffiti type: "${existingReport.graffitiType}" → "${updateData.graffitiType}"`);
    }
    if (updateData.name !== undefined && updateData.name !== existingReport.name) {
      changes.push(`name: "${existingReport.name || 'None'}" → "${updateData.name || 'None'}"`);
    }
    if (updateData.email !== undefined && updateData.email !== existingReport.email) {
      changes.push(`email: "${existingReport.email || 'None'}" → "${updateData.email || 'None'}"`);
    }
    if (updateData.latitude !== undefined && updateData.latitude !== existingReport.latitude) {
      changes.push(`latitude: ${existingReport.latitude} → ${updateData.latitude}`);
    }
    if (updateData.longitude !== undefined && updateData.longitude !== existingReport.longitude) {
      changes.push(`longitude: ${existingReport.longitude} → ${updateData.longitude}`);
    }

    // Only update if there are changes
    if (changes.length === 0) {
      return existingReport;
    }

    const [updatedReport] = await db
      .update(graffitiReports)
      .set(updateData)
      .where(eq(graffitiReports.id, id))
      .returning();

    // Add history entry
    await this.addHistoryEntry({
      reportId: id,
      action: 'updated',
      oldValue: null,
      newValue: 'updated',
      adminUser: adminUser || 'admin',
      notes: `Report updated: ${changes.join(', ')}`
    });

    // Regenerate CSV if report was updated
    await this.regenerateReportCsv(updatedReport);

    return updatedReport;
  }

  async getReportsByStatus(status: string): Promise<GraffitiReport[]> {
    const reports = await db
      .select()
      .from(graffitiReports)
      .where(eq(graffitiReports.status, status))
      .orderBy(desc(graffitiReports.timestamp));
    return reports;
  }

  async getReportsByDistrict(district: string): Promise<GraffitiReport[]> {
    const reports = await db
      .select()
      .from(graffitiReports)
      .where(eq(graffitiReports.district, district))
      .orderBy(desc(graffitiReports.timestamp));
    return reports;
  }

  async getValidatedReports(): Promise<GraffitiReport[]> {
    const reports = await db
      .select()
      .from(graffitiReports)
      .where(eq(graffitiReports.validated, 'approved'))
      .orderBy(desc(graffitiReports.timestamp));
    return reports;
  }

  async getPendingReports(): Promise<GraffitiReport[]> {
    const reports = await db
      .select()
      .from(graffitiReports)
      .where(eq(graffitiReports.validated, 'pending'))
      .orderBy(desc(graffitiReports.timestamp));
    return reports;
  }

  async getReportHistory(reportId: number): Promise<ReportHistoryEntry[]> {
    const history = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.reportId, reportId))
      .orderBy(desc(reportHistory.timestamp));
    return history;
  }

  async addHistoryEntry(entry: InsertReportHistoryEntry): Promise<ReportHistoryEntry> {
    const [historyEntry] = await db
      .insert(reportHistory)
      .values(entry)
      .returning();
    return historyEntry;
  }

  async deleteReport(id: number): Promise<boolean> {
    try {
      // Get the report first to access folder path for cleanup
      const report = await this.getReport(id);
      if (!report) {
        return false;
      }

      // Clean up Firebase Storage folder if it exists
      if (report.folderPath) {
        await this.cleanupFirebaseFolder(report.folderPath);
      }

      // Delete history entries first
      await db.delete(reportHistory).where(eq(reportHistory.reportId, id));
      
      // Delete the report
      const result = await db.delete(graffitiReports).where(eq(graffitiReports.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }

  // Clean up entire Firebase Storage folder for a report
  async cleanupFirebaseFolder(folderPath: string): Promise<void> {
    try {
      const { getStorage, ref, listAll, deleteObject } = await import('firebase/storage');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: "graffititracker-17552.firebasestorage.app",
        appId: process.env.VITE_FIREBASE_APP_ID,
      };
      
      const firebaseApp = initializeApp(firebaseConfig);
      const firebaseStorage = getStorage(firebaseApp);
      
      // List all items in the folder
      const folderRef = ref(firebaseStorage, folderPath);
      const listResult = await listAll(folderRef);
      
      // Delete all files in the folder
      const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
      
      console.log(`Successfully cleaned up Firebase Storage folder: ${folderPath}`);
      console.log(`Deleted ${listResult.items.length} files from folder`);
      
    } catch (error) {
      console.error('Error cleaning up Firebase Storage folder:', error);
      // Don't throw error - deletion from database should still proceed
    }
  }

  async updateReportPhotos(id: number, photoUrls: string[]): Promise<GraffitiReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(graffitiReports)
        .set({ photos: photoUrls })
        .where(eq(graffitiReports.id, id))
        .returning();
      
      return updatedReport;
    } catch (error) {
      console.error('Error updating report photos:', error);
      return undefined;
    }
  }

  async updateReportMetadata(id: number, folderPath: string, csvData: string): Promise<GraffitiReport | undefined> {
    try {
      const [updatedReport] = await db
        .update(graffitiReports)
        .set({ 
          folderPath: folderPath,
          csvData: csvData 
        })
        .where(eq(graffitiReports.id, id))
        .returning();
      
      return updatedReport;
    } catch (error) {
      console.error('Error updating report metadata:', error);
      return undefined;
    }
  }

  // Regenerate CSV file when report data changes
  async regenerateReportCsv(report: GraffitiReport): Promise<void> {
    if (!report.folderPath) {
      console.log(`Report ${report.id} has no folder path, skipping CSV regeneration`);
      return;
    }

    try {
      // Create updated CSV content
      const csvContent = [
        `Report ID,${report.id}`,
        `Date,${new Date(report.timestamp).toLocaleDateString('fi-FI')}`,
        `Time,${new Date(report.timestamp).toLocaleTimeString('fi-FI')}`,
        `Latitude,${report.latitude}`,
        `Longitude,${report.longitude}`,
        `District,${report.district}`,
        `Description,"${report.description.replace(/"/g, '""')}"`,
        `Submitter Name,${report.name || 'Not provided'}`,
        `Email,${report.email || 'Not provided'}`,
        `Status,${report.status}`,
        `Validation Status,${report.validated}`,
        `Property Owner,${report.propertyOwner || 'Not specified'}`,
        `Property Description,"${(report.propertyDescription || 'Not specified').replace(/"/g, '""')}"`,
        `Photo URLs,"${report.photos.join('; ')}"`,
        `Submission Timestamp,${new Date(report.timestamp).toISOString()}`,
        `Last Updated,${new Date().toISOString()}`
      ].join('\n');

      // Upload updated CSV to Firebase Storage
      const { getStorage, ref, uploadBytes } = await import('firebase/storage');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: "graffititracker-17552.firebasestorage.app",
        appId: process.env.VITE_FIREBASE_APP_ID,
      };
      
      const firebaseApp = initializeApp(firebaseConfig);
      const firebaseStorage = getStorage(firebaseApp);
      
      const csvFileName = `${report.folderPath}/report-${report.id}.csv`;
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      const csvStorageRef = ref(firebaseStorage, csvFileName);
      
      await uploadBytes(csvStorageRef, csvBuffer);
      console.log(`Successfully regenerated CSV file: ${csvFileName}`);
      
      // Update database with new CSV content
      await this.updateReportMetadata(report.id, report.folderPath, csvContent);
      
    } catch (error) {
      console.error('Error regenerating CSV file:', error);
      
      // Fallback: Just update the CSV content in database
      const csvContent = [
        `Report ID,${report.id}`,
        `Status,${report.status}`,
        `Validation Status,${report.validated}`,
        `Property Owner,${report.propertyOwner || 'Not specified'}`,
        `Last Updated,${new Date().toISOString()}`
      ].join('\n');
      
      await this.updateReportMetadata(report.id, report.folderPath, csvContent);
    }
  }

  async bulkUpdateReport(id: number, updates: Partial<GraffitiReport>): Promise<GraffitiReport | undefined> {
    const existingReport = await this.getReport(id);
    if (!existingReport) return undefined;

    // Build update object with only allowed fields
    const updateData: any = {};
    if (updates.district && updates.district !== existingReport.district) {
      updateData.district = updates.district;
    }
    if (updates.status && updates.status !== existingReport.status) {
      updateData.status = updates.status;
    }
    if (updates.validated && updates.validated !== existingReport.validated) {
      updateData.validated = updates.validated;
    }
    if (updates.propertyOwner && updates.propertyOwner !== existingReport.propertyOwner) {
      updateData.propertyOwner = updates.propertyOwner;
    }

    // Only update if there are actual changes
    if (Object.keys(updateData).length === 0) {
      return existingReport;
    }

    const [updatedReport] = await db
      .update(graffitiReports)
      .set(updateData)
      .where(eq(graffitiReports.id, id))
      .returning();

    // Add history entry for bulk update
    const changes = Object.entries(updateData).map(([key, newValue]) => {
      const oldValue = (existingReport as any)[key];
      return `${key}: "${oldValue}" → "${newValue}"`;
    }).join(', ');

    await this.addHistoryEntry({
      reportId: id,
      action: 'bulk_updated',
      oldValue: 'Multiple fields changed',
      newValue: 'Bulk update applied',
      adminUser: 'admin',
      notes: `Bulk update: ${changes}`
    });

    // Regenerate CSV file with updated data
    if (updatedReport) {
      await this.regenerateReportCsv(updatedReport);
    }

    return updatedReport;
  }
}

export const storage = new DatabaseStorage();
