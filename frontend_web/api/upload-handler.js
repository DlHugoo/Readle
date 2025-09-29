import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import FormData from 'form-data';
import fetch from 'node-fetch';

const pipelineAsync = promisify(pipeline);

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
    console.log('Upload handler called');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body);

    // Get the original path
    const path = req.url.replace('/api/upload-handler', '');
    const targetUrl = `${backendUrl}${path}`;

    // Create a new FormData for the backend request
    const formData = new FormData();

    // If we have a file in the request body, handle it
    if (req.body && typeof req.body === 'object') {
      // Handle different types of request bodies
      if (req.body.file) {
        // If it's already a file object
        formData.append('file', req.body.file);
      } else if (req.body.data) {
        // If it's base64 data
        const buffer = Buffer.from(req.body.data, 'base64');
        formData.append('file', buffer, {
          filename: req.body.filename || 'upload.jpg',
          contentType: req.body.contentType || 'image/jpeg'
        });
      } else {
        // Handle other form fields
        Object.keys(req.body).forEach(key => {
          if (key !== 'file' && key !== 'data') {
            formData.append(key, req.body[key]);
          }
        });
      }
    }

    // Prepare headers for the backend request
    const headers = {
      'Authorization': req.headers.authorization || '',
      ...formData.getHeaders()
    };

    console.log('Forwarding to backend:', targetUrl);
    console.log('Headers:', headers);

    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: formData
    });

    console.log('Backend response status:', response.status);

    // Set response status
    res.status(response.status);

    // Copy response headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Handle response
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const data = await response.text();
      res.send(data);
    }

  } catch (error) {
    console.error('Upload handler error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
}
