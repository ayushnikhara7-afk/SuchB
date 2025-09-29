# Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables
Ensure these environment variables are set in your deployment platform:

**Required:**
- `NODE_ENV=production`
- `PORT=3001` (or let the platform assign it)
- `MONGODB_URI=your-mongodb-connection-string`
- `JWT_SECRET=your-secure-jwt-secret`

**Optional but Recommended:**
- `FRONTEND_URL=your-frontend-url`
- `RESEND_API_KEY=your-resend-api-key`
- `RAZORPAY_KEY_ID=your-razorpay-key-id`
- `RAZORPAY_KEY_SECRET=your-razorpay-key-secret`

### 2. Database Setup
- Ensure MongoDB Atlas cluster is running
- Verify connection string is correct
- Check IP whitelist includes your deployment platform's IPs

### 3. Dependencies
- Ensure `package.json` has all required dependencies
- Run `npm install` to verify all packages install correctly

## Testing After Deployment

### 1. Basic Health Check
Test these endpoints after deployment:

```bash
# Root endpoint
GET https://your-domain.com/

# Health check
GET https://your-domain.com/api/health

# Should return:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 2. API Routes Test
Test that all routes are accessible:

```bash
# Auth routes
POST https://your-domain.com/api/auth/send-phone-otp

# Blog routes (public)
GET https://your-domain.com/api/blogs/published

# Admin routes (protected)
GET https://your-domain.com/api/admin/stats
```

## Common Issues & Solutions

### Issue: "Route not found" Error
**Causes:**
1. Missing environment variables (especially JWT_SECRET, MONGODB_URI)
2. Database connection failure
3. Server not starting properly

**Solutions:**
1. Check deployment logs for missing environment variables
2. Verify database connection string
3. Test with `/api/health` endpoint first

### Issue: Database Connection Failed
**Causes:**
1. Wrong MongoDB URI
2. IP not whitelisted in MongoDB Atlas
3. Network connectivity issues

**Solutions:**
1. Verify MongoDB URI format
2. Add deployment platform IPs to MongoDB whitelist
3. Check MongoDB Atlas cluster status

### Issue: Authentication Errors
**Causes:**
1. JWT_SECRET not set
2. Token validation issues

**Solutions:**
1. Ensure JWT_SECRET is set in environment variables
2. Test with `/api/test-blogs` or `/api/test-videos` routes first

## Platform-Specific Notes

### Vercel
- Set environment variables in Vercel dashboard
- Ensure `NODE_ENV=production` is set
- Check function timeout settings

### Railway
- Set environment variables in Railway dashboard
- Verify port configuration

### Heroku
- Use `heroku config:set` to set environment variables
- Ensure Procfile is configured correctly

### DigitalOcean App Platform
- Set environment variables in App Platform dashboard
- Verify build and run commands

## Monitoring

After deployment, monitor:
1. Server logs for errors
2. Database connection status
3. API response times
4. Memory usage

## Rollback Plan

If deployment fails:
1. Check deployment logs
2. Verify environment variables
3. Test database connectivity
4. Rollback to previous version if needed
