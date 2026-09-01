const https = require("https");

module.exports = (req, res) => {
  const { OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET } = process.env;
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ error: "Missing code parameter" });
    return;
  }

  const postData = JSON.stringify({
    client_id: OAUTH_GITHUB_CLIENT_ID,
    client_secret: OAUTH_GITHUB_CLIENT_SECRET,
    code,
  });

  const options = {
    hostname: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const request = https.request(options, (response) => {
    let body = "";
    response.on("data", (chunk) => (body += chunk));
    response.on("end", () => {
      try {
        const data = JSON.parse(body);
        const token = data.access_token;
        const provider = "github";

        const postMsgScript = `
          <script>
            (function() {
              function recieveMessage(e) {
                console.log("recieveMessage %o", e);
                window.opener.postMessage(
                  'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
                  e.origin
                );
                window.removeEventListener("message", recieveMessage, false);
              }
              window.addEventListener("message", recieveMessage, false);
              window.opener.postMessage("authorizing:${provider}", "*");
            })();
          </script>
        `;

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(postMsgScript);
      } catch (err) {
        res.status(500).json({ error: "Failed to parse GitHub response" });
      }
    });
  });

  request.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });

  request.write(postData);
  request.end();
};
