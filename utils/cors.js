const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:6066",
  "https://dev.hutfin.com",
  "https://stag.hutfin.com",
  "https://hutfin.com",
  "https://dev-sso.hutfin.com",
  "https://dev-list.hutfin.com",
  "https://stg-list.hutfin.com",
];

const whitelistPatterns = [/^https?:\/\/([a-z0-9-]+\.)?hutfin\.com$/i];

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (whitelist.includes(origin)) {
    return true;
  }

  return whitelistPatterns.some((pattern) => pattern.test(origin));
};

const corsOriginValidator = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }

  return callback(new Error("Not allowed by CORS"));
};

module.exports = {
  isOriginAllowed,
  corsOriginValidator,
};
