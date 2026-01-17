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

// Extended keywords list
const KEYWORDS = [
  // Original
  "rsv", "renns", "gis", "cartografiere", "ortofotoplan", "harta",
  // Registru
  "registru", "registru electronic", "nomenclator stradal", "nomenclatura stradală",
  "bază de date spațială", "sistem informatic GIS", "platformă GIS",
  "digitalizare hărți", "actualizare baze de date",
  // Urbanism digital
  "urbanism digital", "PUG digital", "digitalizare PUG",
  "regulament local de urbanism", "certificat de urbanism",
  "autorizație de construire", "gestionare urbanism",
  // Spații verzi
  "registrul spațiilor verzi", "inventariere spații verzi",
  "fond verde", "mediu urban", "amenajare spații verzi",
  // Inventariere domeniu public
  "inventariere domeniu public", "baza patrimonială",
  "evidență bunuri publice", "date geospațiale", "sistem suport decizie",
  // Servicii
  "servicii informatice", "servicii de consultanță GIS",
  "servicii digitale administrație publică"
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
