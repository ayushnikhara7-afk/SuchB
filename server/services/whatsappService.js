const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.client = null;
    // Twilio sandbox/approved WhatsApp sender number, e.g. 'whatsapp:+14155238886'
    this.fromWhatsApp = this.normalizeFrom(process.env.TWILIO_WHATSAPP_FROM);

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('Twilio WhatsApp service initialized');
    }
  }

  async sendOTP(phone, otp, purpose) {
    const message = this.getOTPMessage(otp, purpose);
    const toWhatsApp = this.normalizeWhatsAppNumber(phone);

    if (!this.client || !this.fromWhatsApp) {
      return { success: false, error: 'Twilio WhatsApp is not configured' };
    }
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromWhatsApp,
        to: toWhatsApp
      });
      console.log(`WhatsApp sent via Twilio to ${toWhatsApp}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error);
      return { success: false, error: error.message };
    }
  }

  getOTPMessage(otp, purpose) {
    const actionText = purpose === 'signup' ? 'complete your registration' : 
                     purpose === 'signin' ? 'sign in to your account' : 
                     'reset your password';
    return `Your SuchBliss verification code is: ${otp}\n\nUse this code to ${actionText}.\n\nCode expires in 10 minutes.\n\nNever share this code with anyone.\n\n- SuchBliss Team`;
  }

  async sendWelcomeMessage(phone, name) {
    const message = `Welcome to SuchBliss, ${name}! 🧘‍♀️\n\nWe're thrilled to have you join our yoga community. Start your journey to inner peace and wellness today.\n\nVisit our app to explore classes, meditation sessions, and wellness programs.\n\nNamaste! 🙏\n\n- SuchBliss Team`;
    const toWhatsApp = this.normalizeWhatsAppNumber(phone);

    if (!this.client || !this.fromWhatsApp) {
      return { success: false, error: 'Twilio WhatsApp is not configured' };
    }
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromWhatsApp,
        to: toWhatsApp
      });
      console.log(`Welcome WhatsApp sent via Twilio to ${toWhatsApp}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('Twilio WhatsApp welcome message error:', error);
      return { success: false, error: error.message };
    }
  }

  normalizeWhatsAppNumber(phone) {
    const cleaned = (phone || '').toString().replace(/\s+/g, '');
    if (cleaned.startsWith('whatsapp:')) return cleaned;
    if (cleaned.startsWith('+')) return `whatsapp:${cleaned}`;
    // default to Indian country code like existing logic
    const normalized = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
    return `whatsapp:${normalized}`;
  }

  normalizeFrom(from) {
    if (!from) return from;
    const trimmed = from.toString().trim();
    if (trimmed.startsWith('whatsapp:')) return trimmed;
    if (trimmed.startsWith('+')) return `whatsapp:${trimmed}`;
    // allow raw digits assumed to be E.164 without plus
    if (/^\d+$/.test(trimmed)) return `whatsapp:+${trimmed}`;
    return trimmed;
  }
}

module.exports = new WhatsAppService();


