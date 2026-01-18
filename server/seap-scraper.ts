import { tenders } from "@shared/schema";

// Types based on the Python script's logic
export interface SeapAcquisition {
  directAcquisitionId: number;
  publicNoticeNo: string;
  directAcquisitionName: string;
  directAcquisitionDescription?: string;
  contractingAuthorityName: string;
  cpvCode: string;
  closingValue: number;
  publicationDate: string;
  sysAcquisitionContractTypeID: number;
  sysAcquisitionContractType: { text: string };
}

export interface SeapApiResponse {
  total: number;
  items: SeapAcquisition[];
}

const BASE_URL = "https://e-licitatie.ro";
const LIST_ENDPOINT = `${BASE_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList/`;
const DETAIL_ENDPOINT = `${BASE_URL}/api-pub/DirectAcquisition/GetDirectAcquisitionView`;

// Extended keywords list - SIMPLIFIED for better matching
const KEYWORDS = [
  // Core GIS/Mapping terms (most important)
  "gis",
  "cartografiere",
  "ortofotoplan",
  "harta",
  "harti",
  "hartă",
  "hărți",
  "topografic",
  "topografie",
  "cadastru",
  "cadastral",
  "geospațial",
  "geospatial",

  // Registry terms
  "registru",
  "nomenclator",
  "nomenclatură",
  "inventariere",
  "inventar",

  // Urbanism
  "urbanism",
  "urbanistic",
  "pug",
  "puz",
  "pud",

  // Green spaces
  "spații verzi",
  "spatii verzi",
  "spațiu verde",
  "fond verde",

  // Public domain
  "domeniu public",
  "patrimoniu",
  "bunuri publice",

  // IT Services
  "sistem informatic",
  "digitalizare",
  "platformă",
  "platforma",
  "software",
  "aplicație",
  "aplicatie",

  // Original keywords
  "rsv",
  "renns"
];

export class SeapScraper {
  private headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
    "Origin": "https://e-licitatie.ro",
    "Referer": "https://e-licitatie.ro/pub/direct-acquisitions/list/1/0"
  };

  private async fetchAcquisitions(dateStart: string, dateEnd: string, pageIndex = 0, pageSize = 100): Promise<SeapApiResponse | null> {
    const payload = {
      sysDirectAcquisitionStateId: 7,
      publicationDateStart: dateStart,
      publicationDateEnd: dateEnd,
      pageSize: pageSize,
      pageIndex: pageIndex
    };

    try {
      const response = await fetch(LIST_ENDPOINT, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`SEAP API error: ${response.statusText}`);
      }

      return await response.json() as SeapApiResponse;
    } catch (error) {
      console.error("Error fetching SEAP data:", error);
      return null;
    }
  }

  private findMatchingKeyword(text: string): string | null {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    for (const keyword of KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return keyword;
      }
    }
    return null;
  }

  public async scrapeDay(targetDate: string) {
    console.log(`Starting scrape for ${targetDate}...`);
    console.log(`Using ${KEYWORDS.length} keywords`);
    let pageIndex = 0;
    const results = [];
    let hasMore = true;

    while (hasMore) {
      const data = await this.fetchAcquisitions(targetDate, targetDate, pageIndex);

      if (!data || !data.items || data.items.length === 0) {
        break;
      }

      console.log(`Page ${pageIndex}: ${data.items.length} items (total: ${data.total})`);

      // Debug: Show first 3 item names on first page to verify data
      if (pageIndex === 0 && data.items.length > 0) {
        console.log(`Sample items from page 0:`);
        data.items.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.directAcquisitionName?.substring(0, 80) || 'NO NAME'}`);
        });
      }

      for (const item of data.items) {
        const keywordInName = this.findMatchingKeyword(item.directAcquisitionName);
        const keywordInDesc = this.findMatchingKeyword(item.directAcquisitionDescription || "");

        const matchedKeyword = keywordInName || keywordInDesc;

        if (matchedKeyword) {
          results.push({
            ...item,
            matchedKeyword
          });
          console.log(`Match: ${item.directAcquisitionName.substring(0, 50)}... (${matchedKeyword})`);
        }
      }

      if (data.items.length < 100) {
        hasMore = false;
      } else {
        pageIndex++;
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Found ${results.length} matching acquisitions for ${targetDate}`);
    return results;
  }
}

export const scraper = new SeapScraper();
