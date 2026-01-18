// SEAP/SICAP Direct Acquisition Scraper with proper session handling

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

  // Brand names
  "rsv",
  "renns"
];

export class SeapScraper {
  private cookies: string = "";
  private sessionInitialized = false;

  private headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Origin": "https://e-licitatie.ro",
    "Referer": "https://e-licitatie.ro/pub/direct-acquisitions/list/1/0"
  };

  // Initialize session by visiting main page first (gets cookies)
  private async initializeSession(): Promise<void> {
    if (this.sessionInitialized) return;

    console.log("Initializing session with e-licitatie.ro...");

    try {
      // First, visit the main direct acquisitions page
      const response = await fetch("https://e-licitatie.ro/pub/direct-acquisitions/list/1/0", {
        method: 'GET',
        headers: {
          "User-Agent": this.headers["User-Agent"],
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ro-RO,ro;q=0.9"
        }
      });

      // Extract cookies from response
      const setCookieHeaders = response.headers.get('set-cookie');
      if (setCookieHeaders) {
        this.cookies = setCookieHeaders;
        console.log("Session cookies obtained");
      }

      this.sessionInitialized = true;
      console.log("Session initialized successfully");

      // Small delay after initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  }

  private async fetchAcquisitions(dateStart: string, dateEnd: string, pageIndex = 0, pageSize = 100): Promise<SeapApiResponse | null> {
    // Ensure session is initialized
    await this.initializeSession();

    const payload = {
      pageSize: pageSize,
      pageIndex: pageIndex,
      sysDirectAcquisitionStateId: null,
      publicationDateStart: dateStart,
      publicationDateEnd: dateEnd,
      finalizationDateStart: null,
      finalizationDateEnd: null,
      cpvCodeId: null,
      contractingAuthorityId: null,
      supplierId: null,
      assignedUserId: null,
      isCentralizedProcurement: null
    };

    if (pageIndex === 0) {
      console.log(`API Payload: ${JSON.stringify(payload)}`);
    }

    try {
      const requestHeaders: Record<string, string> = {
        ...this.headers,
        "Content-Type": "application/json"
      };

      if (this.cookies) {
        requestHeaders["Cookie"] = this.cookies;
      }

      const response = await fetch(LIST_ENDPOINT, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SEAP API error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json() as SeapApiResponse;

      // Debug: Check if we're getting dates from the right period
      if (pageIndex === 0 && data.items && data.items.length > 0) {
        const firstItemDate = data.items[0].publicationDate;
        console.log(`First item publication date: ${firstItemDate}`);
      }

      return data;
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

      // Debug: Show first 3 items on first page
      if (pageIndex === 0 && data.items.length > 0) {
        console.log(`Sample items from page 0:`);
        data.items.slice(0, 3).forEach((item, i) => {
          const pubDate = item.publicationDate?.split('T')[0] || 'unknown date';
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
          console.log(`Match: ${item.directAcquisitionName.substring(0, 50)}... (${matchedKeyword})`);
        }
      }

      if (data.items.length < 100) {
        hasMore = false;
      } else {
        pageIndex++;
        // Rate limiting - random delay between 500-1500ms
        const delay = 500 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`Found ${results.length} matching acquisitions for ${targetDate}`);
    return results;
  }

  // Reset session for next scrape
  public resetSession() {
    this.sessionInitialized = false;
    this.cookies = "";
  }
}

export const scraper = new SeapScraper();
