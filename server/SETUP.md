# Server Setup Guide

## Environment Configuration

1. **Copy the environment example file:**
   ```bash
   cp env.example .env
   ```

2. **Update the `.env` file with your actual values:**

   ### Required Configuration:
   
   **Database (MongoDB):**
   - `MONGODB_URI`: Your MongoDB connection string
   - Example: `mongodb://localhost:27017/suchbliss`
   
   **JWT Secret:**
   - `JWT_SECRET`: A secure random string for JWT token signing
   - Generate one using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   
   **Resend Email Service:**
   - `RESEND_API_KEY`: Get from [Resend Dashboard](https://resend.com/api-keys)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - `RESEND_FROM_EMAIL`: Your verified domain email (or use `onboarding@resend.dev` for testing)

### Optional Configuration:
- `FRONTEND_URL`: Your frontend URL (default: `http://localhost:5173`)
- `PORT`: Server port (default: `3001`)
- `OTP_EXPIRY_MINUTES`: OTP expiration time (default: `10`)

## Getting Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `re_`)
5. Add it to your `.env` file

## Running the Server

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

## Testing Email Service

Once configured, the email service will automatically use the Authorization header with your Resend API key. The Resend client handles this internally when you initialize it with your API key.

## Troubleshooting

- **"API key is invalid"**: Check that your `RESEND_API_KEY` is correct and starts with `re_`
- **"Email service not configured"**: Ensure `RESEND_API_KEY` is set in your `.env` file
- **Database connection issues**: Verify your `MONGODB_URI` is correct and MongoDB is running
