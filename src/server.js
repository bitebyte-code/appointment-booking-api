require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
  }
  await connectDB();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

if (require.main === module) {
  start().catch(err => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { start };
