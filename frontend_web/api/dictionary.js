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
    // Extract the path after /api/dictionary/
    // Input: /api/dictionary/api/v2/entries/en/{word}
    // We want to construct: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
    const urlPath = req.url.split('?')[0]; // Remove query params if any
    const path = urlPath.replace('/api/dictionary/', '');
    const dictionaryApiUrl = `https://api.dictionaryapi.dev/${path}`;

    console.log('Dictionary API request URL:', req.url);
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

