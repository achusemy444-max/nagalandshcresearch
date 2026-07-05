# Convex Backend for Soil Health Project

This folder contains Convex server functions for the Soil Health Card portal.

## Setup

1. Install Convex in the project directory:

   ```bash
   npm install convex
   ```

2. Initialize or connect to your Convex project:

   ```bash
   npx convex dev
   ```

3. Deploy functions after setup:

   ```bash
   npx convex deploy
   ```

## Available backend functions

- `accounts.list` - list all user accounts
- `accounts.login` - authenticate a user
- `accounts.create` - create a new district account
- `accounts.update` - update a district account
- `accounts.deleteAccount` - delete a district account
- `cards.list` - list soil health cards, optionally filtered by district
- `cards.save` - insert a new soil health card
- `cards.deleteCard` - delete a soil health card

## Front-end integration

Update `index.html` and `script.js` with your Convex deployment URL and the team access token.

```js
const CONVEX_URL = "https://YOUR_CONVEX_DEPLOYMENT_URL";
const CONVEX_ACCESS_TOKEN = "<your-access-token>";
```

Then load the page from GitHub Pages or your Vercel domain.
