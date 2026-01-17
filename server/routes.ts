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
      return res.status(404).json({ message: 'Achiziția nu a fost găsită' });
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

  // Scraper Trigger Endpoint - scrape today
  app.post("/api/scrape", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const results = await scraper.scrapeDay(today);

      const saved = await saveTenders(results);

      res.json({ message: `S-au salvat ${saved.length} achiziții noi`, count: saved.length });
    } catch (error) {
      console.error("Eroare la scraping:", error);
      res.status(500).json({ message: "Eroare la preluarea datelor SEAP" });
    }
  });

  // Scrape a specific date range (for historical data like 2025)
  app.post("/api/scrape/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate și endDate sunt obligatorii" });
      }

      console.log(`=== Începe scraping istoric: ${startDate} - ${endDate} ===`);

      const start = new Date(startDate);
      const end = new Date(endDate);
      let totalSaved = 0;
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`Procesare: ${dateStr}`);

        try {
          const results = await scraper.scrapeDay(dateStr);
          const saved = await saveTenders(results);
          totalSaved += saved.length;
          console.log(`  -> ${saved.length} achiziții salvate`);
        } catch (dayError) {
          console.error(`  -> Eroare pentru ${dateStr}:`, dayError);
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);

        // Rate limiting between days
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`=== Scraping istoric finalizat: ${totalSaved} achiziții salvate ===`);
      res.json({
        message: `Scraping istoric finalizat`,
        totalSaved,
        startDate,
        endDate
      });
    } catch (error) {
      console.error("Eroare la scraping istoric:", error);
      res.status(500).json({ message: "Eroare la preluarea datelor istorice SEAP" });
    }
  });

  // Clear all tenders (useful before loading fresh data)
  app.delete("/api/tenders/all", async (req, res) => {
    try {
      await storage.clearAllTenders();
      res.json({ message: "Toate achizițiile au fost șterse" });
    } catch (error) {
      console.error("Eroare la ștergere:", error);
      res.status(500).json({ message: "Eroare la ștergerea datelor" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    const tenders = await storage.getTenders();
    const totalValue = tenders.reduce((sum, t) => sum + Number(t.value || 0), 0);

    const keywordStats: Record<string, number> = {};
    tenders.forEach(t => {
      if (t.matchedKeyword) {
        keywordStats[t.matchedKeyword] = (keywordStats[t.matchedKeyword] || 0) + 1;
      }
    });

    res.json({
      totalTenders: tenders.length,
      totalValue,
      keywordStats,
      currency: "RON"
    });
  });

  return httpServer;
}

async function saveTenders(results: any[]) {
  const saved = [];
  for (const item of results) {
    try {
      const tender = await storage.upsertTender({
        noticeNumber: item.publicNoticeNo,
        title: item.directAcquisitionName,
        description: item.directAcquisitionDescription || "",
        authority: item.contractingAuthorityName,
        value: item.closingValue?.toString() || "0",
        currency: "RON",
        cpvCode: item.cpvCode,
        publicationDate: new Date(item.publicationDate),
        status: "closed",
        matchedKeyword: item.matchedKeyword,
        link: `https://e-licitatie.ro/pub/direct-acquisition/view/${item.directAcquisitionId}`,
        contractType: item.sysAcquisitionContractType?.text
      });
      saved.push(tender);
    } catch (err) {
      console.error(`Eroare la salvarea ${item.publicNoticeNo}:`, err);
    }
  }
  return saved;
}
