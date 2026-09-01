const crypto = require("crypto");

module.exports = (req, res) => {
  const { OAUTH_GITHUB_CLIENT_ID } = process.env;

  const state = crypto.randomBytes(24).toString("hex");

  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?client_id=${OAUTH_GITHUB_CLIENT_ID}&scope=repo,user&state=${state}`,
  });
  res.end();
};
