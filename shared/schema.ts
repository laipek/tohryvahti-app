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
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertGraffitiReportSchema = createInsertSchema(graffitiReports).omit({
  id: true,
  timestamp: true,
});

export type InsertGraffitiReport = z.infer<typeof insertGraffitiReportSchema>;
export type GraffitiReport = typeof graffitiReports.$inferSelect;
