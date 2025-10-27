import { ResponseParser } from './lib/chat/response-parser';

const aiResponse = `
Check out [our documentation](https://example.com/docs) and [click here](https://example.com/help).
Also see [Product Name](https://example.com/product).
`;

const parsed = ResponseParser.parseResponse('', aiResponse, 1);

console.log('Entities extracted:', parsed.entities.length);
parsed.entities.forEach((e, i) => {
  console.log(`  ${i + 1}. ${e.value} - ${e.metadata?.url}`);
});

console.log('\nExpected: 1 entity (Product Name)');
console.log(`Actual: ${parsed.entities.length} entities`);
console.log(`Test ${parsed.entities.length === 1 && parsed.entities[0].value === 'Product Name' ? 'PASS' : 'FAIL'}`);
