import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pngPath = path.join(__dirname, '../public/favicon.png');
const svgPath = path.join(__dirname, '../public/favicon.svg');
const b64 = fs.readFileSync(pngPath).toString('base64');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="PhotoLo">
  <defs>
    <clipPath id="round">
      <rect width="64" height="64" rx="14" ry="14" />
    </clipPath>
  </defs>
  <image
    href="data:image/png;base64,${b64}"
    width="64"
    height="64"
    clip-path="url(#round)"
    preserveAspectRatio="xMidYMid slice"
  />
</svg>
`;

fs.writeFileSync(svgPath, svg);
console.log('Updated', svgPath);
