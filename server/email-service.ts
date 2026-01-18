// Modern email service using Resend API (no SMTP needed!)
// https://resend.com - 100 emails/day free

interface TenderNotification {
  title: string;
  authority: string;
  value: string;
  matchedKeyword: string;
  link: string;
}

// Configuration from environment variables
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT || '';

export async function sendNotificationEmail(tenders: TenderNotification[], totalScanned: number = 0): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('Notificări email dezactivate');
    return false;
  }

  if (!RESEND_API_KEY || !EMAIL_RECIPIENT) {
    console.log('Configurare email incompletă - verifică RESEND_API_KEY și EMAIL_RECIPIENT');
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

  const subject = hasResults
    ? `🎯 SEAP Alert: ${tenders.length} achiziții noi găsite!`
    : `📊 SEAP Raport Zilnic: 0 achiziții găsite pentru ${today}`;

  let htmlContent: string;

  if (hasResults) {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
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
  } else {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
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
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SEAP Monitor <onboarding@resend.dev>',
        to: EMAIL_RECIPIENT,
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    console.log(`Email trimis cu succes către ${EMAIL_RECIPIENT}`);
    return true;
  } catch (error) {
    console.error('Eroare la trimiterea email-ului:', error);
    return false;
  }
}
