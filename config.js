require("dotenv").config();

const config = {
  token: process.env.DISCORD_TOKEN,
  prefix: process.env.PREFIX || "!", // Default prefix is "!"
};

module.exports = config;
