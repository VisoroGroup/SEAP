import nodemailer from 'nodemailer';

interface TenderNotification {
    title: string;
    authority: string;
    value: string;
    matchedKeyword: string;
    link: string;
}

// Email configuration from environment variables
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const SMTP_SERVER = process.env.SMTP_SERVER || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const EMAIL_SENDER = process.env.EMAIL_SENDER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT || '';

const transporter = nodemailer.createTransport({
    host: SMTP_SERVER,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_PASSWORD,
    },
});

export async function sendNotificationEmail(tenders: TenderNotification[]): Promise<boolean> {
    if (!EMAIL_ENABLED) {
        console.log('Notificări email dezactivate');
        return false;
    }

    if (!EMAIL_SENDER || !EMAIL_PASSWORD || !EMAIL_RECIPIENT) {
        console.log('Configurare email incompletă - verifică variabilele de mediu');
        return false;
    }

    if (tenders.length === 0) {
        console.log('Nu există achiziții noi de notificat');
        return false;
    }

    const now = new Date().toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f3f4f6; text-align: left; padding: 12px; border: 1px solid #ddd; }
        td { padding: 12px; border: 1px solid #ddd; }
        .keyword { color: #059669; font-weight: bold; }
        .value { color: #2563eb; font-weight: bold; }
        .link { color: #2563eb; text-decoration: none; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 SEAP Monitor - Achiziții Noi Găsite!</h1>
        <p>${tenders.length} achiziții directe corespunzătoare criteriilor</p>
      </div>
      <div class="content">
        <p>Data raport: ${now}</p>
        <table>
          <tr>
            <th>Denumire</th>
            <th>Autoritate Contractantă</th>
            <th>Valoare</th>
            <th>Cuvânt Cheie</th>
            <th>Link</th>
          </tr>
          ${tenders.map(t => `
            <tr>
              <td>${t.title.substring(0, 80)}${t.title.length > 80 ? '...' : ''}</td>
              <td>${t.authority}</td>
              <td class="value">${t.value} RON</td>
              <td class="keyword">${t.matchedKeyword}</td>
              <td><a href="${t.link}" class="link">Vezi detalii</a></td>
            </tr>
          `).join('')}
        </table>
      </div>
      <div class="footer">
        <p>Acest email a fost trimis automat de SEAP Monitor.</p>
        <p>Pentru a dezactiva notificările, setează EMAIL_ENABLED=false în configurare.</p>
      </div>
    </body>
    </html>
  `;

    const textContent = `
SEAP Monitor - Achiziții Noi Găsite!
====================================

S-au găsit ${tenders.length} achiziții noi!
Data: ${now}

${tenders.map(t => `
• ${t.title}
  Autoritate: ${t.authority}
  Valoare: ${t.value} RON
  Cuvânt cheie: ${t.matchedKeyword}
  Link: ${t.link}
`).join('\n')}

---
Acest email a fost trimis automat de SEAP Monitor.
  `;

    try {
        await transporter.sendMail({
            from: EMAIL_SENDER,
            to: EMAIL_RECIPIENT,
            subject: `🎯 SEAP Alert: ${tenders.length} achiziții noi găsite!`,
            text: textContent,
            html: htmlContent,
        });

        console.log(`Email trimis cu succes către ${EMAIL_RECIPIENT}`);
        return true;
    } catch (error) {
        console.error('Eroare la trimiterea email-ului:', error);
        return false;
    }
}
