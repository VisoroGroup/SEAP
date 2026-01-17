import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { scraper } from "./seap-scraper";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.tenders.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const location = req.query.location as string | undefined;
    const status = req.query.status as string | undefined;
    const tenders = await storage.getTenders({ search, location, status });
    res.json(tenders);
  });

  app.get(api.tenders.get.path, async (req, res) => {
    const tender = await storage.getTender(Number(req.params.id));
    if (!tender) {
      return res.status(404).json({ message: 'Tender not found' });
    }
    res.json(tender);
  });

  app.post(api.tenders.create.path, async (req, res) => {
    try {
      const input = api.tenders.create.input.parse(req.body);
      const tender = await storage.createTender(input);
      res.status(201).json(tender);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed database with sample data
  await seedDatabase();

  // Scraper Trigger Endpoint
  app.post("/api/scrape", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const results = await scraper.scrapeDay(today);
      
      const saved = [];
      for (const item of results) {
        const tender = await storage.upsertTender({
          noticeNumber: item.publicNoticeNo,
          title: item.directAcquisitionName,
          description: item.directAcquisitionDescription || "",
          authority: item.contractingAuthorityName,
          value: item.closingValue.toString(),
          currency: "RON",
          cpvCode: item.cpvCode,
          publicationDate: new Date(item.publicationDate),
          status: "closed", // ID 7 is usually closed/awarded
          matchedKeyword: item.matchedKeyword,
          link: `https://e-licitatie.ro/pub/direct-acquisition/view/${item.directAcquisitionId}`,
          contractType: item.sysAcquisitionContractType?.text
        });
        saved.push(tender);
      }

      res.json({ message: `Scraped and saved ${saved.length} tenders`, count: saved.length });
    } catch (error) {
      console.error("Scrape error:", error);
      res.status(500).json({ message: "Failed to scrape SEAP" });
    }
  });

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getTenders();
  if (existing.length === 0) {
    const now = new Date();
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    await storage.createTender({
      noticeNumber: "DA-2025-001234",
      title: "Servicii de cartografiere și realizare ortofotoplan pentru UAT Comuna Florești",
      description: "Servicii profesionale de realizare a documentației cadastrale și cartografice pentru întocmirea planurilor urbanistice generale.",
      authority: "Primăria Comunei Florești",
      value: "185000",
      currency: "RON",
      location: "Cluj",
      cpvCode: "71354300-7",
      publicationDate: now,
      deadline: oneMonth,
      status: "open",
      matchedKeyword: "cartografiere",
      link: "https://e-licitatie.ro/pub/direct-acquisition/view/123456"
    });

    await storage.createTender({
      noticeNumber: "DA-2025-001567",
      title: "Achiziție sistem GIS pentru monitorizarea infrastructurii rutiere județene",
      description: "Furnizare și implementare sistem informatic geografic (GIS) pentru gestionarea și monitorizarea drumurilor județene.",
      authority: "Consiliul Județean Timiș",
      value: "450000",
      currency: "RON",
      location: "Timișoara",
      cpvCode: "48600000-4",
      publicationDate: now,
      deadline: twoMonths,
      status: "open",
      matchedKeyword: "gis",
      link: "https://e-licitatie.ro/pub/direct-acquisition/view/123457"
    });

    await storage.createTender({
      noticeNumber: "DA-2025-000892",
      title: "Servicii de realizare hărți digitale pentru planul urbanistic zonal",
      description: "Elaborarea documentației tehnice și a hărților digitale necesare pentru actualizarea planului urbanistic zonal al municipiului.",
      authority: "Primăria Municipiului Oradea",
      value: "95000",
      currency: "RON",
      location: "Oradea",
      cpvCode: "71354100-5",
      publicationDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: "closed",
      matchedKeyword: "harta",
      link: "https://e-licitatie.ro/pub/direct-acquisition/view/123458"
    });

    await storage.createTender({
      noticeNumber: "DA-2025-002103",
      title: "Ortofotoplan digital pentru registrul agricol electronic",
      description: "Realizarea ortofotoplanului digital de înaltă rezoluție pentru implementarea sistemului electronic de evidență a registrului agricol.",
      authority: "Agenția pentru Dezvoltare Regională Nord-Vest",
      value: "720000",
      currency: "RON",
      location: "Regiune Nord-Vest",
      cpvCode: "71355000-1",
      publicationDate: now,
      deadline: twoMonths,
      status: "open",
      matchedKeyword: "ortofotoplan",
      link: "https://e-licitatie.ro/pub/direct-acquisition/view/123459"
    });

    console.log("Database seeded with sample tenders");
  }
}
