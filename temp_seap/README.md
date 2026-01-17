# SEAP/SICAP Direkt Beszerzések Gyűjtő

Automatikusan gyűjti a román e-licitatie.ro rendszerből a direkt beszerzéseket és szűri azokat megadott kulcsszavak alapján.

## Telepítés

```bash
pip install -r requirements.txt
```

## Használat

```bash
python main.py
```

A script automatikusan az **aznapi** beszerzéseket kérdezi le.

## Szűrési Kulcsszavak

A script a következő kulcsszavakat keresi a beszerzés tárgyában és leírásában:
- `rsv`
- `renns`
- `gis`
- `cartografiere`
- `ortofotoplan`
- `harta`

## Kimenet

- **seap_results.csv** - Találatok (UTF-8, pontosvesszővel elválasztva)
- **seap_scraper.log** - Futási napló

### CSV mezők:
| Mező | Leírás |
|------|--------|
| publicNoticeNo | Beszerzés azonosító |
| publicationDate | Közzététel dátuma |
| contractingAuthorityName | Megrendelő intézmény |
| cpvCode | CPV kód |
| directAcquisitionName | Beszerzés tárgya |
| closingValue | Érték |
| sysAcquisitionContractType | Típus |
| matchedKeyword | Melyik kulcsszó miatt került be |
| link | Link az eredeti oldalra |

## API végpontok

- Lista: `POST https://e-licitatie.ro/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList/`
- Részletek: `GET https://e-licitatie.ro/api-pub/DirectAcquisition/GetDirectAcquisitionView/{id}`

## Ütemezés (Replit)

A Replit-en használhatsz cron job-ot vagy az "Always On" funkciót a napi futtatáshoz.
