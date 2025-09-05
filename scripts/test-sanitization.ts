import { sanitizeOutboundLinks } from '../lib/link-sanitizer';

function runCase(name: string, message: string, domain: string) {
  const output = sanitizeOutboundLinks(message, domain);
  console.log(`\n[${name}]\nInput:  ${message}\nOutput: ${output}`);
  return output;
}

const domain = 'thompsonseparts.co.uk';

// Case 1: Markdown links (internal + external)
runCase(
  'Markdown links',
  'See our [KM602 kit](https://www.thompsonseparts.co.uk/product/complete-pin-bush-kit-to-fit-kinshofer-km602/) and the manufacturer page [Kinshofer KM602](https://www.kinshofer.com/km602).',
  domain
);

// Case 2: Bare URLs (internal + external)
runCase(
  'Bare URLs',
  'Internal: https://www.thompsonseparts.co.uk/kinshofer. External: https://kinshofer.com/parts.',
  domain
);

// Case 3: Mixed text where external should be stripped
runCase(
  'Mixed text',
  'For more info, visit https://kinshofer.com/ and our page https://thompsonseparts.co.uk/kinshofer-clamshell-buckets-spares/.',
  domain
);

