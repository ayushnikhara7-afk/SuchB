
const twilio = require('twilio');

class SMSService {
  constructor() {
    // Initialize Twilio client
    this.client = null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('Twilio SMS service initialized');
    }
  }

  async sendOTP(phone, otp, purpose) {
    const message = this.getOTPMessage(otp, purpose);
    
    if (!this.client || !this.fromNumber) {
      return { success: false, error: 'Twilio SMS is not configured' };
    }
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phone
      });
      
      console.log(`SMS sent via Twilio to ${phone}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  getOTPMessage(otp, purpose) {
    const actionText = purpose === 'signup' ? 'complete your registration' : 
                     purpose === 'signin' ? 'sign in to your account' : 
                     'reset your password';
    return `Your SuchBliss verification code is: ${otp}\n\nUse this code to ${actionText}.\n\nCode expires in 10 minutes.\n\nNever share this code with anyone.\n\n- SuchBliss Team`;
  }

  async sendWelcomeSMS(phone, name) {
    const message = `Welcome to SuchBliss, ${name}! 🧘‍♀️\n\nYour account is ready. Start your yoga journey with our expert guru.\n\nDownload our app or visit our website to begin.\n\n- SuchBliss Team`;
    
    if (!this.client || !this.fromNumber) {
      return { success: false, error: 'Twilio SMS is not configured' };
    }
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phone
      });
      
      console.log(`Welcome SMS sent via Twilio to ${phone}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (error) {
      console.error('Twilio Welcome SMS error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SMSService();