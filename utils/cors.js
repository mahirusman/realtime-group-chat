const parseEnvList = (value) => {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const whitelist = parseEnvList(process.env.CORS_WHITELIST);

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
