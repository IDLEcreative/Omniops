const fs = require('fs');
const path = require('path');

// Simple function to generate SVG avatars
function generateAvatar(initials, bgColor, fileName) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="${bgColor}" rx="64"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="42" font-family="system-ui, -apple-system, sans-serif" font-weight="600">${initials}</text>
</svg>`;
  
  return svg;
}

// Avatar configurations
const avatars = [
  { name: '01.svg', initials: 'JD', color: '#4F46E5' },
  { name: 'alice.svg', initials: 'AJ', color: '#EC4899' },
  { name: 'bob.svg', initials: 'BS', color: '#10B981' },
  { name: 'carlos.svg', initials: 'CR', color: '#F59E0B' },
];

// Ensure avatars directory exists
const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Generate each avatar
avatars.forEach(({ name, initials, color }) => {
  const svg = generateAvatar(initials, color, name);
  const filePath = path.join(avatarsDir, name);
  fs.writeFileSync(filePath, svg);
  console.log(`Created ${name}`);
});

// Also create PNG versions by copying SVG (browsers will handle SVG in img tags)
avatars.forEach(({ name, initials, color }) => {
  const svgName = name;
  const pngName = name.replace('.svg', '.png');
  const svg = generateAvatar(initials, color, pngName);
  
  // For PNG references, we'll use the same SVG content but with .png extension
  // This works because Next.js will serve the file regardless of extension
  if (pngName !== svgName) {
    const filePath = path.join(avatarsDir, pngName);
    fs.writeFileSync(filePath, svg);
    console.log(`Created ${pngName}`);
  }
});

// Also handle .jpg extensions for the conversations page
const jpgAvatars = ['alice.jpg', 'bob.jpg', 'carlos.jpg'];
jpgAvatars.forEach((name, index) => {
  const avatar = avatars[index + 1]; // Skip the first one (01.svg)
  if (avatar) {
    const svg = generateAvatar(avatar.initials, avatar.color, name);
    const filePath = path.join(avatarsDir, name);
    fs.writeFileSync(filePath, svg);
    console.log(`Created ${name}`);
  }
});

console.log('All avatars generated successfully!');