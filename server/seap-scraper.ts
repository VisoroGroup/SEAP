// SEAP/SICAP Direct Acquisition Scraper - CORRECT API IMPLEMENTATION
// Based on actual e-licitatie.ro API reverse engineering

export interface SeapAcquisition {
  directAcquisitionId: number;
  publicNoticeNo: string;
  directAcquisitionName: string;
  directAcquisitionDescription?: string;
  contractingAuthorityName?: string;  // A megrendelő (autoritatea)
  supplierName?: string;               // A nyertes cég neve
  supplierId?: number;
  cpvCode: string;
  closingValue: number;
  publicationDate: string;
  finalizationDate?: string;
  sysAcquisitionContractTypeID: number;
  sysAcquisitionContractType?: { text: string };
}

export interface SeapApiResponse {
  total: number;
  items: SeapAcquisition[];
}

const BASE_URL = "https://e-licitatie.ro";
const LIST_ENDPOINT = `${BASE_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList/`;

// Keywords - comprehensive list based on actual acquisitions
const KEYWORDS = [
  // === VISORO Products ===
  "cartinspect",
  "soluție geospațială",
  "solutie geospatiala",
  "inspecție fiscală",
  "inspectie fiscala",
  "cartografie digitală",
  "cartografie digitala",
  "servicii de cartografie",

  // === RENNS - Registrul Electronic Național de Nomenclatură Stradală ===
  "renns",
  "r.e.n.n.s",
  "registrul electronic national de nomenclatura stradala",
  "registrul electronic național de nomenclatură stradală",
  "registrul electronic national al nomenclaturii stradale",
  "nomenclatura stradala",
  "nomenclatură stradală",
  "nomenclator stradal",
  "nomenclatură stradală",
  "culegere date nomenclatură stradală",

  // === RSV - Registrul Spațiilor Verzi ===
  "registrul spatiilor verzi",
  "registrul spațiilor verzi",
  "registru spatii verzi",
  "registru spații verzi",
  "registrul local al spatiilor verzi",
  "registrul local al spațiilor verzi",
  "realizare registru spatii verzi",
  "realizarea registrului spațiilor verzi",
  "spatiilor verzi",
  "spațiilor verzi",
  "spatii verzi",
  "spații verzi",

  // === GIS - Geographic Information Systems ===
  "format gis",
  "in format gis",
  "în format gis",
  "transpunere pug in format gis",
  "transpunere pug în format gis",
  "transpunere in gis",
  "transpunere în gis",
  "sistem gis",
  "sistem de informatii geografice",
  "sistem de informații geografice",
  "sistemul de informatii geografice",
  "platforma gis",
  "platformă gis",
  "software gis",
  "aplicatie gis",
  "aplicație gis",
  "servicii de gis",
  "servicii gis",
  "urban gis",
  "urbangis",
  "date spatiale",
  "baza de date gis",
  "documentatie in format digital",

  // === Ortofotoplan ===
  "ortofotoplan",
  "orto foto plan",
  "ortofoto",

  // === Cadastru/Topografie/Cartografiere ===
  "cartografiere",
  "cartografiere a zonelor rurale",
  "servicii de cartografiere a zonelor rurale",
  "servicii de cartografiere a zonelor urbane",
  "hărți digitale",
  "harti digitale",
  "harta cadastrala",
  "hartă cadastrală",
  "harti de cadastru digitale",
  "topografie",
  "topografic",
  "studiu topografic",
  "actualizare studiu topografic",
  "cadastru",
  "cadastru sistematic",
  "cadastral",
  "lucrări de cadastru",
  "servicii cadastrale",
  "inregistrare sistematica",
  "înregistrare sistematică",

  // === Registru agricol ===
  "registru agricol",
  "registrul agricol",

  // === Urbanism/PUG/PUZ ===
  "plan urbanistic",
  "planul urbanistic general",
  "pug digital",
  "puz digital",
  "transpunere pug",
  "transpunere puz",
  "urbanism digital",
  "documentatie urbanistica",
  "documentație urbanistică",
  "documentatii de urbanism",
  "documentații de urbanism",

  // === Inventariere ===
  "inventariere spatii verzi",
  "inventariere spații verzi",
  "evidenta spatii verzi",
  "evidență spații verzi",
  "inventariere domeniu public",
  "evidenta bunuri publice",
  "evidență bunuri publice",
  "intocmire registru",
  "întocmire registru",
  "intocmirea registrului",
  "întocmirea registrului",

  // === Action verbs combinations ===
  "elaborare registru",
  "elaborarea registrului",
  "gestionare registru",
  "gestionarea registrului",
  "implementare registru",
  "implementarea registrului",
  "actualizare registru",
  "actualizarea registrului",
  "realizare registru",
  "realizarea registrului",
  "realizare nomenclator",
  "realizarea nomenclatorului",
  "implementare nomenclator",
  "implementare nomenclatură",
  "servicii de elaborare",

  // === Single words (word boundary matching) ===
  "gis",
  "ortofotoplan",
  "cartografiere",
  "nomenclator",
  "geospațial",
  "geospatial",
  "topografie",
  "cadastru",
  "topografic",
  "cadastral"
];

export class SeapScraper {
  private headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://e-licitatie.ro",
    "Referer": "https://e-licitatie.ro/pub/direct-acquisitions/list/1/0"
  };

  // Convert YYYY-MM-DD to ISO UTC string for API
  private toIsoUtc(dateStr: string, isEndOfDay: boolean = false): string {
    // Parse the date string YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create date in local timezone (Romania is GMT+2)
    // For start of day: previous day 22:00 UTC (00:00 local time)
    // For end of day: current day 21:59:59 UTC (23:59:59 local time)
    if (isEndOfDay) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T21:59:59.000Z`;
    } else {
      // Start of day - previous day 22:00 UTC
      const date = new Date(Date.UTC(year, month - 1, day - 1, 22, 0, 0, 0));
      return date.toISOString();
    }
  }

  // Fetch FINALIZED acquisitions (showOngoingDa: false, uses finalizationDate)
  private async fetchFinalizedAcquisitions(dateStart: string, dateEnd: string, pageIndex = 0, pageSize = 100): Promise<SeapApiResponse | null> {
    const payload = {
      pageSize: pageSize,
      showOngoingDa: false,  // CRITICAL: false = finalized acquisitions
      pageIndex: pageIndex,
      sysDirectAcquisitionStateId: null,
      finalizationDateStart: this.toIsoUtc(dateStart, false),
      finalizationDateEnd: this.toIsoUtc(dateEnd, true),
      publicationDateStart: null,
      publicationDateEnd: null,
      cpvCodeId: null,
      contractingAuthorityId: null,
      supplierId: null,
      assignedUserId: null,
      isCentralizedProcurement: null,
      directAcquisitionName: null,
      uniqueIdentificationCode: null
    };

    if (pageIndex === 0) {
      console.log(`API Payload (Finalized): ${JSON.stringify(payload)}`);
    }

    try {
      const response = await fetch(LIST_ENDPOINT, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SEAP API error: ${response.status} - ${errorText.substring(0, 200)}`);
        return null;
      }

      return await response.json() as SeapApiResponse;
    } catch (error) {
      console.error("Error fetching SEAP data:", error);
      return null;
    }
  }

  // Fetch ONGOING acquisitions (showOngoingDa: true, uses publicationDate)
  private async fetchOngoingAcquisitions(dateStart: string, dateEnd: string, pageIndex = 0, pageSize = 100): Promise<SeapApiResponse | null> {
    const payload = {
      pageSize: pageSize,
      showOngoingDa: true,  // true = in progress acquisitions
      pageIndex: pageIndex,
      sysDirectAcquisitionStateId: null,
      finalizationDateStart: null,
      finalizationDateEnd: null,
      publicationDateStart: this.toIsoUtc(dateStart, false),
      publicationDateEnd: this.toIsoUtc(dateEnd, true),
      cpvCodeId: null,
      contractingAuthorityId: null,
      supplierId: null,
      assignedUserId: null,
      isCentralizedProcurement: null,
      directAcquisitionName: null,
      uniqueIdentificationCode: null
    };

    if (pageIndex === 0) {
      console.log(`API Payload (Ongoing): ${JSON.stringify(payload)}`);
    }

    try {
      const response = await fetch(LIST_ENDPOINT, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SEAP API error: ${response.status} - ${errorText.substring(0, 200)}`);
        return null;
      }

      return await response.json() as SeapApiResponse;
    } catch (error) {
      console.error("Error fetching SEAP data:", error);
      return null;
    }
  }

  // Keywords that need word boundary matching
  private wordBoundaryKeywords = new Set(["gis", "rsv", "pug", "puz", "pud", "renns"]);

  private findMatchingKeyword(text: string): string | null {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    for (const keyword of KEYWORDS) {
      const lowerKeyword = keyword.toLowerCase();

      if (this.wordBoundaryKeywords.has(lowerKeyword)) {
        const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
        if (regex.test(lowerText)) {
          return keyword;
        }
      } else {
        if (lowerText.includes(lowerKeyword)) {
          return keyword;
        }
      }
    }
    return null;
  }

  private async scrapeBatch(
    fetchFn: (dateStart: string, dateEnd: string, pageIndex: number) => Promise<SeapApiResponse | null>,
    dateStart: string,
    dateEnd: string,
    batchName: string
  ): Promise<any[]> {
    console.log(`\n--- Scraping ${batchName} acquisitions ---`);
    let pageIndex = 0;
    const results: any[] = [];
    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
      const data = await fetchFn(dateStart, dateEnd, pageIndex);

      if (!data || !data.items || data.items.length === 0) {
        if (pageIndex === 0) {
          console.log(`No ${batchName} items found for this date range`);
        }
        break;
      }

      totalProcessed += data.items.length;
      console.log(`${batchName} Page ${pageIndex}: ${data.items.length} items (total available: ${data.total})`);

      // Debug: Show first 3 items on first page
      if (pageIndex === 0 && data.items.length > 0) {
        console.log(`Sample ${batchName} items:`);
        data.items.slice(0, 3).forEach((item, i) => {
          const pubDate = item.publicationDate?.split('T')[0] || 'unknown';
          console.log(`  ${i + 1}. [${pubDate}] ${item.directAcquisitionName?.substring(0, 60) || 'NO NAME'}`);
        });
      }

      for (const item of data.items) {
        const keywordInName = this.findMatchingKeyword(item.directAcquisitionName);
        const keywordInDesc = this.findMatchingKeyword(item.directAcquisitionDescription || "");

        const matchedKeyword = keywordInName || keywordInDesc;

        if (matchedKeyword) {
          results.push({
            ...item,
            matchedKeyword,
            contractingAuthorityName: item.contractingAuthorityName || "Autoritate necunoscută"
          });
          console.log(`✓ MATCH: ${item.directAcquisitionName?.substring(0, 50)}... (${matchedKeyword})`);
        }
      }

      if (data.items.length < 100 || totalProcessed >= data.total) {
        hasMore = false;
      } else {
        pageIndex++;
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      }
    }

    console.log(`${batchName}: Processed ${totalProcessed} items, found ${results.length} matches`);
    return results;
  }

  public async scrapeDay(targetDate: string) {
    console.log(`\n========================================`);
    console.log(`Starting scrape for ${targetDate}`);
    console.log(`Using ${KEYWORDS.length} keywords`);
    console.log(`========================================`);

    // Scrape BOTH finalized and ongoing acquisitions
    const finalizedResults = await this.scrapeBatch(
      this.fetchFinalizedAcquisitions.bind(this),
      targetDate,
      targetDate,
      "Finalized"
    );

    const ongoingResults = await this.scrapeBatch(
      this.fetchOngoingAcquisitions.bind(this),
      targetDate,
      targetDate,
      "Ongoing"
    );

    const allResults = [...finalizedResults, ...ongoingResults];

    console.log(`\n========================================`);
    console.log(`TOTAL for ${targetDate}: ${allResults.length} matching acquisitions`);
    console.log(`========================================\n`);

    return allResults;
  }
}

export const scraper = new SeapScraper();
