export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const backendUrl = 'http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000';
  
  try {
    // Get the original path from the request
    const path = req.url.replace('/api/proxy', '');
    const targetUrl = `${backendUrl}${path}`;

    console.log(`Proxying ${req.method} ${path} to ${targetUrl}`);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    // Prepare headers for the backend request
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      // Ensure body is properly formatted
      if (typeof req.body === 'string') {
        requestOptions.body = req.body;
      } else {
        requestOptions.body = JSON.stringify(req.body);
      }
    }

    console.log('Request options:', requestOptions);

    // Forward the request to the backend
    const response = await fetch(targetUrl, requestOptions);
    
    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    // Set response status
    res.status(response.status);
    
    // Copy important headers from backend response
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    const authHeader = response.headers.get('authorization');
    if (authHeader) {
      res.setHeader('Authorization', authHeader);
    }
    
    // Handle different content types
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Backend response data:', data);
      res.json(data);
    } else if (contentType && contentType.startsWith('image/')) {
      // Handle image responses
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      // Handle text responses
      const data = await response.text();
      console.log('Backend response text:', data);
      res.send(data);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
