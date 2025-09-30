// Add this test button to your DocumentsView component
const testScriptConnection = async () => {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test'
      })
    });

    const result = await response.json();
    console.log('Test result:', result);
    
    if (result.success) {
      alert('SUCCESS: Google Apps Script connected!\n' + result.message);
    } else {
      alert('FAILED: ' + result.error);
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    alert('Connection failed: ' + error.message);
  }
};

// Add this button to your UI for testing
<Button onClick={testScriptConnection}>Test Google Apps Script</Button>