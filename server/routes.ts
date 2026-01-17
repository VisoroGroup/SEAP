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
