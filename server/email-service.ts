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
const SMTP_SERVER = process.env.SMTP_SERVER || 'smtp.office365.com';
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

export async function sendNotificationEmail(tenders: TenderNotification[], totalScanned: number = 0): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('Notificări email dezactivate');
    return false;
  }

  if (!EMAIL_SENDER || !EMAIL_PASSWORD || !EMAIL_RECIPIENT) {
    console.log('Configurare email incompletă - verifică variabilele de mediu');
    return false;
  }

  const now = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const today = new Date().toISOString().split('T')[0];
  const hasResults = tenders.length > 0;

  // Different content based on whether we found results or not
  const subject = hasResults
    ? `🎯 SEAP Alert: ${tenders.length} achiziții noi găsite!`
    : `📊 SEAP Raport Zilnic: 0 achiziții găsite pentru ${today}`;

  let htmlContent: string;
  let textContent: string;

  if (hasResults) {
    htmlContent = `
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
          <p>Total scanate: ${totalScanned} achiziții</p>
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
        </div>
      </body>
      </html>
    `;

    textContent = `
SEAP Monitor - Achiziții Noi Găsite!
====================================

S-au găsit ${tenders.length} achiziții noi!
Data: ${now}
Total scanate: ${totalScanned}

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
  } else {
    // No results - send status report
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; text-align: center; }
          .stats { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 SEAP Monitor - Raport Zilnic</h1>
          <p>Scanare completă pentru ${today}</p>
        </div>
        <div class="content">
          <div class="stats">
            <h2>Rezultate scanare:</h2>
            <p><strong>Total achiziții scanate:</strong> ${totalScanned}</p>
            <p><strong>Potriviri găsite:</strong> 0</p>
            <p><strong>Cuvinte cheie monitorizate:</strong> 35</p>
          </div>
          <p>Nu s-au găsit achiziții noi care să corespundă criteriilor de căutare.</p>
          <p>Monitorizarea continuă automat mâine.</p>
        </div>
        <div class="footer">
          <p>Acest email a fost trimis automat de SEAP Monitor.</p>
        </div>
      </body>
      </html>
    `;

    textContent = `
SEAP Monitor - Raport Zilnic
============================

Data: ${now}
Scanare pentru: ${today}

Rezultate:
- Total achiziții scanate: ${totalScanned}
- Potriviri găsite: 0
- Cuvinte cheie monitorizate: 35

Nu s-au găsit achiziții noi care să corespundă criteriilor de căutare.
Monitorizarea continuă automat mâine.

---
Acest email a fost trimis automat de SEAP Monitor.
    `;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_SENDER,
      to: EMAIL_RECIPIENT,
      subject: subject,
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
