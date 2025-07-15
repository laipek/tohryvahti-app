import { pgTable, text, serial, timestamp, json, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const graffitiReports = pgTable("graffiti_reports", {
  id: serial("id").primaryKey(),
  photos: json("photos").$type<string[]>().notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  district: text("district").notNull(),
  description: text("description").notNull(),
  name: text("name"),
  email: text("email"),
  status: text("status").notNull().default("new"), // new, progress, cleaned
  validated: text("validated").notNull().default("pending"), // pending, approved, rejected
  propertyOwner: text("property_owner"), // "city", "ely-keskus", "private"
  propertyDescription: text("property_description"), // Additional details about the property
  csvData: text("csv_data"), // Store CSV content or URL
  folderPath: text("folder_path"), // Store the organized folder path
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const reportHistory = pgTable("report_history", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => graffitiReports.id),
  action: text("action").notNull(), // "created", "status_changed", "validated", "property_updated"
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  adminUser: text("admin_user"), // username of admin who made the change
  notes: text("notes"), // optional notes about the change
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertGraffitiReportSchema = createInsertSchema(graffitiReports).omit({
  id: true,
  timestamp: true,
});

export const insertReportHistorySchema = createInsertSchema(reportHistory).omit({
  id: true,
  timestamp: true,
});

export type InsertGraffitiReport = z.infer<typeof insertGraffitiReportSchema>;
export type GraffitiReport = typeof graffitiReports.$inferSelect;
export type ReportHistoryEntry = typeof reportHistory.$inferSelect;
export type InsertReportHistoryEntry = z.infer<typeof insertReportHistorySchema>;
