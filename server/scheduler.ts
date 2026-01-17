import { scraper } from "./seap-scraper";
import { storage } from "./storage";
import { sendNotificationEmail } from "./email-service";

// Scheduled job to run daily at 8:00 AM
let scheduledJobTimer: NodeJS.Timeout | null = null;

export function startScheduler() {
    console.log("🕐 Scheduler pornit - verificare zilnică la 08:00");

    // Calculate time until next 8:00 AM
    const now = new Date();
    const next8AM = new Date();
    next8AM.setHours(8, 0, 0, 0);

    if (now > next8AM) {
        // If it's past 8 AM today, schedule for tomorrow
        next8AM.setDate(next8AM.getDate() + 1);
    }

    const msUntilNext8AM = next8AM.getTime() - now.getTime();
    console.log(`Următoarea rulare: ${next8AM.toLocaleString('ro-RO')}`);

    // Schedule first run
    setTimeout(() => {
        runDailyScrape();
        // Then run every 24 hours
        scheduledJobTimer = setInterval(runDailyScrape, 24 * 60 * 60 * 1000);
    }, msUntilNext8AM);
}

export function stopScheduler() {
    if (scheduledJobTimer) {
        clearInterval(scheduledJobTimer);
        scheduledJobTimer = null;
        console.log("Scheduler oprit");
    }
}

export async function runDailyScrape() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Scraping zilnic: ${today}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        const results = await scraper.scrapeDay(today);

        if (results.length === 0) {
            console.log("Nu s-au găsit achiziții noi corespunzătoare criteriilor");
            return { saved: 0, emailSent: false };
        }

        // Save to database
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

        console.log(`✅ S-au salvat ${saved.length} achiziții noi`);

        // Send email notification
        const emailSent = await sendNotificationEmail(
            saved.map(t => ({
                title: t.title,
                authority: t.authority,
                value: t.value,
                matchedKeyword: t.matchedKeyword || '',
                link: t.link || ''
            }))
        );

        console.log(`📧 Email trimis: ${emailSent ? 'Da' : 'Nu'}`);

        return { saved: saved.length, emailSent };
    } catch (error) {
        console.error("Eroare la scraping-ul zilnic:", error);
        return { saved: 0, emailSent: false };
    }
}
