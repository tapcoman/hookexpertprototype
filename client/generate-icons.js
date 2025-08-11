#!/usr/bin/env node

/**
 * Hook Line Studio - PWA Icon Generator
 * 
 * Generates all required PWA icons with a professional "HL" design
 * using the brand colors from the design system.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand colors from design-system.css
const colors = {
  hookNavy: '#1a2332',
  hookBlue: '#2563eb',
  flowCyan: '#06b6d4',
  connectPurple: '#7c3aed',
  flowIndigo: '#6366f1'
};

// Icon specifications
const iconSpecs = [
  { name: 'icon-192x192.png', size: 192, path: 'public/icons/' },
  { name: 'icon-512x512.png', size: 512, path: 'public/icons/' },
  { name: 'favicon-32x32.png', size: 32, path: 'public/' },
  { name: 'favicon-16x16.png', size: 16, path: 'public/' },
  { name: 'apple-touch-icon.png', size: 180, path: 'public/' }
];

/**
 * Creates SVG content for the icon
 */
function createIconSVG(size) {
  const fontSize = Math.floor(size * 0.45);
  const strokeWidth = Math.max(1, Math.floor(size * 0.02));
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${colors.hookBlue}"/>
          <stop offset="60%" style="stop-color:${colors.flowIndigo}"/>
          <stop offset="100%" style="stop-color:${colors.hookNavy}"/>
        </radialGradient>
        <radialGradient id="highlightGradient" cx="30%" cy="30%" r="60%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)"/>
          <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
        </radialGradient>
        <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="${Math.floor(size * 0.01)}" stdDeviation="${Math.floor(size * 0.02)}" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- Background gradient -->
      <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
      
      <!-- Highlight effect -->
      <rect width="${size}" height="${size}" fill="url(#highlightGradient)"/>
      
      <!-- HL Text -->
      <text x="50%" y="50%" 
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            fill="white" 
            stroke="rgba(255,255,255,0.1)" 
            stroke-width="${strokeWidth}"
            filter="url(#textShadow)">HL</text>
    </svg>
  `;
}

/**
 * Generates a single icon using Sharp
 */
async function generateIcon(size) {
  const svgContent = createIconSVG(size);
  const svgBuffer = Buffer.from(svgContent);
  
  return await sharp(svgBuffer)
    .resize(size, size)
    .png({
      quality: 100,
      compressionLevel: 6
    })
    .toBuffer();
}

/**
 * Ensures directory exists
 */
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Main generation function
 */
async function generateAllIcons() {
  console.log('🎨 Hook Line Studio - PWA Icon Generator');
  console.log('==========================================');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const spec of iconSpecs) {
    try {
      const fullPath = path.join(__dirname, spec.path, spec.name);
      
      // Ensure directory exists
      ensureDirectoryExists(fullPath);
      
      // Generate icon
      console.log(`Generating ${spec.name} (${spec.size}x${spec.size})...`);
      const buffer = await generateIcon(spec.size);
      
      // Write file
      fs.writeFileSync(fullPath, buffer);
      
      // Verify file was created and has content
      const stats = fs.statSync(fullPath);
      if (stats.size > 0) {
        console.log(`✅ Created ${spec.name} (${(stats.size / 1024).toFixed(1)}KB)`);
        successCount++;
      } else {
        throw new Error('Generated file is empty');
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate ${spec.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n==========================================');
  console.log(`✅ Successfully generated: ${successCount} icons`);
  if (errorCount > 0) {
    console.log(`❌ Failed to generate: ${errorCount} icons`);
  }
  console.log('🚀 PWA icons are ready!');
  
  // Show next steps
  console.log('\nNext steps:');
  console.log('1. Verify icons look good by opening them');
  console.log('2. Update your manifest.json if needed');
  console.log('3. Test PWA installation');
  
  return { successCount, errorCount };
}

// Run the generator
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllIcons().catch(console.error);
}

export { generateAllIcons, generateIcon };