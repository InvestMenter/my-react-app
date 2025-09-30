// Save this as convert-ids.js and run: node convert-ids.js

function convertNotionId(notionUrl) {
  // Extract ID from URL like: https://www.notion.so/26b33f8346fb80df81bbd25f21d541e3?v=26b33f8346fb808d9862000c9238961e
  const match = notionUrl.match(/\/([a-f0-9]{32})(\?|$)/i);
  if (!match) {
    console.log('❌ Could not extract ID from URL:', notionUrl);
    return null;
  }
  
  const id = match[1];
  // Convert to UUID format: 12345678-1234-1234-1234-123456789abc
  const formatted = [
    id.slice(0, 8),
    id.slice(8, 12),
    id.slice(12, 16), 
    id.slice(16, 20),
    id.slice(20, 32)
  ].join('-');
  
  console.log('✅ Converted:', formatted);
  return formatted;
}

// Replace these with your actual Notion database URLs:
console.log('=== CONVERT YOUR NOTION DATABASE IDs ===');
console.log();

console.log('Investors Database:');
convertNotionId('https://www.notion.so/26b33f8346fb80df81bbd25f21d541e3?v=26b33f8346fb808d9862000c9238961e');

console.log('\nUnits Database:');
convertNotionId('https://www.notion.so/27033f8346fb804d92e8d182e9fba639?v=27033f8346fb80eba15f000cde3afe1e');

console.log('\nDocuments Database:');
convertNotionId('https://www.notion.so/27033f8346fb8065ac23f33e63e69af8?v=27033f8346fb80e4ba06000c6f8ebf71');

console.log();
console.log('Copy the converted IDs above into your .env file!');