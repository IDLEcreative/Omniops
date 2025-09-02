// Test action prompt generation
const { WooCommerceAIInstructions } = require('./lib/woocommerce-ai-instructions');

// Test different messages
const testMessages = [
  'samguy@thompsonsuk.com',
  'my email is samguy@thompsonsuk.com',
  'check my orders samguy@thompsonsuk.com'
];

console.log('=== Testing Action Prompt Generation ===\n');

testMessages.forEach(message => {
  console.log(`Message: "${message}"`);
  
  // When verification level is 'full' (customer verified)
  const actionPromptFull = WooCommerceAIInstructions.getActionPrompt(message, 'full');
  console.log('With full verification:', actionPromptFull || 'No action prompt');
  
  // When verification level is 'none' (not verified)
  const actionPromptNone = WooCommerceAIInstructions.getActionPrompt(message, 'none');
  console.log('With no verification:', actionPromptNone || 'No action prompt');
  
  console.log('---\n');
});