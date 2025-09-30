require('dotenv').config();
const { google } = require('googleapis');

// The script will get this from your .env file
const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

// Check if credentials are loaded
if (!process.env.GOOGLE_DRIVE_CREDENTIALS) {
    console.error('❌ FAILED! GOOGLE_DRIVE_CREDENTIALS not found in .env file.');
    process.exit(1);
}
if (!PARENT_FOLDER_ID) {
    console.error('❌ FAILED! GOOGLE_DRIVE_PARENT_FOLDER_ID not found in .env file.');
    process.exit(1);
}

const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({
    credentials: {
        ...credentials,
        private_key: credentials.private_key.replace(/\\n/g, '\n'), // Important for env variables
    },
    scopes: SCOPES,
});

async function runTest() {
    console.log('Attempting to connect to Google Drive...');
    try {
        const drive = google.drive({ version: 'v3', auth });
        console.log(`Trying to access parent folder with ID: ${PARENT_FOLDER_ID}`);
        
        const response = await drive.files.get({
            fileId: PARENT_FOLDER_ID,
            // This field is crucial for checking permissions in Shared Drives
            fields: 'id, name, capabilities, parents', 
            supportsAllDrives: true,
        });
        
        console.log('\n✅ SUCCESS! Folder was found.');
        console.log('------------------------------------');
        console.log('Folder Name:', response.data.name);
        console.log('Folder ID:', response.data.id);
        console.log('Can Add Children (create subfolders)?', response.data.capabilities.canAddChildren);
        console.log('Parent Drive ID:', response.data.parents[0]);
        console.log('------------------------------------');

    } catch (error) {
        console.error('\n❌ FAILED! Could not access the folder.');
        console.error('------------------------------------');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.errors ? error.errors[0].message : error.message);
        console.error('------------------------------------');
        console.error('This confirms the issue is with permissions, the folder ID, or API access.');
    }
}

runTest();