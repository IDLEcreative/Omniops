// Test if gpt-5-mini-2025-08-07 model works with our OpenAI API key
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const data = JSON.stringify({
  model: 'gpt-5-mini-2025-08-07',
  messages: [{ role: 'user', content: 'Say hello' }],
  max_tokens: 10
});

const options = {
  hostname: 'api.openai.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Length': data.length
  }
};

console.log('Testing model: gpt-5-mini-2025-08-07');
console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT FOUND');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('\nStatus Code:', res.statusCode);
    console.log('\nResponse:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));

      if (json.error) {
        console.log('\n❌ ERROR:', json.error.message);
        console.log('Error Code:', json.error.code);
        console.log('Error Type:', json.error.type);
      } else if (json.choices) {
        console.log('\n✅ SUCCESS! Model works!');
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
