import { db } from "./db";
import { tenders, type Tender, type InsertTender } from "@shared/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  getTenders(params?: { search?: string, location?: string, status?: string }): Promise<Tender[]>;
  getTender(id: number): Promise<Tender | undefined>;
  createTender(tender: InsertTender): Promise<Tender>;
  upsertTender(tender: InsertTender): Promise<Tender>;
}

export class DatabaseStorage implements IStorage {
  async getTenders(params?: { search?: string, location?: string, status?: string }): Promise<Tender[]> {
    const conditions = [];

    if (params?.search) {
      conditions.push(or(
        ilike(tenders.title, `%${params.search}%`),
        ilike(tenders.description, `%${params.search}%`),
        ilike(tenders.authority, `%${params.search}%`)
      ));
    }

    if (params?.location) {
      conditions.push(ilike(tenders.location, `%${params.location}%`));
    }

    if (params?.status) {
      conditions.push(eq(tenders.status, params.status));
    }

    return await db.select().from(tenders).where(and(...conditions)).orderBy(tenders.publicationDate);
  }

  async getTender(id: number): Promise<Tender | undefined> {
    const [tender] = await db.select().from(tenders).where(eq(tenders.id, id));
    return tender;
  }

  async createTender(insertTender: InsertTender): Promise<Tender> {
    const [tender] = await db.insert(tenders).values(insertTender).returning();
    return tender;
  }

  async upsertTender(insertTender: InsertTender): Promise<Tender> {
    // If noticeNumber exists, update; otherwise insert
    if (insertTender.noticeNumber) {
      const existing = await db.select().from(tenders).where(eq(tenders.noticeNumber, insertTender.noticeNumber));
      if (existing.length > 0) {
        const [updated] = await db.update(tenders)
          .set(insertTender)
          .where(eq(tenders.noticeNumber, insertTender.noticeNumber))
          .returning();
        return updated;
      }
    }
    return this.createTender(insertTender);
  }
}

export const storage = new DatabaseStorage();
