// Save as debug-env.js and run: node debug-env.js
require('dotenv').config();

console.log('=== ENVIRONMENT DEBUG ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('.env file exists:', require('fs').existsSync('.env'));

console.log('\n=== RAW VALUES ===');
console.log('NOTION_API_KEY:', JSON.stringify(process.env.NOTION_API_KEY));
console.log('NOTION_INVESTORS_DB_ID:', JSON.stringify(process.env.NOTION_INVESTORS_DB_ID));
console.log('NOTION_UNITS_DB_ID:', JSON.stringify(process.env.NOTION_UNITS_DB_ID));
console.log('NOTION_DOCUMENTS_DB_ID:', JSON.stringify(process.env.NOTION_DOCUMENTS_DB_ID));

console.log('\n=== VALUE CHECKS ===');
const apiKey = process.env.NOTION_API_KEY;
const investorsDb = process.env.NOTION_INVESTORS_DB_ID;

console.log('API Key exists:', !!apiKey);
console.log('API Key length:', apiKey?.length);
console.log('API Key starts with secret_:', apiKey?.startsWith('secret_'));

console.log('Investors DB exists:', !!investorsDb);
console.log('Investors DB length:', investorsDb?.length);
console.log('Investors DB is UUID format:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(investorsDb));

console.log('\n=== NOTION CLIENT TEST ===');
if (apiKey && investorsDb) {
  try {
    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: apiKey });
    console.log('Notion client created successfully');
    
    // Test database access
    notion.databases.retrieve(investorsDb)
      .then(() => console.log('✅ Database access successful'))
      .catch(err => console.log('❌ Database access failed:', err.message));
  } catch (error) {
    console.log('❌ Notion client creation failed:', error.message);
  }
} else {
  console.log('❌ Missing required environment variables');
}

console.log('\n=== ALL ENV VARS STARTING WITH NOTION ===');
Object.keys(process.env)
  .filter(key => key.startsWith('NOTION'))
  .forEach(key => {
    console.log(`${key}:`, JSON.stringify(process.env[key]));
  });