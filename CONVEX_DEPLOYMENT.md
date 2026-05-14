# Convex Backend Deployment Guide

## Issue Found
The Convex backend was missing `schema.ts`, which prevented table operations. This has been created.

## Steps to Deploy Backend Functions

### 1. Set up local Convex environment for the NEW deployment
Create `.env.local` in the project root with:
```
CONVEX_DEPLOYMENT=dev:abundant-skunk-743
```

### 2. Link to your new Convex project (shcportalkohimateam)
From the project root directory, run:
```bash
npx convex env set CONVEX_DEPLOYMENT dev:abundant-skunk-743
```

Or use the Convex CLI to link:
```bash
npx convex deploy
```

When prompted, authenticate and select your `shcportalkohimateam` deployment.

### 3. Deploy the backend functions
```bash
cd convex
npx convex deploy
```

This will:
- Upload the schema.ts file
- Deploy accounts.ts functions
- Deploy cards.ts functions
- Initialize the tables in your Convex cloud project

### 4. Update environment variables in Vercel
Set in Vercel Settings → Environment Variables:
- `NEXT_PUBLIC_CONVEX_URL` = `https://abundant-skunk-743.convex.cloud` (or your actual deployment URL)
- `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN` = `dev:abundant-skunk-743|eyJ2MiI6Ijg4MDZiMDIyNzg3NjRkYmFiZjM2OWQ2MDM5NDE4NzM3In0=`

### 5. Restart and test
After deployment:
- Restart the Next.js dev server (or redeploy to Vercel)
- Try creating a district account from admin dashboard
- Try generating cards from district dashboard

## Tables Created
- **accounts**: Stores admin and district user credentials
- **soil_cards**: Stores soil health card data with evaluations

## If deployment fails
1. Check Convex status: `npx convex status`
2. Verify authentication: `npx convex login`
3. Check logs: `npx convex dev --url https://your-deployment.convex.cloud`
