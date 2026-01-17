"""
SEAP/SICAP Direkt Beszerzések Gyűjtő
=====================================
Ez a script a román e-licitatie.ro rendszerből gyűjti a direkt beszerzéseket
és szűri azokat megadott kulcsszavak alapján.

Használat: python main.py
A script automatikusan az aznapi beszerzéseket kérdezi le.
"""

import requests
import csv
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

# ============================================================================
# KONFIGURÁCIÓ
# ============================================================================

# API végpontok
BASE_URL = "https://e-licitatie.ro"
LIST_ENDPOINT = f"{BASE_URL}/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList/"
DETAIL_ENDPOINT = f"{BASE_URL}/api-pub/DirectAcquisition/GetDirectAcquisitionView"

# Kulcsszavak kereséshez (kis/nagybetű mindegy)
KEYWORDS = [
    "rsv",
    "renns", 
    "gis",
    "cartografiere",
    "ortofotoplan",
    "harta"
]

# Fájl beállítások
OUTPUT_FILE = "seap_results.csv"
LOG_FILE = "seap_scraper.log"

# Állapot ID (7 = publikus/lezárt beszerzések)
ACQUISITION_STATE_ID = 7

# ============================================================================
# LOGGING BEÁLLÍTÁS
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# FŐ FUNKCIÓK
# ============================================================================

def get_direct_acquisitions(date_start: str, date_end: str, page_index: int = 0, page_size: int = 100) -> Optional[Dict]:
    """
    Lekéri a direkt beszerzések listáját az API-ból.
    
    Args:
        date_start: Kezdő dátum (YYYY-MM-DD formátum)
        date_end: Záró dátum (YYYY-MM-DD formátum)
        page_index: Oldal index (0-tól kezdődik)
        page_size: Találatok száma oldalanként
    
    Returns:
        API válasz dict formában, vagy None hiba esetén
    """
    payload = {
        "sysDirectAcquisitionStateId": ACQUISITION_STATE_ID,
        "publicationDateStart": date_start,
        "publicationDateEnd": date_end,
        "pageSize": page_size,
        "pageIndex": page_index
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "SEAP-Scraper/1.0"
    }
    
    try:
        logger.info(f"API hívás: {date_start} - {date_end}, oldal: {page_index}")
        response = requests.post(LIST_ENDPOINT, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Hiba a lista lekérésekor: {e}")
        return None


def get_acquisition_details(acquisition_id: int) -> Optional[Dict]:
    """
    Lekéri egy beszerzés részletes adatait.
    
    Args:
        acquisition_id: A beszerzés azonosítója
    
    Returns:
        Részletes adatok dict formában, vagy None hiba esetén
    """
    url = f"{DETAIL_ENDPOINT}/{acquisition_id}"
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "SEAP-Scraper/1.0"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Hiba a részletek lekérésekor (ID: {acquisition_id}): {e}")
        return None


def find_matching_keyword(text: str) -> Optional[str]:
    """
    Megkeresi, hogy a szövegben szerepel-e valamelyik kulcsszó.
    
    Args:
        text: A vizsgálandó szöveg
    
    Returns:
        Az első találat kulcsszó, vagy None ha nincs találat
    """
    if not text:
        return None
    
    text_lower = text.lower()
    for keyword in KEYWORDS:
        if keyword.lower() in text_lower:
            return keyword
    return None


def check_acquisition_matches(acquisition: Dict) -> Optional[str]:
    """
    Ellenőrzi, hogy a beszerzés megfelel-e a szűrési feltételeknek.
    
    Args:
        acquisition: A beszerzés adatai
    
    Returns:
        A megfelelő kulcsszó, vagy None ha nem felel meg
    """
    # Ellenőrzés a tárgyban (directAcquisitionName)
    name = acquisition.get("directAcquisitionName", "")
    keyword = find_matching_keyword(name)
    if keyword:
        return keyword
    
    # Ellenőrzés a leírásban (directAcquisitionDescription) - ha van
    description = acquisition.get("directAcquisitionDescription", "")
    keyword = find_matching_keyword(description)
    if keyword:
        return keyword
    
    return None


def load_existing_ids() -> set:
    """
    Betölti a már mentett beszerzések azonosítóit a duplikáció elkerülésére.
    
    Returns:
        Set a meglévő publicNoticeNo értékekkel
    """
    existing_ids = set()
    
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f, delimiter=';')
                for row in reader:
                    if 'publicNoticeNo' in row:
                        existing_ids.add(row['publicNoticeNo'])
            logger.info(f"Betöltve {len(existing_ids)} meglévő rekord")
        except Exception as e:
            logger.warning(f"Nem sikerült a meglévő fájl betöltése: {e}")
    
    return existing_ids


def save_to_csv(acquisitions: List[Dict], existing_ids: set):
    """
    Elmenti a találatokat CSV fájlba.
    
    Args:
        acquisitions: A mentendő beszerzések listája
        existing_ids: A már meglévő azonosítók (duplikáció elkerülésére)
    """
    # Fejléc mezők
    fieldnames = [
        'publicNoticeNo',
        'publicationDate',
        'contractingAuthorityName',
        'cpvCode',
        'directAcquisitionName',
        'closingValue',
        'sysAcquisitionContractType',
        'matchedKeyword',
        'link'
    ]
    
    # Ellenőrizzük, hogy létezik-e már a fájl
    file_exists = os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 0
    
    new_count = 0
    
    with open(OUTPUT_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
        
        # Fejléc írása, ha új fájl
        if not file_exists:
            writer.writeheader()
        
        for acq in acquisitions:
            notice_no = str(acq.get('publicNoticeNo', ''))
            
            # Duplikáció ellenőrzés
            if notice_no in existing_ids:
                logger.debug(f"Duplikált rekord kihagyva: {notice_no}")
                continue
            
            # Új rekord mentése
            row = {
                'publicNoticeNo': notice_no,
                'publicationDate': acq.get('publicationDate', ''),
                'contractingAuthorityName': acq.get('contractingAuthorityName', ''),
                'cpvCode': acq.get('cpvCode', ''),
                'directAcquisitionName': acq.get('directAcquisitionName', ''),
                'closingValue': acq.get('closingValue', ''),
                'sysAcquisitionContractType': acq.get('sysAcquisitionContractType', ''),
                'matchedKeyword': acq.get('matchedKeyword', ''),
                'link': f"https://e-licitatie.ro/pub/direct-acquisition/view/{acq.get('directAcquisitionId', '')}"
            }
            
            writer.writerow(row)
            existing_ids.add(notice_no)
            new_count += 1
    
    logger.info(f"Mentve {new_count} új rekord")
    return new_count


def scrape_day(target_date: str) -> List[Dict]:
    """
    Lekéri és szűri egy adott nap beszerzéseit.
    
    Args:
        target_date: A cél dátum (YYYY-MM-DD formátum)
    
    Returns:
        A szűrt beszerzések listája
    """
    matching_acquisitions = []
    page_index = 0
    total_items = None
    
    logger.info(f"=== Feldolgozás: {target_date} ===")
    
    while True:
        # Lista lekérése
        response = get_direct_acquisitions(target_date, target_date, page_index)
        
        if not response:
            logger.error("Nem sikerült az API válasz lekérése")
            break
        
        # Válasz feldolgozása
        items = response.get("items", [])
        
        if total_items is None:
            total_items = response.get("total", 0)
            logger.info(f"Összesen {total_items} beszerzés találva")
        
        if not items:
            break
        
        # Minden elem ellenőrzése
        for item in items:
            keyword = check_acquisition_matches(item)
            if keyword:
                item['matchedKeyword'] = keyword
                matching_acquisitions.append(item)
                logger.info(f"Találat: {item.get('directAcquisitionName', '')[:50]}... (kulcsszó: {keyword})")
        
        # Következő oldal
        page_index += 1
        
        # Ha nincs több oldal
        if len(items) < 100:
            break
    
    logger.info(f"Összesen {len(matching_acquisitions)} megfelelő beszerzés")
    return matching_acquisitions


def main():
    """
    Fő futási pont.
    """
    logger.info("=" * 60)
    logger.info("SEAP/SICAP Direkt Beszerzések Gyűjtő indítása")
    logger.info("=" * 60)
    
    # Mai dátum
    today = datetime.now().strftime("%Y-%m-%d")
    logger.info(f"Cél dátum: {today}")
    logger.info(f"Kulcsszavak: {', '.join(KEYWORDS)}")
    
    # Meglévő rekordok betöltése
    existing_ids = load_existing_ids()
    
    # Aznapi beszerzések lekérése és szűrése
    matching = scrape_day(today)
    
    # Mentés CSV-be
    if matching:
        new_count = save_to_csv(matching, existing_ids)
        logger.info(f"Kész! {new_count} új rekord mentve: {OUTPUT_FILE}")
    else:
        logger.info("Nem találtunk új megfelelő beszerzéseket")
    
    logger.info("=" * 60)
    logger.info("Futás befejezve")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
