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
    const path = req.url.replace('/api/upload', '');
    const targetUrl = `${backendUrl}${path}`;

    console.log(`Uploading file to ${req.method} ${path} -> ${targetUrl}`);

    // Prepare headers for the backend request
    const headers = {};

    // Copy all relevant headers from the original request
    Object.keys(req.headers).forEach(key => {
      if (key.toLowerCase() !== 'host') {
        headers[key] = req.headers[key];
      }
    });

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
    };

    // For file uploads, pass the body as-is
    if (req.body) {
      requestOptions.body = req.body;
    }

    console.log('Upload request options:', {
      method: requestOptions.method,
      headers: requestOptions.headers,
      bodyType: typeof requestOptions.body
    });

    // Forward the request to the backend
    const response = await fetch(targetUrl, requestOptions);
    
    console.log('Upload response status:', response.status);
    
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
    
    // Handle response
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Upload response data:', data);
      res.json(data);
    } else {
      const data = await response.text();
      console.log('Upload response text:', data);
      res.send(data);
    }
    
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
