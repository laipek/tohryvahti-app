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
    this.initializeMockData();
  }

  private initializeMockData() {
    // Add realistic mock reports for demonstration
    const mockReports = [
      {
        photos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
        latitude: 61.2539,
        longitude: 24.0658,
        district: 'kangasalan_keskusta',
        description: 'Suuri graffiti seinässä lähellä kauppakeskusta. Häiritsee alueen siistiä ilmettä.',
        name: 'Matti Meikäläinen',
        email: 'matti@example.com',
        status: 'new' as const,
        timestamp: new Date('2025-01-10T10:30:00Z'),
        validated: 'pending' as const,
        propertyOwner: null,
        propertyDescription: null
      },
      {
        photos: ['https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&h=300&fit=crop'],
        latitude: 61.2445,
        longitude: 24.0712,
        district: 'asema',
        description: 'Pienempi graffiti bussipysäkillä. Helposti poistettavissa.',
        name: null,
        email: null,
        status: 'progress' as const,
        timestamp: new Date('2025-01-09T14:15:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Kaupungin bussipysäkki'
      },
      {
        photos: ['https://images.unsplash.com/photo-1594736797933-d0401ba0ad3d?w=400&h=300&fit=crop'],
        latitude: 61.2612,
        longitude: 24.0534,
        district: 'raikku',
        description: 'Graffiti yksityisen rakennuksen seinässä. Omistajaa kontaktoitu.',
        name: 'Anna Virtanen',
        email: 'anna.virtanen@email.fi',
        status: 'cleaned' as const,
        timestamp: new Date('2025-01-08T16:45:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'private',
        propertyDescription: 'Yksityinen toimistorakennus'
      },
      {
        photos: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=300&fit=crop'],
        latitude: 61.2423,
        longitude: 24.0891,
        district: 'haapaniemi',
        description: 'Laaja graffiti alueellisen tien varressa. Vaatii ELY-keskuksen toimenpiteitä.',
        name: 'Pekka Järvinen',
        email: 'pekka.j@gmail.com',
        status: 'new' as const,
        timestamp: new Date('2025-01-11T09:20:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'elyKeskus',
        propertyDescription: 'Alueellinen tie 338'
      },
      {
        photos: ['https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop'],
        latitude: 61.2678,
        longitude: 24.0445,
        district: 'vehkajarvi',
        description: 'Kevyen liikenteen väylän alikulussa graffiteja. Valaistus huono.',
        name: null,
        email: null,
        status: 'progress' as const,
        timestamp: new Date('2025-01-07T12:30:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Kevyen liikenteen alikulku'
      },
      // Additional realistic reports
      {
        photos: ['https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400&h=300&fit=crop'],
        latitude: 61.2501,
        longitude: 24.0623,
        district: 'kangasalan_keskusta',
        description: 'Kirjaimia ja numeroita kaupan takaosassa. Aiheuttaa siisteyshaittan.',
        name: 'Liisa Koskinen',
        email: 'liisa.k@gmail.com',
        status: 'cleaned' as const,
        timestamp: new Date('2025-01-06T08:15:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'private',
        propertyDescription: 'Yksityinen liiketila'
      },
      {
        photos: ['https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop'],
        latitude: 61.2334,
        longitude: 24.0756,
        district: 'huutijarvi',
        description: 'Sähkökaapissa tägejä. Voi vaikuttaa turvallisuuteen.',
        name: 'Jukka Nieminen',
        email: 'j.nieminen@hotmail.com',
        status: 'progress' as const,
        timestamp: new Date('2025-01-05T15:22:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'elyKeskus',
        propertyDescription: 'Sähköinfrastruktuuri'
      },
      {
        photos: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=300&fit=crop'],
        latitude: 61.2723,
        longitude: 24.0389,
        district: 'lentola',
        description: 'Koulurakennuksen seinässä useita graffiteja. Huonontaa kouluympäristöä.',
        name: null,
        email: null,
        status: 'new' as const,
        timestamp: new Date('2025-01-04T11:45:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Peruskoulu'
      },
      {
        photos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
        latitude: 61.2567,
        longitude: 24.0234,
        district: 'suinula',
        description: 'Leikkipuiston laitteissa tägejä. Lasten leikkialue.',
        name: 'Maria Lehtonen',
        email: 'maria.lehtonen@email.fi',
        status: 'cleaned' as const,
        timestamp: new Date('2025-01-03T13:30:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Leikkipuisto'
      },
      {
        photos: ['https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&h=300&fit=crop'],
        latitude: 61.2689,
        longitude: 24.0578,
        district: 'tiihala',
        description: 'Sillan alle useita graffiteja. Vaikuttaa alueen viihtyisyyteen.',
        name: 'Petri Salminen',
        email: 'petri.s@outlook.com',
        status: 'progress' as const,
        timestamp: new Date('2025-01-02T16:10:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Ylikulkusilta'
      },
      {
        photos: ['https://images.unsplash.com/photo-1594736797933-d0401ba0ad3d?w=400&h=300&fit=crop'],
        latitude: 61.2412,
        longitude: 24.0834,
        district: 'ruutana',
        description: 'Yksityisen omakotitalon aidan seinässä graffiti.',
        name: 'Kari Virtanen',
        email: 'kari.v@gmail.com',
        status: 'new' as const,
        timestamp: new Date('2025-01-01T09:45:00Z'),
        validated: 'pending' as const,
        propertyOwner: null,
        propertyDescription: null
      },
      {
        photos: ['https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=400&h=300&fit=crop'],
        latitude: 61.2298,
        longitude: 24.0623,
        district: 'ilkko',
        description: 'Urheilukentän katsomon seinässä isoja kirjaimia.',
        name: 'Sanna Mäkelä',
        email: 'sanna.makela@email.fi',
        status: 'progress' as const,
        timestamp: new Date('2024-12-30T14:20:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Urheilukenttä'
      },
      {
        photos: ['https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400&h=300&fit=crop'],
        latitude: 61.2634,
        longitude: 24.0467,
        district: 'lamminrahka',
        description: 'Putoamisvaara: graffiti korkealla seinässä.',
        name: null,
        email: null,
        status: 'new' as const,
        timestamp: new Date('2024-12-29T10:15:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'private',
        propertyDescription: 'Teollisuusrakennus'
      },
      {
        photos: ['https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop'],
        latitude: 61.2445,
        longitude: 24.0289,
        district: 'kuohenmaa',
        description: 'Bussipysäkin katoksessa useita tägejä.',
        name: 'Timo Hakkarainen',
        email: 'timo.h@hotmail.com',
        status: 'cleaned' as const,
        timestamp: new Date('2024-12-28T12:40:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Joukkoliikenteen pysäkki'
      },
      {
        photos: ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=300&fit=crop'],
        latitude: 61.2556,
        longitude: 24.0712,
        district: 'ranta_koivisto',
        description: 'Rantakävelytien kaidetta töhritty useissa paikoissa.',
        name: 'Elena Virtanen',
        email: 'elena.v@gmail.com',
        status: 'progress' as const,
        timestamp: new Date('2024-12-27T15:55:00Z'),
        validated: 'approved' as const,
        propertyOwner: 'city',
        propertyDescription: 'Rantakävelytie'
      },
      {
        photos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
        latitude: 61.2378,
        longitude: 24.0445,
        district: 'raudanmaa',
        description: 'Vanha teollisuusrakennus täynnä graffiteja.',
        name: 'Mikko Lahtinen',
        email: 'mikko.lahtinen@email.fi',
        status: 'new' as const,
        timestamp: new Date('2024-12-26T11:25:00Z'),
        validated: 'rejected' as const,
        propertyOwner: 'private',
        propertyDescription: 'Hylätty teollisuuskiinteistö'
      }
    ];

    mockReports.forEach(report => {
      const fullReport: GraffitiReport = {
        id: this.currentId++,
        ...report
      };
      this.reports.set(fullReport.id, fullReport);
    });
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
