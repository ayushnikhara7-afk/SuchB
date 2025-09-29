# Vercel + Render Deployment Guide

## Frontend (Vercel) Environment Variables

### Required Environment Variables in Vercel Dashboard:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings > Environment Variables**
3. **Add these variables:**

```bash
# API Backend URL (REQUIRED)
VITE_API_URL=https://your-backend-app-name.onrender.com/api

# Optional: Debug mode
VITE_DEBUG=false
```

### How to Set Environment Variables in Vercel:

1. **Login to Vercel Dashboard**
2. **Select your frontend project**
3. **Go to Settings tab**
4. **Click on "Environment Variables"**
5. **Add each variable:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-app-name.onrender.com/api`
   - **Environment**: Production, Preview, Development (select all)
6. **Click "Save"**

## Backend (Render) Environment Variables

### Required Environment Variables in Render Dashboard:

1. **Go to your Render dashboard**
2. **Select your backend service**
3. **Go to Environment tab**
4. **Add these variables:**

```bash
# Server Configuration
NODE_ENV=production
PORT=10000

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-app-name.vercel.app

# Email Service (Optional)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=your-verified-email@domain.com

# Payment Configuration (Optional)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# SMS Service (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### How to Set Environment Variables in Render:

1. **Login to Render Dashboard**
2. **Select your backend service**
3. **Go to Environment tab**
4. **Add each variable:**
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - **Click "Save Changes"**
5. **Repeat for all variables**

## Important Notes:

### Render Backend Configuration:
- **Port**: Render automatically assigns a port via `PORT` environment variable
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: Set to 18.x or 20.x in Render settings

### Vercel Frontend Configuration:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x (automatic)

## Testing Your Setup:

### 1. Test Backend:
```bash
# Test these URLs in your browser:
https://your-backend-app-name.onrender.com/
https://your-backend-app-name.onrender.com/api/health
https://your-backend-app-name.onrender.com/api/test
```

### 2. Test Frontend:
```bash
# Test these URLs:
https://your-frontend-app-name.vercel.app/
https://your-frontend-app-name.vercel.app/live-classes
https://your-frontend-app-name.vercel.app/dashboard
```

### 3. Test API Connection:
- Open browser console on your frontend
- Look for: `API Base URL: https://your-backend-app-name.onrender.com/api`
- If you see `http://localhost:3001/api`, the environment variable is not set correctly

## Common Issues & Solutions:

### Issue: Frontend shows localhost API URL
**Solution**: Set `VITE_API_URL` in Vercel environment variables

### Issue: CORS errors
**Solution**: Set `FRONTEND_URL` in Render environment variables

### Issue: Database connection failed
**Solution**: Verify `MONGODB_URI` is correct in Render

### Issue: 404 on page refresh
**Solution**: The `vercel.json` file should fix this

## Deployment Order:

1. **Deploy Backend to Render first**
2. **Get the Render URL**
3. **Set `VITE_API_URL` in Vercel**
4. **Deploy Frontend to Vercel**
5. **Set `FRONTEND_URL` in Render**
6. **Test both applications**

## Security Notes:

- Never commit `.env` files to git
- Use strong, unique JWT secrets
- Restrict CORS to your frontend domain only
- Use HTTPS for all communications
