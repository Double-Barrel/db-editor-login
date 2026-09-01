// Decap CMS OAuth broker — step 2 of 2.
// GitHub redirects here with ?code=...; we exchange it for a token and hand
// it to the /admin/ window via the postMessage handshake Decap expects.
function resultPage(status, content) {
  const payload = "authorization:github:" + status + ":" + JSON.stringify(content);
  return `<!doctype html>
<html><body>
<p>${status === "success" ? "Signed in — finishing up…" : "Sign-in failed. Close this window and try again."}</p>
<script>
(function () {
  var payload = ${JSON.stringify(payload)};
  function receiveMessage(e) {
    window.opener.postMessage(payload, e.origin);
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;
}

function parseCookies(header) {
  const out = {};
  (header || "").split(/;\s*/).forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i)] = part.slice(i + 1);
  });
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end(resultPage("error", { message: "Broker env vars are not set" }));
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = new URL(req.url, `https://${host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(req.headers.cookie);

  if (!code || !state || state !== cookies.oauth_state) {
    res.statusCode = 400;
    res.end(resultPage("error", { message: "State mismatch — close this window and log in again" }));
    return;
  }

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await r.json();

    if (!r.ok || data.error || !data.access_token) {
      res.end(
        resultPage("error", {
          message: data.error_description || data.error || "GitHub returned no token",
        })
      );
      return;
    }

    res.setHeader(
      "Set-Cookie",
      "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );
    res.end(resultPage("success", { token: data.access_token, provider: "github" }));
  } catch (err) {
    res.statusCode = 502;
    res.end(resultPage("error", { message: "Could not reach GitHub — try again in a minute" }));
  }
};
