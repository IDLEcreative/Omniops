// Test gpt-5-mini-2025-08-07 with EXACT parameters from our code
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const data = JSON.stringify({
  model: 'gpt-5-mini-2025-08-07',
  reasoning_effort: 'low',
  max_completion_tokens: 2500,
  messages: [{ role: 'user', content: 'Say hello' }],
  tools: [],
  tool_choice: 'auto'
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

console.log('Testing with EXACT production parameters:');
console.log('- model: gpt-5-mini-2025-08-07');
console.log('- reasoning_effort: low');
console.log('- max_completion_tokens: 2500');
console.log('- tools: []');
console.log('- tool_choice: auto\n');

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('\nResponse:');
    try {
      const json = JSON.parse(body);

      if (json.error) {
        console.log('\n❌ ERROR:');
        console.log('Message:', json.error.message);
        console.log('Code:', json.error.code);
        console.log('Type:', json.error.type);
        if (json.error.param) console.log('Param:', json.error.param);
      } else if (json.choices) {
        console.log('\n✅ SUCCESS! Model works with these parameters!');
        console.log('Response:', json.choices[0].message.content);
      }

      console.log('\n\nFull JSON Response:');
      console.log(JSON.stringify(json, null, 2));
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
