# Frontend Environment Configuration

## Required Environment Variables

### For Production Deployment:

Set these environment variables in your frontend deployment platform:

```bash
# API Backend URL (REQUIRED for production)
VITE_API_URL=https://your-backend-domain.com/api

# Optional: Enable debug mode
VITE_DEBUG=false
```

### For Development:

Create a `.env.local` file in your Client directory:

```bash
# Development API URL
VITE_API_URL=http://localhost:3001/api

# Debug mode
VITE_DEBUG=true
```

## Platform-Specific Instructions:

### Vercel
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend-domain.com/api`

### Netlify
1. Go to Site settings > Environment variables
2. Add: `VITE_API_URL` = `https://your-backend-domain.com/api`

### Railway
1. Go to your project settings
2. Add environment variable: `VITE_API_URL` = `https://your-backend-domain.com/api`

## Testing Your Configuration:

After setting the environment variable, check the browser console for:
```
API Base URL: https://your-backend-domain.com/api
Environment: production
```

If you see `http://localhost:3001/api` in production, the environment variable is not set correctly.
