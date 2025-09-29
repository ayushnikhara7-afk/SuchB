# Quick Setup Checklist - Vercel + Render

## ✅ Step 1: Deploy Backend to Render

1. **Push your server code to GitHub**
2. **Connect Render to your GitHub repo**
3. **Create new Web Service in Render**
4. **Configure Render service:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x
5. **Set environment variables in Render:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=https://your-frontend.vercel.app (set after frontend deploy)
   ```
6. **Deploy and get your Render URL**

## ✅ Step 2: Deploy Frontend to Vercel

1. **Push your Client code to GitHub**
2. **Connect Vercel to your GitHub repo**
3. **Configure Vercel project:**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set environment variables in Vercel:**
   ```bash
   VITE_API_URL=https://your-backend-app-name.onrender.com/api
   ```
5. **Deploy and get your Vercel URL**

## ✅ Step 3: Update Cross-References

1. **Update Render environment:**
   - Set `FRONTEND_URL=https://your-frontend-app-name.vercel.app`
2. **Redeploy Render service** (to pick up new FRONTEND_URL)

## ✅ Step 4: Test Everything

### Test Backend:
- [ ] `https://your-backend.onrender.com/` shows server info
- [ ] `https://your-backend.onrender.com/api/health` shows health status
- [ ] `https://your-backend.onrender.com/api/test` shows test response

### Test Frontend:
- [ ] `https://your-frontend.vercel.app/` loads homepage
- [ ] `https://your-frontend.vercel.app/live-classes` loads without 404
- [ ] Refresh page on `/live-classes` works (no 404)
- [ ] Browser console shows: `API Base URL: https://your-backend.onrender.com/api`

### Test API Connection:
- [ ] Frontend can make API calls to backend
- [ ] No CORS errors in browser console
- [ ] Authentication works
- [ ] Live classes load properly

## 🚨 Common Issues & Quick Fixes:

### Frontend shows localhost API URL:
- **Fix**: Set `VITE_API_URL` in Vercel environment variables

### 404 on page refresh:
- **Fix**: `vercel.json` file should handle this (already added)

### CORS errors:
- **Fix**: Set `FRONTEND_URL` in Render environment variables

### Database connection failed:
- **Fix**: Check MongoDB Atlas IP whitelist includes Render IPs

### Backend sleeps frequently:
- **Fix**: Upgrade Render plan or implement keep-alive endpoint

## 📞 Support:

If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel function logs for frontend errors
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
