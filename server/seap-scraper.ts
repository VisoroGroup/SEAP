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

// Keywords from the Python script
const KEYWORDS = [
  "rsv",
  "renns", 
  "gis",
  "cartografiere",
  "ortofotoplan",
  "harta"
];

export class SeapScraper {
  private async fetchAcquisitions(dateStart: string, dateEnd: string, pageIndex = 0, pageSize = 100): Promise<SeapApiResponse | null> {
    const payload = {
      sysDirectAcquisitionStateId: 7, // Public/Closed
      publicationDateStart: dateStart,
      publicationDateEnd: dateEnd,
      pageSize: pageSize,
      pageIndex: pageIndex
    };

    try {
      const response = await fetch(LIST_ENDPOINT, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "SEAP-Scraper/1.0"
        },
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
    let pageIndex = 0;
    const results = [];
    let hasMore = true;

    while (hasMore) {
      const data = await this.fetchAcquisitions(targetDate, targetDate, pageIndex);
      
      if (!data || !data.items || data.items.length === 0) {
        break;
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
        }
      }

      if (data.items.length < 100) {
        hasMore = false;
      } else {
        pageIndex++;
      }
    }

    console.log(`Found ${results.length} matching acquisitions for ${targetDate}`);
    return results;
  }
}

export const scraper = new SeapScraper();
