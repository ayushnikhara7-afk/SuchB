# Render Backend Configuration

## Render Service Settings:

### Build & Deploy:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: 18.x or 20.x

### Environment Variables:
Set these in Render dashboard under Environment tab:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secure-jwt-secret-key
FRONTEND_URL=https://your-frontend-app-name.vercel.app
RESEND_API_KEY=your-resend-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Health Check:
- **Health Check Path**: `/api/health`
- **Health Check Timeout**: 30 seconds

### Auto-Deploy:
- **Branch**: `main` (or your main branch)
- **Auto-Deploy**: Enabled

## Important Render Notes:

1. **Port Configuration**: Render automatically sets the PORT environment variable
2. **HTTPS**: Render provides HTTPS by default
3. **Sleep Mode**: Free tier sleeps after 15 minutes of inactivity
4. **Cold Start**: First request after sleep may take 30+ seconds
5. **Logs**: Check Render logs for deployment issues

## Testing Render Backend:

After deployment, test these endpoints:
- `https://your-app-name.onrender.com/` (root)
- `https://your-app-name.onrender.com/api/health` (health check)
- `https://your-app-name.onrender.com/api/test` (test endpoint)

## Common Render Issues:

### Issue: Service won't start
**Check**: Environment variables are set correctly

### Issue: Database connection failed
**Check**: MongoDB Atlas IP whitelist includes Render IPs

### Issue: CORS errors
**Check**: FRONTEND_URL is set to your Vercel domain

### Issue: Service sleeps frequently
**Solution**: Upgrade to paid plan or implement keep-alive
