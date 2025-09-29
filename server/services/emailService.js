const { Resend } = require('resend');

class EmailService {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not found in environment variables');
      this.resend = null;
    } else {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }

  async sendOTP(email, otp, purpose) {
    if (!this.resend) {
      console.error('Resend not initialized - missing API key');
      return { success: false, error: 'Email service not configured' };
    }

    const subject = this.getSubject(purpose);
    const html = this.getOTPTemplate(email, otp, purpose);

    try {
      const { data, error } = await this.resend.emails.send({
        from: `SuchBliss <${this.fromEmail}>`,
        to: [email],
        subject,
        html,
      });

      if (error) {
        console.error('Resend email error:', error);
        return { success: false, error: error.message };
      }

      console.log('OTP email sent via Resend:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  getSubject(purpose) {
    switch (purpose) {
      case 'signup':
        return 'Complete Your SuchBliss Registration - Verification Code Inside';
      case 'signin':
        return 'Your SuchBliss Login Code - Secure Access';
      case 'password_reset':
        return 'Reset Your SuchBliss Password - Verification Required';
      default:
        return 'Your SuchBliss Verification Code';
    }
  }

  getOTPTemplate(email, otp, purpose) {
    const actionText = purpose === 'signup' ? 'complete your registration' : 
                     purpose === 'signin' ? 'sign in to your account' : 
                     'reset your password';

    const actionColor = purpose === 'signup' ? '#10B981' : 
                       purpose === 'signin' ? '#2563EB' : 
                       '#F59E0B';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SuchBliss Verification Code</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #EA580C 100%); padding: 40px 20px; text-align: center; position: relative;">
            <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 8px; padding: 20px; display: inline-block;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">🧘‍♀️ SuchBliss</h1>
              <p style="color: #E0E7FF; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">Your Yoga Learning Platform</p>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1F2937; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">Verification Code</h2>
              <p style="color: #6B7280; margin: 0; font-size: 16px;">
                Use this code to ${actionText}
              </p>
            </div>
            
            <!-- OTP Code Box -->
            <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border: 3px solid ${actionColor}; border-radius: 16px; padding: 40px 20px; text-align: center; margin: 30px 0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, ${actionColor}08 0%, transparent 70%); pointer-events: none;"></div>
              <div style="position: relative; z-index: 1;">
                <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div style="font-size: 42px; font-weight: 700; color: ${actionColor}; letter-spacing: 12px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${otp}
                </div>
                <p style="color: #6B7280; margin: 15px 0 0 0; font-size: 12px;">
                  Valid for 10 minutes only
                </p>
              </div>
            </div>
            
            <!-- Instructions -->
            <div style="background-color: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="color: #0C4A6E; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                📱 How to use this code:
              </h3>
              <ol style="color: #075985; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Return to the SuchBliss app or website</li>
                <li>Enter this 6-digit code in the verification field</li>
                <li>Complete your ${purpose === 'signup' ? 'registration' : purpose === 'signin' ? 'login' : 'password reset'}</li>
              </ol>
            </div>
            
            <!-- Security Warning -->
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 25px 0; border-radius: 8px;">
              <h3 style="color: #92400E; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                🔒 Security Notice:
              </h3>
              <ul style="color: #B45309; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                <li>Never share this code with anyone</li>
                <li>SuchBliss will never ask for your verification code</li>
                <li>This code expires in 10 minutes for your security</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="display: inline-block; background: linear-gradient(135deg, ${actionColor} 0%, ${actionColor}dd 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px ${actionColor}40; transition: all 0.3s ease;">
                Continue to SuchBliss →
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F9FAFB; padding: 30px 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Need Help?</h3>
              <p style="color: #6B7280; margin: 0; font-size: 14px;">
                Contact our support team at 
                <a href="mailto:support@suchbliss.com" style="color: #2563EB; text-decoration: none; font-weight: 500;">support@suchbliss.com</a>
                or call <a href="tel:+919863779900" style="color: #2563EB; text-decoration: none; font-weight: 500;">+91 98637 79900</a>
              </p>
            </div>
            
            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
              <p style="color: #9CA3AF; margin: 0; font-size: 12px;">
                © 2025 SuchBliss. All rights reserved.<br>
                This email was sent to ${email} because you requested a verification code.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendWelcomeEmail(email, name) {
    if (!this.resend) {
      console.error('Resend not initialized - missing API key');
      return { success: false, error: 'Email service not configured' };
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SuchBliss</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🎉 Welcome to SuchBliss!</h1>
            <p style="color: #D1FAE5; margin: 10px 0 0 0; font-size: 18px; font-weight: 500;">Your yoga journey begins now</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 28px; font-weight: 600;">Namaste ${name}! 🙏</h2>
            
            <p style="color: #4B5563; margin: 0 0 25px 0; font-size: 18px; line-height: 1.6;">
              Welcome to SuchBliss! Your account has been successfully created. You're now part of our growing community of yoga practitioners.
            </p>
            
            <!-- Features Grid -->
            <div style="margin: 30px 0;">
              <div style="display: inline-block; background: #F0F9FF; padding: 20px; border-radius: 12px; margin: 10px; width: 140px; vertical-align: top;">
                <div style="font-size: 24px; margin-bottom: 8px;">🧘‍♀️</div>
                <div style="color: #0C4A6E; font-weight: 600; font-size: 14px;">Live Classes</div>
                <div style="color: #075985; font-size: 12px;">Interactive sessions</div>
              </div>
              
              <div style="display: inline-block; background: #F0FDF4; padding: 20px; border-radius: 12px; margin: 10px; width: 140px; vertical-align: top;">
                <div style="font-size: 24px; margin-bottom: 8px;">🏆</div>
                <div style="color: #14532D; font-weight: 600; font-size: 14px;">Certifications</div>
                <div style="color: #166534; font-size: 12px;">Recognized credentials</div>
              </div>
              
              <div style="display: inline-block; background: #FEF3C7; padding: 20px; border-radius: 12px; margin: 10px; width: 140px; vertical-align: top;">
                <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                <div style="color: #92400E; font-weight: 600; font-size: 14px;">Community</div>
                <div style="color: #B45309; font-size: 12px;">Connect & grow</div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="margin: 35px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); transition: all 0.3s ease;">
                Start Your Yoga Journey 🚀
              </a>
            </div>
            
            <!-- Next Steps -->
            <div style="background: #F8FAFC; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: left;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; text-align: center;">
                🎯 What's Next?
              </h3>
              <ol style="color: #4B5563; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                <li><strong>Explore Plans:</strong> Choose the perfect plan for your yoga journey</li>
                <li><strong>Join Live Classes:</strong> Participate in interactive sessions with expert guru</li>
                <li><strong>Earn Rewards:</strong> Refer friends and earn ₹500 for each successful signup</li>
                <li><strong>Track Progress:</strong> Monitor your learning journey and achievements</li>
              </ol>
            </div>
            
            <!-- Referral Code -->
            <div style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); border-radius: 12px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #5B21B6; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                💰 Start Earning Today!
              </h3>
              <p style="color: #7C3AED; margin: 0; font-size: 14px;">
                Share your referral code with friends and earn ₹500 for each successful signup!
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #F9FAFB; padding: 30px 20px; text-align: center; border-top: 1px solid #E5E7EB;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">📞 Need Support?</h3>
              <p style="color: #6B7280; margin: 0; font-size: 14px;">
                Email: <a href="mailto:support@suchbliss.com" style="color: #2563EB; text-decoration: none; font-weight: 500;">support@suchbliss.com</a><br>
                Phone: <a href="tel:+919863779900" style="color: #2563EB; text-decoration: none; font-weight: 500;">+91 98637 79900</a><br>
                WhatsApp: <a href="https://wa.me/919863779900" style="color: #10B981; text-decoration: none; font-weight: 500;">Chat with us</a>
              </p>
            </div>
            
            <div style="border-top: 1px solid #E5E7EB; padding-top: 20px;">
              <p style="color: #9CA3AF; margin: 0; font-size: 12px; line-height: 1.5;">
                © 2025 SuchBliss. All rights reserved.<br>
                123 Yoga Ashram, Spiritual Valley, Rishikesh, Uttarakhand 249201, India<br>
                You received this email because you created an account with us.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `SuchBliss Team <${this.fromEmail}>`,
        to: [email],
        subject: '🎉 Welcome to SuchBliss - Your Yoga Journey Begins!',
        html,
      });

      if (error) {
        console.error('Welcome email error:', error);
        return { success: false, error: error.message };
      }

      console.log('Welcome email sent via Resend:', data.id);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(email, name, orderDetails) {
    if (!this.resend) {
      console.error('Resend not initialized - missing API key');
      return { success: false, error: 'Email service not configured' };
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - SuchBliss</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', Arial, sans-serif; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">✅ Order Confirmed!</h1>
            <p style="color: #D1FAE5; margin: 10px 0 0 0; font-size: 16px;">Thank you for choosing SuchBliss</p>
          </div>
          
          <!-- Order Details -->
          <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${name}!</h2>
            <p style="color: #4B5563; margin: 0 0 30px 0; font-size: 16px;">
              Your order has been confirmed and your yoga plan is now active.
            </p>
            
            <!-- Order Summary -->
            <div style="background: #F8FAFC; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: left;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; text-align: center;">
                📋 Order Summary
              </h3>
              <div style="border-bottom: 1px solid #E5E7EB; padding-bottom: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #6B7280; font-size: 14px;">Order ID:</span>
                  <span style="color: #1F2937; font-weight: 600; font-size: 14px;">${orderDetails.orderId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="color: #6B7280; font-size: 14px;">Plan:</span>
                  <span style="color: #1F2937; font-weight: 600; font-size: 14px;">${orderDetails.planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #6B7280; font-size: 14px;">Amount:</span>
                  <span style="color: #10B981; font-weight: 700; font-size: 16px;">₹${orderDetails.amount}</span>
                </div>
              </div>
              <div style="text-align: center;">
                <span style="background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                  PAYMENT SUCCESSFUL
                </span>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="display: inline-block; background: #10B981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 20px 0;">
              Access Your Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from: `SuchBliss <${this.fromEmail}>`,
        to: [email],
        subject: '✅ Order Confirmed - Welcome to SuchBliss!',
        html,
      });

      if (error) {
        console.error('Order confirmation email error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Order confirmation email error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();