export default async function handler(req, res) {
  console.log('=== TEST ENDPOINT CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.status(200).json({
    message: 'Test endpoint working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}
