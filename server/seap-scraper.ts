// SEAP/SICAP Direct Acquisition Scraper - CORRECT API IMPLEMENTATION
// Based on actual e-licitatie.ro API reverse engineering

export interface SeapAcquisition {
  directAcquisitionId: number;
  publicNoticeNo: string;
  directAcquisitionName: string;
  directAcquisitionDescription?: string;
  contractingAuthorityName?: string;
  cpvCode: string;
  closingValue: number;
  publicationDate: string;
  sysAcquisitionContractTypeID: number;
  sysAcquisitionContractType?: { text: string };
}

export interface SeapApiResponse {
  total: number;
  items: SeapAcquisition[];
}

const BASE_URL = "https://e-licitatie.ro";
const LIST_ENDPOINT = `${BASE_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList/`;

// Keywords - specific to your business
const KEYWORDS = [
  // VISORO Products
  "cartinspect",
  "soluție geospațială",
  "solutie geospatiala",
  "inspecție fiscală",
  "inspectie fiscala",
  "cartografie digitală",
  "cartografie digitala",
  "servicii de cartografie",

  // RENNS
  "registrul electronic national al nomenclaturii stradale",
  "registrul electronic național al nomenclaturii stradale",
  "nomenclatura stradala",
  "nomenclatură stradală",
  "nomenclator stradal",

  // RSV
  "registrul spatiilor verzi",
  "registrul spațiilor verzi",
  "registru spatii verzi",
  "registru spații verzi",

  // GIS
  "sistem geografic",
  "sistem informatic geografic",
  "platforma gis",
  "platformă gis",
  "sistem gis",
  "software gis",
  "aplicatie gis",
  "aplicație gis",

  // Ortofotoplan
  "ortofotoplan",
  "orto foto plan",
  "ortofoto",

  // Cadastru/Cartografiere
  "cartografiere",
  "hărți digitale",
  "harti digitale",
  "harta cadastrala",
  "hartă cadastrală",
  "topografie",
  "topografic",
  "cadastru",
  "cadastral",
  "geospatial",
  "geospațial",

  // Registru agricol
  "registru agricol",
  "registrul agricol",

  // Urbanism
  "plan urbanistic",
  "pug digital",
  "puz digital",
  "urbanism digital",
  "documentatie urbanistica",
  "documentație urbanistică",

  // Inventariere
  "inventariere spatii verzi",
  "inventariere spații verzi",
  "evidenta spatii verzi",
  "evidență spații verzi",
  "inventariere domeniu public",
  "evidenta bunuri publice",
  "evidență bunuri publice",

  // Single words (with word boundary matching)
  "gis",
  "ortofotoplan",
  "cartografiere",
  "nomenclator",
  "nomenclatură",
  "geospațial",
  "geospatial",
  "topografie",
  "cadastru",

  // Simpler phrases that don't cause false positives
  "spatii verzi",
  "spații verzi",

  // Brand names - only RENNS (rsv removed because it matches RSV virus in COVID tests)
  "renns"
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
