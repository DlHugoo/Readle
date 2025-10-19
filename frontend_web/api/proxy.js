export default async function handler(req, res) {
  // Set CORS headers
  // Note: When using credentials, we can't use '*' for origin
  const origin = req.headers.origin || 'https://readle-pi.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

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

    console.log('=== VERCEL PROXY DEBUG START ===');
    console.log(`Proxying ${req.method} ${path} to ${targetUrl}`);
    console.log('Request body type:', typeof req.body);
    console.log('Request body length:', req.body ? JSON.stringify(req.body).length : 'NULL');
    console.log('Request headers:', req.headers);
    
    // Log specific upload request details
    if (path.includes('upload-image')) {
      console.log('=== UPLOAD REQUEST DEBUG ===');
      console.log('Content-Type:', req.headers['content-type']);
      console.log('Body keys:', req.body ? Object.keys(req.body) : 'NULL');
      if (req.body && req.body.file) {
        console.log('File base64 length:', req.body.file.length);
        console.log('File base64 preview:', req.body.file.substring(0, 50) + '...');
      }
      console.log('=== UPLOAD REQUEST DEBUG END ===');
    }

    // Prepare headers for the backend request
    const headers = {};

    // Copy relevant headers from the original request
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    } else {
      headers['Content-Type'] = 'application/json';
    }

    if (req.headers['accept']) {
      headers['Accept'] = req.headers['accept'];
    } else {
      headers['Accept'] = 'application/json';
    }

    // Add authorization header if present
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    
    // Forward cookies to backend
    if (req.headers.cookie) {
      headers.Cookie = req.headers.cookie;
    }

    // Prepare request options
    const requestOptions = {
      method: req.method,
      headers,
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.body) {
      // For file uploads, pass the body as-is
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        requestOptions.body = req.body;
      } else if (typeof req.body === 'string') {
        requestOptions.body = req.body;
      } else {
        requestOptions.body = JSON.stringify(req.body);
      }
    }

    console.log('Request options:', requestOptions);

    // Forward the request to the backend
    console.log('Sending request to backend with options:', {
      method: requestOptions.method,
      headers: requestOptions.headers,
      bodyLength: requestOptions.body ? requestOptions.body.length : 'NULL'
    });
    
    console.log('Target URL:', targetUrl);
    console.log('Request body preview:', requestOptions.body ? requestOptions.body.substring(0, 200) + '...' : 'NULL');
    
    const response = await fetch(targetUrl, requestOptions);
    
    console.log('=== BACKEND RESPONSE DEBUG ===');
    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (path.includes('upload-image')) {
      console.log('Upload response status:', response.status);
      console.log('Upload response ok:', response.ok);
    }
    
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
    
    // Forward Set-Cookie headers from backend
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Since Vercel is HTTPS and backend is HTTP, we need to rewrite the cookie to be secure
      // The backend might send Secure=false, but we need Secure=true for HTTPS
      let cookieValue = setCookieHeader;
      
      // If the backend cookie is not secure, make it secure for HTTPS
      if (!cookieValue.includes('Secure') || cookieValue.includes('Secure=false')) {
        cookieValue = cookieValue.replace(/Secure=false/gi, 'Secure');
        if (!cookieValue.includes('Secure')) {
          cookieValue += '; Secure';
        }
      }
      
      // Change SameSite=Lax to SameSite=None for cross-origin if needed
      if (cookieValue.includes('SameSite=Lax')) {
        cookieValue = cookieValue.replace('SameSite=Lax', 'SameSite=None');
      }
      
      res.setHeader('Set-Cookie', cookieValue);
      console.log('Forwarding cookie:', cookieValue);
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
    console.error('=== PROXY ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== PROXY ERROR END ===');
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      type: error.name
    });
  }
}
