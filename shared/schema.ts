import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  noticeNumber: text("notice_number").unique(), // publicNoticeNo
  title: text("title").notNull(), // directAcquisitionName
  description: text("description"), // directAcquisitionDescription
  authority: text("authority").notNull(), // contractingAuthorityName - A megrendelő
  supplier: text("supplier"), // A nyertes cég neve
  value: numeric("value").notNull(), // closingValue
  currency: text("currency").notNull().default("RON"),
  location: text("location"), // Not directly in CSV, but maybe in details
  cpvCode: text("cpv_code"),
  publicationDate: timestamp("publication_date"),
  deadline: timestamp("deadline"), // Not always present in direct acquisition
  status: text("status").notNull().default("open"),
  contractType: text("contract_type"), // sysAcquisitionContractType
  matchedKeyword: text("matched_keyword"),
  link: text("link"),
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true
});

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

// API Request/Response Types
export type CreateTenderRequest = InsertTender;
export type TenderResponse = Tender;

export interface TendersQueryParams {
  search?: string;
  location?: string;
  status?: string;
}
