# Cora-SHK-Demo

Private source repository for the public Cora AI SHK product demo for ACE AI AGENTS.

## Deploy
- Connect this repository to the Netlify project `cora-shk-demo`.
- Build command: leave empty.
- Publish directory: `.`
- Functions directory: `netlify/functions`.

## Gemini
Add `GEMINI_API_KEY` as a secret Netlify environment variable with scope including **Functions**, then trigger a new deploy. Never commit the key to this repository or expose it in browser code.
Optional: set `DEMO_ORIGIN` to the exact deployed site origin to enforce an origin check.

## Demo limits
- This is a generic example SHK business, not a real contractor.
- The current demo does not submit or store leads.
- Complete and review the legal/privacy details before commercial public use.
- Verify model availability and API usage/cost settings in the Gemini project before enabling the live API.