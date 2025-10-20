export default async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || 'https://readle-pi.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Extract the path after /dictionary-api/ or /api/dictionary/
    // Input: /dictionary-api/api/v2/entries/en/{word} OR /api/dictionary/api/v2/entries/en/{word}
    // We want to construct: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
    let urlPath = req.url.split('?')[0]; // Remove query params if any
    
    // Remove the proxy prefix
    if (urlPath.includes('/dictionary-api/')) {
      urlPath = urlPath.replace('/dictionary-api/', '');
    } else if (urlPath.includes('/api/dictionary/')) {
      urlPath = urlPath.replace('/api/dictionary/', '');
    }
    
    const dictionaryApiUrl = `https://api.dictionaryapi.dev/${urlPath}`;

    console.log('Dictionary API request URL:', req.url);
    console.log('Extracted path:', urlPath);
    console.log('Fetching dictionary definition from:', dictionaryApiUrl);

    // Fetch from Dictionary API
    const response = await fetch(dictionaryApiUrl);

    if (!response.ok) {
      console.error('Dictionary API error:', response.status, response.statusText);
      res.status(response.status).json({ 
        error: 'Word not found',
        message: 'The requested word was not found in the dictionary'
      });
      return;
    }

    const data = await response.json();
    console.log('Dictionary API success');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from Dictionary API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

