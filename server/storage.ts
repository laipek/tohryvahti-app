import { graffitiReports, type GraffitiReport, type InsertGraffitiReport } from "@shared/schema";

export interface IStorage {
  getAllReports(): Promise<GraffitiReport[]>;
  getReport(id: number): Promise<GraffitiReport | undefined>;
  createReport(report: InsertGraffitiReport): Promise<GraffitiReport>;
  updateReportStatus(id: number, status: string): Promise<GraffitiReport | undefined>;
  updateReportValidation(id: number, validated: string): Promise<GraffitiReport | undefined>;
  updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string): Promise<GraffitiReport | undefined>;
  getReportsByStatus(status: string): Promise<GraffitiReport[]>;
  getReportsByDistrict(district: string): Promise<GraffitiReport[]>;
  getValidatedReports(): Promise<GraffitiReport[]>;
  getPendingReports(): Promise<GraffitiReport[]>;
}

export class MemStorage implements IStorage {
  private reports: Map<number, GraffitiReport>;
  private currentId: number;

  constructor() {
    this.reports = new Map();
    this.currentId = 1;
  }

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
    return report;
  }

  async updateReportStatus(id: number, status: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, status };
    this.reports.set(id, updatedReport);
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

  async updateReportValidation(id: number, validated: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, validated };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async updateReportProperty(id: number, propertyOwner: string, propertyDescription?: string): Promise<GraffitiReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { 
      ...report, 
      propertyOwner,
      propertyDescription: propertyDescription !== undefined ? propertyDescription : report.propertyDescription
    };
    this.reports.set(id, updatedReport);
    return updatedReport;
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
}

export const storage = new MemStorage();
