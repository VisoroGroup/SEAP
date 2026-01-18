// Types based on the Python script's logic
export interface SeapAcquisition {
  directAcquisitionId: number;
  publicNoticeNo: string;
  directAcquisitionName: string;
  directAcquisitionDescription?: string;
  contractingAuthorityName?: string;  // Optional - API sometimes returns null
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

// ONLY specific keywords - no generic words that cause false positives
const KEYWORDS = [
  // === VISORO Products (your company) ===
  "cartinspect",
  "soluție geospațială",
  "solutie geospatiala",
  "inspecție fiscală",
  "inspectie fiscala",
  "cartografie digitală",
  "cartografie digitala",
  "servicii de cartografie",

  // === FULL PHRASES (exact matches) ===

  // RENNS - Registrul Electronic National al Nomenclaturii Stradale
  "registrul electronic national al nomenclaturii stradale",
  "registrul electronic național al nomenclaturii stradale",
  "nomenclatura stradala",
  "nomenclatură stradală",
  "nomenclator stradal",

  // RSV - Registrul Spatiilor Verzi
  "registrul spatiilor verzi",
  "registrul spațiilor verzi",
  "registru spatii verzi",
  "registru spații verzi",

  // GIS/Mapping phrases
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

  // === INDIVIDUAL WORDS (also match alone) ===
  "gis",
  "ortofotoplan",
  "cartografiere",
  "nomenclator",
  "nomenclatură",
  "geospațial",
  "geospatial",
  "topografie",
  "cadastru",

  // Brand names
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
          // Add item with matched keyword and ensure required fields have defaults
          results.push({
            ...item,
            matchedKeyword,
            contractingAuthorityName: item.contractingAuthorityName || "Autoritate necunoscută"
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
