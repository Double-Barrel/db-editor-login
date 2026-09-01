// Decap CMS OAuth broker — step 1 of 2.
// The /admin/ login popup lands here; we send it on to GitHub's authorize
// screen. Env var required: OAUTH_GITHUB_CLIENT_ID.
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end("OAUTH_GITHUB_CLIENT_ID is not set on this Vercel project");
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope: "repo",
    state,
  });

  // State cookie guards the callback against forged codes (CSRF).
  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );
  res.statusCode = 302;
  res.setHeader(
    "Location",
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
  res.end();
};
