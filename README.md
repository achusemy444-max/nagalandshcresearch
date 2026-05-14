# nagalandshcresearch
Nagaland SHC research team

## Convex and Vercel setup

This app connects to Convex using environment variables.

1. In Vercel, open your project settings.
2. Add the following environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` → `https://<your-convex-project>.convex.cloud`
   - `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN` → `dev:<your-project-slug>|<your-access-token>` or `prod:<your-project-slug>|<your-access-token>`
3. Deploy the app on Vercel.

> Do not commit local environment files like `.env.local` to GitHub.
