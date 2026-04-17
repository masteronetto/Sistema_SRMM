const { Pool } = require('pg');
const { db } = require('../config/env');

const pool = new Pool(db);

module.exports = pool;
