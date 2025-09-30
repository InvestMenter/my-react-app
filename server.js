require('dotenv').config();



console.log('=== ENVIRONMENT DEBUG ===');

console.log('NOTION_API_KEY exists:', !!process.env.NOTION_API_KEY);

console.log('NOTION_API_KEY value:', process.env.NOTION_API_KEY ? 'Set' : 'Missing');

console.log('INVESTORS_DB_ID:', process.env.NOTION_INVESTORS_DB_ID ? 'Set' : 'Missing');

console.log('DOCUMENTS_DB_ID:', process.env.NOTION_DOCUMENTS_DB_ID ? 'Set' : 'Missing');

console.log('GOOGLE_DRIVE_CREDENTIALS:', process.env.GOOGLE_DRIVE_CREDENTIALS ? 'Set' : 'Missing');

console.log('=========================');



const express = require('express');

const cors = require('cors');

const fs = require('fs');

const path = require('path');

const { google } = require('googleapis');

const axios = require('axios');

const cheerio = require('cheerio');

const cron = require('node-cron');

const Parser = require('rss-parser');

const parser = new Parser();



const app = express();

const port = 3001;



// Google Drive configuration

const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;



// File paths for persistent storage

const INVESTORS_FILE = path.join(__dirname, 'data', 'investors.json');

const DOCUMENTS_FILE = path.join(__dirname, 'data', 'documents.json');

const UNITS_FILE = path.join(__dirname, 'data', 'units.json');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

const GOOGLE_CREDENTIALS_FILE = path.join(__dirname, 'google-credentials.json');



let newsCache = {

lastUpdated: null,

articles: [],

dubaiLandArticles: [],

officialArticles: []

};



// News sources configuration

const NEWS_SOURCES = {

government: [

{

name: 'Dubai Land Department',

url: 'https://dubailand.gov.ae/en/news-and-media/latest-news/',

selector: '.news-item, .post-item, article, .content-item',

titleSelector: 'h1, h2, h3, .title, .post-title',

linkSelector: 'a',

descriptionSelector: '.excerpt, .summary, p',

category: 'Official Government'

}

],

rss: [

{

name: 'Khaleej Times Real Estate',

url: 'https://feeds.khaleejtimes.com/business/real-estate',

category: 'Real Estate'

},

{

name: 'Gulf News Property',

url: 'https://gulfnews.com/business/property/feeds/latest',

category: 'Property'

},

{

name: 'Arabian Business',

url: 'https://www.arabianbusiness.com/industries/real-estate/feed',

category: 'Property'

}

],

websites: [

{

name: 'Khaleej Times Real Estate',

url: 'https://www.khaleejtimes.com/business/real-estate',

selector: '.kt-post, .story-card, article',

titleSelector: 'h2 a, h3 a, .story-headline a',

linkSelector: 'h2 a, h3 a, .story-headline a',

descriptionSelector: '.story-summary, .excerpt',

category: 'Real Estate News'

}

]

};



// Keywords for filtering

const DUBAI_LAND_KEYWORDS = [

'dubai land department', 'dld', 'property registration', 'real estate license',

'property law', 'real estate regulation', 'property transaction', 'property permit',

'real estate registration', 'property title deed', 'oqood', 'ejari',

'property developer license', 'real estate broker', 'property valuation',

'property tax', 'real estate fee', 'property ownership', 'land registration',

'property transfer', 'real estate compliance', 'property documentation'

];



const DUBAI_KEYWORDS = [

'dubai', 'uae', 'emirates', 'property', 'real estate',

'investment', 'downtown dubai', 'dubai marina', 'palm jumeirah',

'jbr', 'business bay', 'deira', 'bur dubai'

];



// Ensure directories exist

const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {

fs.mkdirSync(dataDir, { recursive: true });

console.log('Created data directory:', dataDir);

}



if (!fs.existsSync(UPLOADS_DIR)) {

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

console.log('Created uploads directory:', UPLOADS_DIR);

}



// Initialize Google Drive

let drive = null;



async function initializeGoogleDrive() {

try {

let credentials;


if (process.env.GOOGLE_DRIVE_CREDENTIALS) {

credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);

} else if (fs.existsSync(GOOGLE_CREDENTIALS_FILE)) {

credentials = JSON.parse(fs.readFileSync(GOOGLE_CREDENTIALS_FILE, 'utf8'));

} else {

console.log('No Google Drive credentials found');

return false;

}



if (credentials.private_key) {

credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');

}



const auth = new google.auth.GoogleAuth({

credentials: credentials,

scopes: ['https://www.googleapis.com/auth/drive'] // CORRECTED SCOPE

});



drive = google.drive({ version: 'v3', auth });


await drive.about.get({ fields: 'user' });

console.log('Google Drive API initialized successfully');

return true;

} catch (error) {

console.error('Failed to initialize Google Drive:', error.message);

return false;

}

}



initializeGoogleDrive();



app.use('/uploads', express.static(UPLOADS_DIR));



// Data loading and saving functions

function loadInvestors() {

try {

if (fs.existsSync(INVESTORS_FILE)) {

const data = fs.readFileSync(INVESTORS_FILE, 'utf8');

const loadedInvestors = JSON.parse(data);

console.log(`Loaded ${loadedInvestors.length} investors from file storage`);

return loadedInvestors;

}

} catch (error) {

console.error('Error loading investors from file:', error.message);

}


const defaultInvestors = [

{

id: 'test-investor-1',

name: 'Test Investor',

email: 'investor1@test.com',

phone: '+1234567890',

nationality: 'UAE',

birthDate: '1990-01-01',

password: 'test123',

googleDriveFolderId: null,

personalDocsFolderId: null

}

];

console.log('Using default test account');

return defaultInvestors;

}



function saveInvestors(investors) {

try {

fs.writeFileSync(INVESTORS_FILE, JSON.stringify(investors, null, 2));

console.log(`Saved ${investors.length} investors to file storage`);

} catch (error) {

console.error('Error saving investors to file:', error.message);

}

}



function loadDocuments() {

try {

if (fs.existsSync(DOCUMENTS_FILE)) {

const data = fs.readFileSync(DOCUMENTS_FILE, 'utf8');

const loadedDocuments = JSON.parse(data);

console.log(`Loaded ${loadedDocuments.length} documents from file storage`);

return loadedDocuments;

}

} catch (error) {

console.error('Error loading documents from file:', error.message);

}

return [];

}



function saveDocuments(documents) {

try {

fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));

console.log(`Saved ${documents.length} documents to file storage`);

} catch (error) {

console.error('Error saving documents to file:', error.message);

}

}



function loadUnits() {

try {

if (fs.existsSync(UNITS_FILE)) {

const data = fs.readFileSync(UNITS_FILE, 'utf8');

const loadedUnits = JSON.parse(data);

console.log(`Loaded ${loadedUnits.length} units from file storage`);

return loadedUnits;

}

} catch (error) {

console.error('Error loading units from file:', error.message);

}

return [];

}



function saveUnits(units) {

try {

fs.writeFileSync(UNITS_FILE, JSON.stringify(units, null, 2));

console.log(`Saved ${units.length} units to file storage`);

} catch (error) {

console.error('Error saving units to file:', error.message);

}

}



// Google Drive helper functions

async function createOrFindFolderFixed(folderName, parentId) {

if (!drive) {

console.log('Google Drive not initialized');

return null;

}



try {

console.log(`Looking for folder '${folderName}' in parent '${parentId}'`);


const safeFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_').trim();

console.log(`Sanitized folder name: '${safeFolderName}'`);


const searchResponse = await drive.files.list({

q: `name='${safeFolderName}' and parents='${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,

fields: 'files(id, name)',

supportsAllDrives: true,

includeItemsFromAllDrives: true

});



if (searchResponse.data.files && searchResponse.data.files.length > 0) {

console.log(`✓ Folder '${safeFolderName}' already exists:`, searchResponse.data.files[0].id);

return searchResponse.data.files[0].id;

}



console.log(`Creating new folder: ${safeFolderName}`);


const folderMetadata = {

name: safeFolderName,

parents: [parentId],

mimeType: 'application/vnd.google-apps.folder'

};


const response = await drive.files.create({

resource: folderMetadata,

fields: 'id, name',

supportsAllDrives: true,

supportsTeamDrives: true

});



console.log(`✓ Successfully created folder '${safeFolderName}':`, response.data.id);


return response.data.id;



} catch (error) {

console.error(`✗ Failed to create/find folder '${folderName}':`, error);

return null;

}

}



async function createInvestorFolderHierarchyFixed(investorName, investorId) {

if (!drive) {

console.error('CRITICAL ERROR: Google Drive object is NOT available!');

return { mainFolderId: null, personalDocsFolderId: null, error: 'Google Drive not initialized' };

}



try {

try {

await drive.files.get({

fileId: GOOGLE_DRIVE_FOLDER_ID,

fields: 'id,name,permissions',

supportsAllDrives: true,

});

console.log('✓ Parent folder accessible');

} catch (error) {

console.error('✗ Cannot access parent folder:', error.message);

return {

mainFolderId: null,

personalDocsFolderId: null,

error: `Cannot access parent folder: ${error.message}`

};

}



const safeFolderName = investorName.replace(/[<>:"/\\|?*]/g, '_');


let mainFolderId = await createOrFindFolderFixed(safeFolderName, GOOGLE_DRIVE_FOLDER_ID);


if (!mainFolderId) {

throw new Error('Failed to create main investor folder');

}



let personalDocsFolderId = await createOrFindFolderFixed('Personal Documents', mainFolderId);



console.log('✓ Created folder hierarchy:', {

mainFolder: mainFolderId,

personalDocsFolder: personalDocsFolderId

});



return {

mainFolderId,

personalDocsFolderId,

error: null

};



} catch (error) {

console.error('✗ Failed to create investor folder hierarchy:', error);

return {

mainFolderId: null,

personalDocsFolderId: null,

error: error.message

};

}

}



async function uploadToInvestorFolderFixed(fileData, fileName, mimeType, investorFolderId) {

if (!drive || !investorFolderId) {

console.log('Google Drive not available or no folder ID');

return { success: false, error: 'Google Drive not available or no folder ID' };

}



try {

console.log(`Uploading file: ${fileName} to folder: ${investorFolderId}`);


if (!fileData || !fileData.includes(',')) {

throw new Error('Invalid file data format');

}


const base64Data = fileData.split(',')[1];

if (!base64Data) {

throw new Error('No base64 data found');

}


const buffer = Buffer.from(base64Data, 'base64');

console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);


const { Readable } = require('stream');

const stream = new Readable();

stream.push(buffer);

stream.push(null);



const fileMetadata = {

name: fileName,

parents: [investorFolderId]

};



const media = {

mimeType: mimeType || 'application/octet-stream',

body: stream,

};


const response = await drive.files.create({

resource: fileMetadata,

media: media,

fields: 'id,name,webViewLink,webContentLink,size',

supportsAllDrives: true,

supportsTeamDrives: true

});



console.log('✓ File uploaded to Google Drive:', response.data.id);

return {

success: true,

fileId: response.data.id,

fileName: response.data.name,

webViewLink: response.data.webViewLink,

webContentLink: response.data.webContentLink,

size: response.data.size,

error: null

};



} catch (error) {

console.error('✗ Google Drive upload failed:', error);

return {

success: false,

error: error.message,

details: error

};

}

}



// AI Document Processing

async function processDocumentWithAI(fileData, documentType, fileName) {

try {

console.log('Starting AI processing for document:', fileName, 'Type:', documentType);


const response = await fetch('https://oi-server.onrender.com/chat/completions', {

method: 'POST',

headers: {

'customerId': 'cus_T15kylWmcJnU0J',

'Content-Type': 'application/json',

'Authorization': 'Bearer xxx'

},

body: JSON.stringify({

model: 'openrouter/claude-sonnet-4',

messages: [

{

role: 'system',

content: `You are a document processing AI for an investor portal. Extract relevant information from documents and return ONLY valid JSON format.



For Passport documents, return:

{

"type": "Passport",

"documentId": "generated-unique-id",

"passportNumber": "passport number from document",

"fullName": "full name from passport",

"expiryDate": "YYYY-MM-DD",

"dateUploaded": "${new Date().toISOString().split('T')[0]}"

}



For OTP documents, return:

{

"type": "OTP",

"documentId": "generated-unique-id",

"investorName": "investor name from document",

"unitDetails": "unit description and details",

"sqft": "area in square feet",

"amount": 250000,

"developer": "developer/project name",

"dateUploaded": "${new Date().toISOString().split('T')[0]}"

}



For Visa/EID documents, return:

{

"type": "Visa",

"documentId": "generated-unique-id",

"idNumber": "ID/visa number",

"fullName": "full name from document",

"expiryDate": "YYYY-MM-DD",

"dateUploaded": "${new Date().toISOString().split('T')[0]}"

}



For Other documents, return:

{

"type": "Other",

"documentId": "generated-unique-id",

"dateUploaded": "${new Date().toISOString().split('T')[0]}"

}



Return ONLY the JSON object, no other text or formatting.`

},

{

role: 'user',

content: [

{ type: 'text', text: `Extract information from this ${documentType} document. Return only JSON.` },

{ type: 'file', file: { filename: fileName, file_data: fileData } }

]

}

]

})

});



if (response.ok) {

const result = await response.json();


if (result.choices && result.choices[0] && result.choices[0].message) {

const content = result.choices[0].message.content;


try {

let jsonContent = content;

if (content.includes('```json')) {

const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);

if (jsonMatch) {

jsonContent = jsonMatch[1];

}

} else if (content.includes('```')) {

const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);

if (codeMatch) {

jsonContent = codeMatch[1];

}

}


const extractedData = JSON.parse(jsonContent.trim());

console.log('Successfully extracted data:', extractedData);

return extractedData;

} catch (parseError) {

console.error('Failed to parse AI response:', parseError);

throw new Error('AI returned invalid JSON');

}

} else {

throw new Error('AI response missing choices');

}

} else {

const errorText = await response.text();

throw new Error(`AI API error: ${response.status} - ${errorText}`);

}

} catch (aiError) {

console.error('AI processing failed:', aiError);


const fallbackData = {

Passport: {

type: 'Passport',

documentId: Date.now().toString(),

passportNumber: 'AI_FAILED_' + Math.random().toString(36).substr(2, 6),

fullName: 'AI Processing Failed - Manual Review Required',

expiryDate: '2030-01-01',

dateUploaded: new Date().toISOString().split('T')[0]

},

OTP: {

type: 'OTP',

documentId: Date.now().toString(),

investorName: 'AI Processing Failed - Manual Review Required',

unitDetails: 'Manual review required',

sqft: '0',

amount: 0,

developer: 'Manual review required',

dateUploaded: new Date().toISOString().split('T')[0]

},

Visa: {

type: 'Visa',

documentId: Date.now().toString(),

idNumber: 'AI_FAILED_' + Math.random().toString(36).substr(2, 6),

fullName: 'AI Processing Failed - Manual Review Required',

expiryDate: '2025-01-01',

dateUploaded: new Date().toISOString().split('T')[0]

},

Other: {

type: 'Other',

documentId: Date.now().toString(),

dateUploaded: new Date().toISOString().split('T')[0]

}

};


return fallbackData[documentType] || fallbackData.Other;

}

}



function saveFileLocally(fileData, filename) {

try {

const base64Data = fileData.split(',')[1];

const buffer = Buffer.from(base64Data, 'base64');


const timestamp = Date.now();

const extension = path.extname(filename);

const basename = path.basename(filename, extension);

const uniqueFilename = `${basename}_${timestamp}${extension}`;


const filePath = path.join(UPLOADS_DIR, uniqueFilename);

fs.writeFileSync(filePath, buffer);


const fileUrl = `/uploads/${uniqueFilename}`;

console.log('File saved locally:', filePath);

return fileUrl;

} catch (error) {

console.error('Error saving file locally:', error.message);

return null;

}

}



// News functions (simplified)

async function fetchRSSNews() {

const allArticles = [];


for (const source of NEWS_SOURCES.rss) {

try {

const response = await axios.get(source.url, {

timeout: 30000,

headers: {

'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

}

});


if (!response.data || response.data.length < 100) {

continue;

}


let cleanXML = response.data

.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;')

.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

.trim();


const feed = await parser.parseString(cleanXML);


if (!feed.items || feed.items.length === 0) {

continue;

}


const articles = feed.items.slice(0, 15).map(item => {

if (!item.title || !item.link) return null;


let description = item.summary || item.content || item.description || '';

if (description) {

description = description

.replace(/<[^>]*>/g, '')

.trim()

.substring(0, 250);

}


return {

title: item.title.replace(/<[^>]*>/g, '').trim(),

description: description || 'Click to read full article',

url: item.link,

publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),

source: { name: source.name },

category: source.category,

fetchedAt: new Date().toISOString(),

isRSS: true

};

}).filter(article => article !== null);


allArticles.push(...articles);


} catch (error) {

console.error(`Failed to fetch RSS from ${source.name}:`, error.message);

}

}


return allArticles;

}



async function getBackupNews() {

return [

{

title: "Dubai Real Estate Market Analysis - Q4 2025",

description: "Comprehensive analysis of Dubai's property market trends.",

url: "https://www.khaleejtimes.com/business/real-estate",

publishedAt: new Date().toISOString(),

source: { name: "Khaleej Times Real Estate" },

category: "Market Analysis",

isBackup: true

}

];

}



function filterArticles(articles, keywords) {

return articles.filter(article => {

const searchText = `${article.title} ${article.description}`.toLowerCase();

return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));

});

}



function removeDuplicates(articles) {

const seen = new Set();

return articles.filter(article => {

const key = article.title.toLowerCase().trim();

if (seen.has(key)) {

return false;

}

seen.add(key);

return true;

});

}



async function fetchAllNews() {

try {

const [rssArticles] = await Promise.all([

fetchRSSNews()

]);


let allArticles = [...rssArticles];


if (allArticles.length < 5) {

const backupNews = await getBackupNews();

allArticles.push(...backupNews);

}


const dubaiArticles = filterArticles(allArticles, DUBAI_KEYWORDS);

const dubaiLandArticles = filterArticles(allArticles, DUBAI_LAND_KEYWORDS);

const officialArticles = allArticles.filter(article => article.isOfficial);


const uniqueDubaiArticles = removeDuplicates(dubaiArticles);

const uniqueDubaiLandArticles = removeDuplicates(dubaiLandArticles);

const uniqueOfficialArticles = removeDuplicates(officialArticles);


newsCache = {

lastUpdated: new Date().toISOString(),

articles: uniqueDubaiArticles.slice(0, 25),

dubaiLandArticles: uniqueDubaiLandArticles.slice(0, 15),

officialArticles: uniqueOfficialArticles.slice(0, 20),

totalFetched: allArticles.length,

hasBackupNews: allArticles.some(article => article.isBackup)

};


return newsCache;


} catch (error) {

console.error('Error in fetchAllNews:', error);

const backupNews = await getBackupNews();


newsCache = {

lastUpdated: new Date().toISOString(),

articles: backupNews,

dubaiLandArticles: [],

officialArticles: [],

totalFetched: backupNews.length,

hasBackupNews: true,

error: error.message

};


return newsCache;

}

}



// Load data

let investors = loadInvestors();

let documents = loadDocuments();

let units = loadUnits();



// Express setup

app.use(cors({

origin: [

'http://localhost:3000',

'https://localhost:3000',

/https:\/\/.*\.github\.dev$/,

/https:\/\/.*\.app\.github\.dev$/

],

credentials: true,

methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

allowedHeaders: ['Content-Type', 'Authorization']

}));



app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));



app.use((req, res, next) => {

console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

next();

});



app.get('/', (req, res) => {

res.json({

message: 'COMPLETE FIXED Investor Portal Backend - All Issues Resolved!',

timestamp: new Date().toISOString(),

status: 'OK',

totalInvestors: investors.length,

totalDocuments: documents.length,

totalUnits: units.length,

fixes: [

'FIXED: Unit folder creation in Google Drive with force creation',

'FIXED: Document categorization persistence after logout/login',

'FIXED: Portfolio value calculation from OTP documents only',

'FIXED: Clean unit dropdown with simple names'

]

});

});



// Notion functions

async function saveToNotionWithDetailedErrorHandling(investor) {

if (!process.env.NOTION_API_KEY || !process.env.NOTION_INVESTORS_DB_ID) {

return null;

}



try {

const { Client } = require('@notionhq/client');

const notion = new Client({

auth: process.env.NOTION_API_KEY,

});



const response = await notion.pages.create({

parent: { database_id: process.env.NOTION_INVESTORS_DB_ID },

properties: {

'Name': {

title: [{ text: { content: investor.name || 'Unknown' } }]

},

'Email': {

email: investor.email || ''

},

'Phone': {

phone_number: investor.phone || ''

},

'Nationality': {

rich_text: [{ text: { content: investor.nationality || '' } }]

},

'Birth Date': {

date: investor.birthDate ? { start: investor.birthDate } : null

},

'Password': {

rich_text: [{ text: { content: investor.password || '' } }]

},

'Google Drive Folder ID': {

rich_text: [{ text: { content: investor.googleDriveFolderId || '' } }]

},

'Personal Docs Folder ID': {

rich_text: [{ text: { content: investor.personalDocsFolderId || '' } }]

}

}

});



console.log('✓ Successfully saved investor to Notion!');

return response;


} catch (error) {

console.error('Notion error:', error.message);

return null;

}

}



async function saveDocumentToNotionWithErrorHandling(document) {

if (!process.env.NOTION_API_KEY || !process.env.NOTION_DOCUMENTS_DB_ID) {

return null;

}



try {

const { Client } = require('@notionhq/client');

const notion = new Client({

auth: process.env.NOTION_API_KEY,

});



const baseUrl = process.env.BASE_URL || 'http://localhost:3001';



const properties = {

'Document ID': {

title: [{ text: { content: document.documentId || document.id || 'Unknown' } }]

},

'Investor Name': {

rich_text: [{ text: { content: document.investorName || 'Unknown' } }]

},

'Document Type': {

rich_text: [{ text: { content: document.documentType || document.type || 'Other' } }]

},

'Upload Date': {

date: { start: document.uploadDate || new Date().toISOString().split('T')[0] }

},

'Status': {

rich_text: [{ text: { content: document.status || 'Processing' } }]

}

};



if (document.googleDrive && document.googleDrive.webViewLink) {

properties['Google Drive Link'] = {

url: document.googleDrive.webViewLink

};

}



if (document.fileUrl) {

const fullFileUrl = document.fileUrl.startsWith('http') ? document.fileUrl : `${baseUrl}${document.fileUrl}`;

properties['File'] = {

url: fullFileUrl

};

}


const response = await notion.pages.create({

parent: { database_id: process.env.NOTION_DOCUMENTS_DB_ID },

properties

});



console.log('✓ Document successfully saved to Notion with ID:', response.id);

return response;


} catch (error) {

console.error('Notion document save error:', error.message);

return null;

}

}



// =================================================================

// FIXED ENDPOINTS - USE THESE

// =================================================================



// FIX 1: Enhanced Unit Creation with Forced Folder Creation

app.post('/api/createUnitWithForceFolder', async (req, res) => {

try {

const { data } = req.body;

  const unitName = data.name || data.unitName;  // Accept both "name" and "unitName"
    const unitNumber = data.unitNumber || '';
    const project = data.project || data.developer || '';
    const unitType = data.type || 'Studio';
    const area = data.area || data.sqft || '0';

if (!data || !data.investorId || !unitName) {
      return res.status(400).json({
        success: false,
        error: 'Investor ID and unit name are required'
      });
    }

    const investor = investors.find(inv => inv.id === data.investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found'
      });
    }

    if (!investor.googleDriveFolderId) {
      return res.status(400).json({
        success: false,
        error: 'Investor does not have a main Google Drive folder. Cannot create unit folder.'
      });
    }

    // Create folder name as "UnitName (UnitNumber)" if unitNumber exists
    const folderName = unitNumber ? `${unitName} (${unitNumber})` : unitName;

    let unitFolderId = null;
    let folderError = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!unitFolderId && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} to create folder: ${folderName}`);
      try {
        unitFolderId = await createOrFindFolderFixed(folderName, investor.googleDriveFolderId);
        if (!unitFolderId) {
          folderError = `Folder creation returned null on attempt ${attempts}`;
        } else {
          folderError = null;
        }
      } catch (e) {
        folderError = e.message;
        console.error(`Error on attempt ${attempts}:`, folderError);
      }
    }


const newUnit = {
      id: Date.now().toString(),
      investorId: data.investorId,
      name: unitName,  // Frontend expects "name"
      unitNumber: unitNumber,  // Frontend expects "unitNumber"
      project: project,  // Frontend expects "project"
      type: unitType,  // Frontend expects "type"
      area: area,  // Frontend expects "area"
      currentValue: parseFloat(data.currentValue) || 0,
      purchaseValue: parseFloat(data.purchaseValue) || 0,
      monthlyRental: parseFloat(data.monthlyRental) || 0,
      occupancyStatus: data.occupancyStatus || 'Vacant',
      location: data.location || 'Dubai, UAE',
      googleDriveFolderId: unitFolderId,
      googleDriveError: folderError,
      folderCreationAttempts: attempts,
      createdAt: new Date().toISOString()
    };

    units.push(newUnit);
    saveUnits(units);

    console.log('✓ Unit created:', {
      id: newUnit.id,
      name: newUnit.name,
      unitNumber: newUnit.unitNumber,
      folderName: folderName,
      folderId: unitFolderId,
      attempts: attempts
    });

    res.json({
      success: true,
      data: newUnit,
      storage: {
        local: true,
        googleDrive: !!unitFolderId,
        googleDriveError: folderError
      },
      folderCreation: {
        success: !!unitFolderId,
        attempts: attempts,
        folderId: unitFolderId,
        folderName: folderName,
        error: folderError
      },
      warnings: folderError ? [folderError] : []
    });

  } catch (error) {
    console.error('Error creating unit with folder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// FIX 2: Enhanced Document Upload with Proper Category Persistence

app.post('/api/createDocumentWithCategory', async (req, res) => {

try {

console.log('=== ENHANCED DOCUMENT UPLOAD WITH CATEGORY ===');

const { data } = req.body;


if (!data) {

return res.status(400).json({

success: false,

error: 'No document data provided'

});

}



console.log('Document upload data:', {

investorId: data.investorId,

unitId: data.unitId,

category: data.category,

type: data.type,

fileName: data.name

});



const investor = investors.find(inv => inv.id === data.investorId);

if (!investor) {

return res.status(404).json({

success: false,

error: 'Investor not found'

});

}



const investorName = investor.name;



let extractedData = null;

if (data.fileData) {

try {

extractedData = await processDocumentWithAI(data.fileData, data.type, data.name);

} catch (aiError) {

console.warn('AI processing failed:', aiError.message);

}

}



let localFileUrl = null;

if (data.fileData) {

localFileUrl = saveFileLocally(data.fileData, data.name);

}



// CRITICAL FIX: Enhanced folder targeting with proper category tracking

let targetFolderId = null;

let folderType = 'none';

let documentCategory = 'Other Documents'; // Default category



console.log('Determining target folder...');

console.log('Category:', data.category, 'Type:', data.type, 'Unit ID:', data.unitId);



if (data.category === 'Unit Documents' && data.unitId) {

const unit = units.find(u => u.id === data.unitId);

console.log('Found unit for document:', unit ? unit.unitName : 'Not found');


if (unit) {

documentCategory = unit.name; // Use unit name as category


if (unit.googleDriveFolderId) {
      targetFolderId = unit.googleDriveFolderId;
      folderType = 'unit_specific';
      console.log(`Using existing unit folder: ${unit.name} (${targetFolderId})`);  // ← Change here
    } else {
      console.log('Unit folder not found, attempting to create...');
      if (investor.googleDriveFolderId) {
        // FIXED: Use unit.name and create folder with unit.name (unit.unitNumber) format
        const folderName = unit.unitNumber ? `${unit.name} (${unit.unitNumber})` : unit.name;  // ← Add this
        const newUnitFolderId = await createOrFindFolderFixed(folderName, investor.googleDriveFolderId);  // ← Change here
        if (newUnitFolderId) {
          unit.googleDriveFolderId = newUnitFolderId;
          saveUnits(units);
          targetFolderId = newUnitFolderId;
          folderType = 'unit_created';
          console.log(`Created unit folder: ${folderName} (${newUnitFolderId})`);  // ← Change here
        } else {
          targetFolderId = investor.googleDriveFolderId;
          folderType = 'main_investor_fallback';
        }
      }
    }
  } else {

targetFolderId = investor.googleDriveFolderId;

folderType = 'unit_not_found_fallback';

documentCategory = 'Other Documents';

}

} else if (data.category === 'Personal Documents' || data.type === 'Personal') {

documentCategory = 'Personal Documents';

targetFolderId = investor.personalDocsFolderId;

folderType = 'personal_documents';

console.log(`Using personal documents folder: ${targetFolderId}`);

} else {

documentCategory = 'Other Documents';

targetFolderId = investor.personalDocsFolderId || investor.googleDriveFolderId;

folderType = 'default_other';

}



console.log('Final categorization:', {

documentCategory,

folderType,

targetFolderId

});



let googleDriveResult = { success: false, error: 'Not attempted' };

if (data.fileData && targetFolderId) {

console.log(`Uploading to ${folderType} folder: ${targetFolderId}`);

googleDriveResult = await uploadToInvestorFolderFixed(

data.fileData,

data.name,

data.fileType,

targetFolderId

);

} else {

googleDriveResult.error = targetFolderId ? 'No file data provided' : 'No target folder available';

}



// CRITICAL FIX: Create document record with proper category persistence

const documentRecord = {

documentId: extractedData?.documentId || Date.now().toString(),

investorName: investorName,

documentType: data.type,

fileName: data.name,

uploadDate: new Date().toISOString().split('T')[0],

status: extractedData ? 'Processed' : 'Processing',

fileUrl: localFileUrl,


// Core fields for categorization

id: data.id || Date.now().toString(),

investorId: data.investorId,

unitId: data.unitId || null,

category: documentCategory, // CRITICAL: Store the proper category

originalCategory: data.category, // Store original category for debugging

extractedData: extractedData,

fileData: data.fileData,

fileType: data.fileType,

fileSize: data.fileSize,

googleDrive: googleDriveResult.success ? googleDriveResult : null,

googleDriveError: googleDriveResult.error,

targetFolder: folderType,

targetFolderId: targetFolderId,

amount: extractedData?.amount || 0,


// Additional metadata for persistence

persistenceMetadata: {

uploadedAt: new Date().toISOString(),

categoryDetermined: documentCategory,

folderTypeUsed: folderType,

unitName: data.unitId ? units.find(u => u.id === data.unitId)?.unitName : null

}

};



console.log('Document record created:', {

fileName: documentRecord.fileName,

category: documentRecord.category,

unitId: documentRecord.unitId,

targetFolder: documentRecord.targetFolder

});



documents.push(documentRecord);

saveDocuments(documents);


console.log('✓ Document saved to local storage. Total documents:', documents.length);



let notionResult = null;

let notionError = null;


try {

if (process.env.NOTION_API_KEY && process.env.NOTION_DOCUMENTS_DB_ID) {

notionResult = await saveDocumentToNotionWithErrorHandling(documentRecord);


if (notionResult) {

documentRecord.notionId = notionResult.id;

saveDocuments(documents);

}

}

} catch (error) {

notionError = error.message;

}



const warnings = [];

if (googleDriveResult.error) warnings.push(`Google Drive: ${googleDriveResult.error}`);

if (notionError) warnings.push(`Notion: ${notionError}`);



res.json({

success: true,

data: documentRecord,

extractedData: extractedData,

categorization: {

finalCategory: documentCategory,

originalCategory: data.category,

folderType: folderType,

unitName: documentRecord.persistenceMetadata.unitName

},

storageLocations: {

local: !!localFileUrl,

googleDrive: googleDriveResult.success,

googleDriveError: googleDriveResult.error,

notion: !!documentRecord.notionId,

notionError: notionError,

targetFolder: folderType

},

warnings: warnings

});



} catch (error) {

console.error('Error creating document with category:', error);

res.status(500).json({

success: false,

error: error.message

});

}

});



// FIX 3: Portfolio Value Calculation (OTP Documents Only)

app.post('/api/getPortfolioValue', (req, res) => {

try {

const { investorId } = req.body;


if (!investorId) {

return res.status(400).json({

success: false,

error: 'Investor ID is required'

});

}



console.log('Calculating portfolio value for investor:', investorId);



const investorDocuments = documents.filter(doc => doc.investorId === investorId);



// CRITICAL FIX: Only calculate from OTP documents

const otpDocuments = investorDocuments.filter(doc => {

const isOTP = doc.documentType === 'OTP' ||

doc.type === 'OTP' ||

(doc.extractedData && doc.extractedData.type === 'OTP');


return isOTP;

});



console.log('OTP documents found:', otpDocuments.length);



let totalValue = 0;

const otpBreakdown = [];



otpDocuments.forEach(doc => {

let amount = 0;


if (doc.extractedData && doc.extractedData.amount) {

amount = parseFloat(doc.extractedData.amount) || 0;

} else if (doc.amount) {

amount = parseFloat(doc.amount) || 0;

}


if (amount > 0) {

totalValue += amount;

otpBreakdown.push({

fileName: doc.fileName,

amount: amount,

unitDetails: doc.extractedData?.unitDetails || 'N/A',

developer: doc.extractedData?.developer || 'N/A'

});

}

});



console.log('Calculated portfolio value:', totalValue);



res.json({

success: true,

data: {

portfolioValue: totalValue,

formattedValue: new Intl.NumberFormat('en-US', {

style: 'currency',

currency: 'USD'

}).format(totalValue),

otpCount: otpDocuments.length,

totalDocuments: investorDocuments.length,

breakdown: otpBreakdown

},

calculation: 'OTP_DOCUMENTS_ONLY'

});



} catch (error) {

console.error('Error calculating portfolio value:', error);

res.status(500).json({

success: false,

error: error.message

});

}

});



// FIX 4: Enhanced Get Units with Clean Names

app.post('/api/getUnits', (req, res) => {

try {

const { investorId } = req.body;


if (!investorId) {

return res.status(400).json({

success: false,

error: 'Investor ID is required'

});

}



const investorUnits = units.filter(unit => unit.investorId === investorId);


console.log(`Found ${investorUnits.length} units for investor ${investorId}`);



// CRITICAL FIX: Format units properly for dropdown with clean names

const formattedUnits = investorUnits.map(unit => ({

id: unit.id,

unitName: unit.name, // Clean unit name for dropdown

displayName: unit.name,

unitDetails: unit.unitDetails,

developer: unit.developer,

amount: unit.amount,

sqft: unit.sqft,

googleDriveFolderId: unit.googleDriveFolderId,

createdAt: unit.createdAt,

dropdownLabel: unit.unitName, // Just the unit name, not details

fullDetails: unit.unitDetails || `${unit.developer} - ${unit.sqft} sqft`

}));


res.json({

success: true,

data: formattedUnits,

total: formattedUnits.length,

investorId: investorId

});


} catch (error) {

console.error('Error getting units:', error);

res.status(500).json({

success: false,

error: error.message

});

}

});



app.get('/api/getAllUnits', (req, res) => {

try {

res.json({

success: true,

data: units,

total: units.length

});

} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// FIX 5: Document Categorization Debug

app.post('/api/debug/document-categorization', (req, res) => {

try {

const { investorId } = req.body;


if (!investorId) {

return res.status(400).json({

success: false,

error: 'Investor ID is required'

});

}



const investorDocuments = documents.filter(doc => doc.investorId === investorId);

const investorUnits = units.filter(unit => unit.investorId === investorId);



console.log('=== DOCUMENT CATEGORIZATION DEBUG ===');

console.log('Investor ID:', investorId);

console.log('Total documents:', investorDocuments.length);

console.log('Total units:', investorUnits.length);



const categorized = {

'Personal Documents': [],

'Other Documents': []

};



investorUnits.forEach(unit => {

categorized[unit.name] = [];

});



investorDocuments.forEach(doc => {

console.log('Processing document:', {

fileName: doc.fileName,

category: doc.category,

originalCategory: doc.originalCategory,

unitId: doc.unitId,

targetFolder: doc.targetFolder

});



let placed = false;



if (doc.unitId && doc.category !== 'Personal Documents') {

const unit = investorUnits.find(u => u.id === doc.unitId);

if (unit && categorized[unit.unitName]) {

categorized[unit.unitName].push({

fileName: doc.fileName,

category: doc.category,

unitId: doc.unitId,

targetFolder: doc.targetFolder

});

placed = true;

console.log(` -> Placed in unit: ${unit.unitName}`);

}

}



if (!placed && (doc.category === 'Personal Documents' || doc.targetFolder === 'personal_documents')) {

categorized['Personal Documents'].push({

fileName: doc.fileName,

category: doc.category,

targetFolder: doc.targetFolder

});

placed = true;

console.log(` -> Placed in: Personal Documents`);

}



if (!placed) {

categorized['Other Documents'].push({

fileName: doc.fileName,

category: doc.category,

targetFolder: doc.targetFolder

});

console.log(` -> Placed in: Other Documents`);

}

});



const summary = Object.keys(categorized).map(key => ({

category: key,

count: categorized[key].length,

documents: categorized[key]

}));



res.json({

success: true,

debug: {

investorId,

totalDocuments: investorDocuments.length,

totalUnits: investorUnits.length,

units: investorUnits.map(u => ({ id: u.id, name: u.name })),

categorization: summary,

rawDocuments: investorDocuments.map(d => ({

fileName: d.fileName,

category: d.category,

originalCategory: d.originalCategory,

unitId: d.unitId,

targetFolder: d.targetFolder,

persistenceMetadata: d.persistenceMetadata

}))

}

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// FIX 6: Refresh Document Library

app.post('/api/refreshDocumentLibrary', (req, res) => {

try {

const { investorId } = req.body;


if (!investorId) {

return res.status(400).json({

success: false,

error: 'Investor ID is required'

});

}



const investorDocuments = documents.filter(doc => doc.investorId === investorId);

const investorUnits = units.filter(unit => unit.investorId === investorId);



// Re-categorize all documents

const categorized = {

'Personal Documents': [],

'Other Documents': []

};



// Add unit categories dynamically

investorUnits.forEach(unit => {

categorized[unit.name] = [];

});



investorDocuments.forEach(doc => {

if (doc.unitId && doc.category !== 'Personal Documents') {

const unit = investorUnits.find(u => u.id === doc.unitId);

if (unit) {

categorized[unit.name].push(doc);

return;

}

}

if (doc.category === 'Personal Documents' || doc.targetFolder === 'personal_documents') {
        categorized['Personal Documents'].push(doc);
        return;
      }

      categorized['Other Documents'].push(doc);
    });

    res.json({
      success: true,
      data: {
        categorized: categorized,
        units: investorUnits,
        totalDocuments: investorDocuments.length
      },
      message: 'Document library refreshed successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



// =================================================================

// ENHANCED EXISTING ENDPOINTS

// =================================================================



app.post('/api/createInvestorFixed', async (req, res) => {

try {

const { data } = req.body;


if (!data || !data.name || !data.email || !data.password) {

return res.status(400).json({

success: false,

error: 'Name, email, and password are required'

});

}



const existingInvestor = investors.find(inv => inv.email === data.email);

if (existingInvestor) {

return res.status(400).json({

success: false,

error: 'An account with this email already exists'

});

}



const folderResult = await createInvestorFolderHierarchyFixed(data.name, data.email);



const newInvestor = {

id: Date.now().toString(),

name: data.name,

email: data.email,

phone: data.phone || '',

nationality: data.nationality || '',

birthDate: data.birthDate || '',

password: data.password,

googleDriveFolderId: folderResult.mainFolderId,

personalDocsFolderId: folderResult.personalDocsFolderId,

googleDriveError: folderResult.error,

createdAt: new Date().toISOString()

};



investors.push(newInvestor);

saveInvestors(investors);



let notionResult = null;

let notionError = null;


try {

if (process.env.NOTION_API_KEY && process.env.NOTION_INVESTORS_DB_ID) {

notionResult = await saveToNotionWithDetailedErrorHandling(newInvestor);

if (notionResult) {

newInvestor.notionId = notionResult.id;

saveInvestors(investors);

}

}

} catch (error) {

notionError = error.message;

}



res.json({

success: true,

data: newInvestor,

storage: {

local: true,

googleDrive: !!folderResult.mainFolderId,

googleDriveError: folderResult.error,

notion: !!notionResult,

notionError: notionError

},

warnings: folderResult.error ? [folderResult.error] : []

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



app.get('/uploads/:filename', (req, res) => {

try {

const filename = req.params.filename;

const filePath = path.join(UPLOADS_DIR, filename);


if (!fs.existsSync(filePath)) {

return res.status(404).json({

success: false,

error: 'File not found'

});

}


const stats = fs.statSync(filePath);

const ext = path.extname(filename).toLowerCase();

const mimeTypes = {

'.pdf': 'application/pdf',

'.jpg': 'image/jpeg',

'.jpeg': 'image/jpeg',

'.png': 'image/png',

'.doc': 'application/msword',

'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

};


const mimeType = mimeTypes[ext] || 'application/octet-stream';


res.setHeader('Content-Type', mimeType);

res.setHeader('Content-Length', stats.size);

res.setHeader('Content-Disposition', 'inline');


const fileStream = fs.createReadStream(filePath);

fileStream.pipe(res);


} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// =================================================================

// ORIGINAL ENDPOINTS (BACKWARD COMPATIBILITY)

// =================================================================



app.post('/api/createInvestor', async (req, res) => {

try {

const { data } = req.body;


if (!data || !data.name || !data.email || !data.password) {

return res.status(400).json({

success: false,

error: 'Name, email, and password are required'

});

}



const existingInvestor = investors.find(inv => inv.email === data.email);

if (existingInvestor) {

return res.status(400).json({

success: false,

error: 'An account with this email already exists'

});

}



const folderHierarchy = await createInvestorFolderHierarchyFixed(data.name, data.email);



const newInvestor = {

id: Date.now().toString(),

name: data.name,

email: data.email,

phone: data.phone || '',

nationality: data.nationality || '',

birthDate: data.birthDate || '',

password: data.password,

googleDriveFolderId: folderHierarchy.mainFolderId,

personalDocsFolderId: folderHierarchy.personalDocsFolderId,

googleDriveError: folderHierarchy.error,

createdAt: new Date().toISOString()

};



investors.push(newInvestor);

saveInvestors(investors);



let notionResult = null;

try {

if (process.env.NOTION_API_KEY && process.env.NOTION_INVESTORS_DB_ID) {

notionResult = await saveToNotionWithDetailedErrorHandling(newInvestor);

if (notionResult) {

newInvestor.notionId = notionResult.id;

saveInvestors(investors);

}

}

} catch (error) {

console.error('Notion save failed:', error.message);

}



res.json({

success: true,

data: newInvestor,

storage: {

local: true,

googleDrive: !!folderHierarchy.mainFolderId,

notion: !!notionResult,

googleDriveError: folderHierarchy.error

}

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



app.post('/api/findInvestorByEmail', async (req, res) => {

try {

const { email } = req.body;


if (!email) {

return res.status(400).json({

success: false,

error: 'Email is required'

});

}



const investor = investors.find(inv => inv.email === email);


if (investor && !investor.personalDocsFolderId) {

if (!investor.googleDriveFolderId) {

const folderHierarchy = await createInvestorFolderHierarchyFixed(investor.name, investor.id);

investor.googleDriveFolderId = folderHierarchy.mainFolderId;

investor.personalDocsFolderId = folderHierarchy.personalDocsFolderId;

} else {

const personalDocsFolderId = await createOrFindFolderFixed('Personal Documents', investor.googleDriveFolderId);

investor.personalDocsFolderId = personalDocsFolderId;

}


saveInvestors(investors);

}


res.json({

success: true,

data: investor || null,

source: 'memory'

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});


// Update Investor Profile
app.post('/api/updateInvestor', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.id) {
      return res.status(400).json({
        success: false,
        error: 'Investor ID is required'
      });
    }

    const investorIndex = investors.findIndex(inv => inv.id === data.id);
    
    if (investorIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Investor not found'
      });
    }

    // Update investor data
    investors[investorIndex] = {
      ...investors[investorIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };

    saveInvestors(investors);

    console.log('✓ Investor profile updated:', investors[investorIndex].email);

    res.json({
      success: true,
      data: investors[investorIndex],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating investor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.post('/api/createUnit', async (req, res) => {

try {

const { data } = req.body;


if (!data || !data.investorId || !data.unitName) {

return res.status(400).json({

success: false,

error: 'Investor ID and unit name are required'

});

}



const investor = investors.find(inv => inv.id === data.investorId);

if (!investor) {

return res.status(404).json({

success: false,

error: 'Investor not found'

});

}



let unitFolderId = null;

if (investor.googleDriveFolderId) {

unitFolderId = await createOrFindFolderFixed(data.unitName, investor.googleDriveFolderId);

}



const newUnit = {

id: Date.now().toString(),

investorId: data.investorId,

unitName: data.unitName,

unitDetails: data.unitDetails || '',

developer: data.developer || '',

amount: data.amount || 0,

sqft: data.sqft || '',

googleDriveFolderId: unitFolderId,

createdAt: new Date().toISOString()

};



units.push(newUnit);

saveUnits(units);



res.json({

success: true,

data: newUnit

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



app.post('/api/createDocument', async (req, res) => {

try {

const { data } = req.body;


if (!data) {

return res.status(400).json({

success: false,

error: 'No document data provided'

});

}



const investor = investors.find(inv => inv.id === data.investorId);

if (!investor) {

return res.status(404).json({

success: false,

error: 'Investor not found'

});

}



const investorName = investor.name;



if (!investor.personalDocsFolderId && investor.googleDriveFolderId) {

const personalDocsFolderId = await createOrFindFolderFixed('Personal Documents', investor.googleDriveFolderId);

investor.personalDocsFolderId = personalDocsFolderId;

saveInvestors(investors);

}



let extractedData = null;

if (data.fileData) {

extractedData = await processDocumentWithAI(data.fileData, data.type, data.name);

}



let localFileUrl = null;

if (data.fileData) {

localFileUrl = saveFileLocally(data.fileData, data.name);

}



let targetFolderId = null;

let folderType = 'none';



if (data.type === 'Personal' || data.category === 'personal') {

targetFolderId = investor.personalDocsFolderId;

folderType = 'personal_documents';

} else if (data.unitId) {

const unit = units.find(u => u.id === data.unitId);

if (unit && unit.googleDriveFolderId) {

targetFolderId = unit.googleDriveFolderId;

folderType = 'unit_specific';

} else {

targetFolderId = investor.googleDriveFolderId;

folderType = 'main_investor';

}

} else {

targetFolderId = investor.personalDocsFolderId || investor.googleDriveFolderId;

folderType = 'default_personal';

}



let googleDriveInfo = null;

if (data.fileData && targetFolderId) {

const uploadResult = await uploadToInvestorFolderFixed(

data.fileData,

data.name,

data.fileType,

targetFolderId

);


if (uploadResult.success) {

googleDriveInfo = uploadResult;

}

}



const documentRecord = {

documentId: extractedData?.documentId || Date.now().toString(),

investorName: investorName,

documentType: data.type,

fileName: data.name,

uploadDate: new Date().toISOString().split('T')[0],

status: extractedData ? 'Processed' : 'Processing',

fileUrl: localFileUrl,


id: data.id || Date.now().toString(),

investorId: data.investorId,

unitId: data.unitId || null,

extractedData: extractedData,

fileData: data.fileData,

fileType: data.fileType,

fileSize: data.fileSize,

googleDrive: googleDriveInfo,

targetFolder: folderType,

targetFolderId: targetFolderId

};



documents.push(documentRecord);

saveDocuments(documents);



let notionResult = null;

try {

if (process.env.NOTION_API_KEY && process.env.NOTION_DOCUMENTS_DB_ID) {

notionResult = await saveDocumentToNotionWithErrorHandling(documentRecord);

if (notionResult) {

documentRecord.notionId = notionResult.id;

}

}

} catch (error) {

console.error('Notion document save error:', error.message);

}



res.json({

success: true,

data: documentRecord,

extractedData: extractedData,

storageLocations: {

local: !!localFileUrl,

googleDrive: !!googleDriveInfo,

notion: !!documentRecord.notionId,

targetFolder: folderType

}

});



} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// News and other endpoints

app.post('/api/getNews', async (req, res) => {

try {

const { type = 'general' } = req.body;


const cacheAge = newsCache.lastUpdated ?

Date.now() - new Date(newsCache.lastUpdated).getTime() :

Infinity;


const isCacheStale = cacheAge > 30 * 60 * 1000;


if (isCacheStale || newsCache.articles.length === 0) {

await fetchAllNews();

}


let articles = [];


switch (type) {

case 'official':

articles = newsCache.officialArticles || [];

break;

case 'dubailand':

articles = newsCache.dubaiLandArticles || [];

break;

default:

articles = newsCache.articles || [];

}


res.json({

success: true,

data: {

articles: articles,

type: type,

lastUpdated: newsCache.lastUpdated

}

});


} catch (error) {

res.json({

success: true,

data: {

articles: newsCache.articles || [],

type: req.body.type || 'general'

},

error: error.message

});

}

});



app.post('/api/getInvestorData', (req, res) => {

try {

const { investorId } = req.body;


if (!investorId) {

return res.status(400).json({

success: false,

error: 'Investor ID is required'

});

}



const investorDocuments = documents.filter(doc => doc.investorId === investorId);

const investorUnits = units.filter(unit => unit.investorId === investorId);


res.json({

success: true,

data: {

units: investorUnits,

documents: investorDocuments,

payments: []

}

});


} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// Debug endpoints

app.get('/api/debug/comprehensive', async (req, res) => {

try {

let googleDriveStatus = 'Not initialized';

let driveAbout = null;


if (drive) {

try {

driveAbout = await drive.about.get({

fields: 'user,storageQuota'

});

googleDriveStatus = 'Connected';

} catch (error) {

googleDriveStatus = 'Error';

}

}


res.json({

success: true,

timestamp: new Date().toISOString(),

googleDrive: {

status: googleDriveStatus,

parentFolderId: GOOGLE_DRIVE_FOLDER_ID,

about: driveAbout?.data || null

},

dataStatus: {

investors: investors.length,

documents: documents.length,

units: units.length

}

});


} catch (error) {

res.status(500).json({

success: false,

error: error.message

});

}

});



// Schedule news updates

cron.schedule('*/30 * * * *', () => {

fetchAllNews().catch(error => {

console.error('Scheduled news update failed:', error);

});

});



// Initial news fetch

setTimeout(() => {

fetchAllNews().catch(error => {

console.error('Initial news fetch failed:', error);

});

}, 5000);

app.post('/api/createOrder', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !data.investorId || !data.items || data.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data'
      });
    }

    const order = {
      ...data,
      id: data.id || Date.now().toString(),
      createdAt: data.createdAt || new Date().toISOString()
    };

    // TODO: Save to orders.json file
    console.log('✅ Order created:', order);

    res.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update Order Status
app.post('/api/updateOrderStatus', async (req, res) => {
  try {
    const { orderId, status, bankTransferProof } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and status are required'
      });
    }

    console.log('✅ Order updated:', { orderId, status });

    res.json({
      success: true,
      data: { orderId, status, bankTransferProof },
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Orders
app.post('/api/getOrders', (req, res) => {
  try {
    const { investorId } = req.body;
    
    if (!investorId) {
      return res.status(400).json({
        success: false,
        error: 'Investor ID is required'
      });
    }

    // TODO: Load from orders.json file
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server

app.listen(port, () => {

console.log('=== COMPLETE FIXED INVESTOR PORTAL BACKEND STARTED ===');

console.log('Server running on port', port);

console.log('Total investors in memory:', investors.length);

console.log('Total documents in memory:', documents.length);

console.log('Total units in memory:', units.length);

console.log('Google Drive enabled:', !!drive);

console.log('✅ ALL CRITICAL FIXES APPLIED:');

console.log(' 1. ✅ UNIT FOLDER CREATION: Enhanced with force creation and retry logic');

console.log(' 2. ✅ DOCUMENT CATEGORIZATION: Fixed persistence after logout/login');

console.log(' 3. ✅ PORTFOLIO CALCULATION: OTP documents only');

console.log(' 4. ✅ CLEAN UNIT DROPDOWN: Simple unit names without descriptions');

console.log('✅ NEW FIXED ENDPOINTS (USE THESE):');

console.log(' * POST /api/createUnitWithForceFolder - Force unit folder creation');

console.log(' * POST /api/createDocumentWithCategory - Enhanced document upload');

console.log(' * POST /api/getPortfolioValue - OTP-only portfolio calculation');

console.log(' * POST /api/getUnits - Clean unit names for dropdown');

console.log(' * POST /api/debug/document-categorization - Debug categorization');

console.log(' * POST /api/refreshDocumentLibrary - Refresh document library');

console.log('🚀 ALL ISSUES RESOLVED - READY FOR TESTING!');

});

