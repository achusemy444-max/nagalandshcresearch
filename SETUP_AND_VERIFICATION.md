# Complete Setup & Troubleshooting Guide

## Current Setup Status

### 1. Local Environment Variables
Your local `.env.local` now has:
- ✅ `NEXT_PUBLIC_CONVEX_URL`: Set to `https://abundant-skunk-743.convex.cloud`
- ✅ `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN`: Set to your new deployment key

### 2. Convex Backend Deployment

Ensure your backend is deployed with the latest schema and mutations:

```bash
cd d:\VS Code Project\SHCproject\69fc6805ac4586fcc9c67c43
npx convex deploy
```

When prompted:
- Select deployment: `shcportalkohimateam` (dev:abundant-skunk-743)
- This deploys: schema.ts, accounts.ts, cards.ts

### 3. Frontend Verification

To diagnose connection issues in the browser console:

```javascript
// Paste this in browser console (F12)
import { diagnoseConvex } from 'app/utils/convex-diagnostics.js'
diagnoseConvex()
```

This will output:
- ✓ Environment variables set
- ✓ Convex SDK loaded
- ✓ Client initialization success
- ✓ Functions available

### 4. What Happens When You Create a District Account

**Flow:**
1. Admin fills form (District, Officer Name, Username, Password, Address)
2. Admin clicks "Create District Account"
3. Frontend validates form
4. Frontend calls: `convexClient.mutation(apiClient.accounts.create, account)`
5. Convex backend validates account object against schema
6. If valid: inserts into `accounts` table
7. Frontend reloads accounts list
8. Success message displayed

**If it fails:**
- Check browser console (F12 → Console tab) for error messages
- Look for [Admin] prefixed logs
- Will show exact error from Convex

### 5. Fix Verification Checklist

**Before testing, verify:**
- [ ] `.env.local` has both `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN`
- [ ] Run `npx convex deploy` from project root
- [ ] Next.js server restarted (stop and `npm run dev`)
- [ ] Browser console (F12) shows no errors on page load
- [ ] Can login with: admin/Adminkohima@123

**Test account creation:**
- [ ] Fill all fields in "Create District User" form
- [ ] Click "Create District Account"
- [ ] Check browser console for [Admin] logs
- [ ] Should see "Account created" message
- [ ] Account should appear in district accounts list

### 6. Data Flow Optimization

**Local vs Cloud:**
- ✅ Login uses Convex query (always online)
- ✅ Account creation uses Convex mutation (saves to cloud)
- ✅ Card generation uses Convex mutation (saves to cloud)
- ✅ Dashboard loads data from Convex every 15 seconds
- ❌ Local storage is backup only, not primary

### 7. If Still Getting "Database connection unavailable"

1. **Check environment variables loaded:**
   ```javascript
   console.log(process.env.NEXT_PUBLIC_CONVEX_URL)
   console.log(process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN?.substring(0, 20))
   ```

2. **Check Convex client created:**
   - Open browser DevTools (F12)
   - Go to Console
   - Look for "[Admin] Convex client initialized" or similar

3. **Check internet connection:**
   - Visit https://abundant-skunk-743.convex.cloud in browser
   - Should load (even if blank)

4. **Redeploy backend:**
   ```bash
   npx convex deploy --url https://abundant-skunk-743.convex.cloud
   ```

5. **Clear browser cache:**
   - DevTools → Application → Clear site data
   - Refresh page (Ctrl+Shift+R)

### 8. Vercel Deployment (when ready)

Set these environment variables in Vercel:
- `NEXT_PUBLIC_CONVEX_URL`: https://abundant-skunk-743.convex.cloud
- `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN`: dev:abundant-skunk-743|eyJ2MiI6Ijg4MDZiMDIyNzg3NjRkYmFiZjM2OWQ2MDM5NDE4NzM3In0=

Then redeploy from Vercel dashboard.

### 9. Database Tables Created

**accounts** table:
```
- id (string)
- role (string): "admin" or "district"
- district (string)
- officerName (string)
- username (string) - indexed for fast lookup
- password (string)
- address (string)
- createdAt (string)
```

**soil_cards** table:
```
- id (string)
- district (string) - indexed
- testCenterAddress (string)
- testCenterId (string)
- testingDate (string)
- surveyNo (string)
- farmerName (string)
- farmerVillage (string)
- soilTexture (string)
- moistureContext (string)
- parameters (object with 12 soil parameters)
- evaluations (object with status for each parameter)
- recommendation (string)
- createdBy (string)
- createdAt (string)
```

### 10. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Database connection unavailable" | Missing access token | Add `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN` to .env.local |
| "Username already exists" | Username taken | Use different username |
| "Account not found" | Update/delete non-existent account | Refresh page |
| Blank console logs | Client not initializing | Check environment variables in .env.local |
| Data not persisting | Using old Convex deployment | Run `npx convex deploy` |

### Need Help?

Check:
1. Browser console (F12) for detailed error messages
2. Convex dashboard logs at https://dashboard.convex.dev
3. This guide's "If Still Getting" section
