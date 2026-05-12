# nagalandshcresearch
Nagaland SHC research team

## Convex and Vercel setup

This app connects to Convex using environment variables.

1. In Vercel, open your project settings.
2. Add the following environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` → `https://effervescent-cuttlefish-985.convex.cloud`
   - `NEXT_PUBLIC_CONVEX_ACCESS_TOKEN` → `prod:effervescent-cuttlefish-985|eyJ2MiI6ImFjNzNkZTZiNjdkMDQ3NzE5ZTE4ZGNmZjQ4ODY0N2FiIn0=`
3. Deploy the app on Vercel.

> Do not commit local environment files like `.env.local` to GitHub.
