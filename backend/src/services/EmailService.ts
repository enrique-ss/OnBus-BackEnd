export class EmailService {
  static async send(to: string, subject: string, text: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) throw new Error('Envio de email não configurado (RESEND_API_KEY e EMAIL_FROM).');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!response.ok) throw new Error(`Falha no provedor de email (${response.status}).`);
  }
}
