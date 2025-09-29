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

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
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
      requestOptions.body = JSON.stringify(req.body);
    }

    // Forward the request to the backend
    const response = await fetch(targetUrl, requestOptions);
    
    // Get response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Forward the response with proper status and headers
    res.status(response.status);
    
    // Copy important headers from backend response
    const authHeader = response.headers.get('authorization');
    if (authHeader) {
      res.setHeader('Authorization', authHeader);
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
