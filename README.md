# Double Barrel — Editor Login Service

GitHub OAuth broker for the Double Barrel Steakhouse Decap CMS editor.

## Deploy to Vercel

1. Push this repo to GitHub under your account.
2. Import the repo in Vercel as a new project.
3. Add environment variables:
   - `OAUTH_GITHUB_CLIENT_ID` — your GitHub OAuth App client ID
   - `OAUTH_GITHUB_CLIENT_SECRET` — your GitHub OAuth App client secret
4. Deploy.

## How it works

- `/api/auth` redirects to GitHub's OAuth authorize page.
- `/api/callback` exchanges the code for a token and passes it back to
  the Decap CMS editor via `postMessage`.
- The site's `admin/config.yml` points `base_url` at this service.
