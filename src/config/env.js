const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const hasDatabaseConfig = requiredVars.every((key) => Boolean(process.env[key]));

module.exports = {
  port: Number(process.env.PORT || 3000),
  hasDatabaseConfig,
  db: hasDatabaseConfig
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      }
    : null
};
