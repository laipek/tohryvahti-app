import { graffitiReports, reportHistory, type GraffitiReport, type InsertGraffitiReport, type ReportHistoryEntry, type InsertReportHistoryEntry } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getAllReports(): Promise<GraffitiReport[]>;
  getReport(id: number): Promise<GraffitiReport | undefined>;
  createReport(report: InsertGraffitiReport): Promise<GraffitiReport>;
  updateReportStatus(id: number, status: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  updateReportValidation(id: number, validated: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string, adminUser?: string): Promise<GraffitiReport | undefined>;
  getReportsByStatus(status: string): Promise<GraffitiReport[]>;
  getReportsByDistrict(district: string): Promise<GraffitiReport[]>;
  getValidatedReports(): Promise<GraffitiReport[]>;
  getPendingReports(): Promise<GraffitiReport[]>;
  getReportHistory(reportId: number): Promise<ReportHistoryEntry[]>;
  addHistoryEntry(entry: InsertReportHistoryEntry): Promise<ReportHistoryEntry>;
  deleteReport(id: number): Promise<boolean>;
  updateReportPhotos(id: number, photoUrls: string[]): Promise<GraffitiReport | undefined>;
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
      name: insertReport.name || null,
      email: insertReport.email || null,
      status: insertReport.status || "new",
      validated: insertReport.validated || "pending",
      propertyOwner: insertReport.propertyOwner || null,
      propertyDescription: insertReport.propertyDescription || null,
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
    const exists = this.reports.has(id);
    if (exists) {
      this.reports.delete(id);
      // Also remove all history entries for this report
      const historyEntries = Array.from(this.history.values()).filter(h => h.reportId === id);
      historyEntries.forEach(entry => this.history.delete(entry.id));
    }
    return exists;
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
}

export const storage = new DatabaseStorage();
