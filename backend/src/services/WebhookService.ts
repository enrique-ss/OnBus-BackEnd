import * as crypto from 'crypto';

export class WebhookService {
  /**
   * Gera assinatura HMAC SHA-256 baseada no payload e no segredo configurado.
   */
  static generateSignature(payload: any, secret: string): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verifica se a assinatura fornecida coincide de forma segura com o hash gerado.
   */
  static verifySignature(payload: any, signature: string, secret: string): boolean {
    if (!signature) return false;
    const calculated = this.generateSignature(payload, secret);
    
    // timingSafeEqual exige buffers de mesmo comprimento
    if (calculated.length !== signature.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(calculated, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  }
}
