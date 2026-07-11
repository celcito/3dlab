const https = require('https');
const data = JSON.stringify({
  contents: [{ parts: [{ text: "hi" }] }]
});
const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models/gemini-1.5-pro:generateContent',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});
req.write(data);
req.end();
