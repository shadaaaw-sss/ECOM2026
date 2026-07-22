const axios = require('axios');

const BASE = process.env.BACKEND_URL || 'http://localhost:4000/api';

const endpoints = [
  '/health',
  '/products',
  '/categories',
  '/brands'
];

(async () => {
  for (const ep of endpoints) {
    try {
      const url = `${BASE}${ep}`;
      const res = await axios.get(url, { timeout: 5000 });
      console.log(`${ep}: ${res.status}`);
    } catch (err) {
      console.error(`${ep}: FAILED`, err.message);
      process.exitCode = 2;
    }
  }
  console.log('Smoke tests completed');
})();
