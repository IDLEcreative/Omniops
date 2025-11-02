/**
 * Build Script for Lazy-Loading Widget (Two-Stage)
 *
 * This script builds the widget with code splitting enabled:
 * - widget-bundle-loader.js: Minimal loader (<20 KB)
 * - widget-bundle-full.js: Full ChatWidget (loaded on-demand)
 *
 * Usage: node scripts/build-widget-lazy.js
 * Or: npm run build:widget:lazy
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildLazyWidget() {
  const startTime = Date.now();
  console.log('\n🚀 Building lazy-loading widget with code splitting...\n');

  try {
    // Clean previous builds
    const outputDir = 'public/widget-lazy';
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // Build the widget bundle with code splitting
    // Entry point is vanilla JS (no React), React is loaded dynamically
    const result = await esbuild.build({
      entryPoints: ['lib/widget-entry-vanilla.ts'],
      bundle: true,
      minify: true,
      sourcemap: false,
      target: ['es2020', 'chrome91', 'firefox90', 'safari14'],
      format: 'esm', // ESM required for code splitting
      splitting: true, // Enable code splitting
      chunkNames: 'chunks/[name]-[hash]',
      outdir: outputDir,
      platform: 'browser',
      jsx: 'automatic',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env.NEXT_PUBLIC_DEMO_DOMAIN': '"demo.example.com"',
      },
      external: [],
      treeShaking: true,
      legalComments: 'none',
      logLevel: 'info',
      metafile: true,
    });

    // Analyze bundle sizes
    const files = fs.readdirSync(outputDir);
    let totalSize = 0;
    const fileSizes = [];

    console.log('\n📦 Generated files:\n');

    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        fileSizes.push({ file, size: stats.size, sizeInKB });

        // Identify file type
        let label = '';
        if (file.includes('widget-entry-vanilla')) {
          label = ' ← Main entry (vanilla loader, no React)';
        } else if (file.includes('chunk')) {
          label = ' ← Lazy-loaded chunk';
        }

        console.log(`   ${file}: ${sizeInKB} KB${label}`);
      }
    }

    // Check for chunks directory
    const chunksDir = path.join(outputDir, 'chunks');
    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir);
      for (const chunk of chunks) {
        if (chunk.endsWith('.js')) {
          const filePath = path.join(chunksDir, chunk);
          const stats = fs.statSync(filePath);
          const sizeInKB = (stats.size / 1024).toFixed(2);
          totalSize += stats.size;
          fileSizes.push({ file: `chunks/${chunk}`, size: stats.size, sizeInKB });
          console.log(`   chunks/${chunk}: ${sizeInKB} KB ← Lazy-loaded chunk`);
        }
      }
    }

    const totalSizeInKB = (totalSize / 1024).toFixed(2);
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Lazy widget bundle built successfully!\n');
    console.log(`📊 Bundle Statistics:`);
    console.log(`   Total size: ${totalSizeInKB} KB (split into ${fileSizes.length} files)`);
    console.log(`   Build time: ${buildTime}s`);
    console.log(`   Output dir: ${outputDir}\n`);

    // Find the main entry file
    const mainFile = fileSizes.find(f => f.file.includes('widget-entry-vanilla'));
    if (mainFile) {
      console.log(`🎯 Initial Load Size: ${mainFile.sizeInKB} KB (downloaded immediately)`);
      console.log(`💤 Lazy Load Size: ${(totalSize - mainFile.size) / 1024} KB (loaded on-demand)\n`);

      // Calculate savings
      const originalSize = 213; // KB from widget-bundle.js
      const savings = ((originalSize - parseFloat(mainFile.sizeInKB)) / originalSize * 100).toFixed(1);
      console.log(`💰 Bandwidth Savings: ${savings}% for visitors who don't open chat\n`);
    }

    // Analyze bundle if requested
    if (process.argv.includes('--analyze')) {
      console.log('📊 Detailed bundle analysis:\n');
      const analyzed = await esbuild.analyzeMetafile(result.metafile, {
        verbose: true,
      });
      console.log(analyzed);
    }

    // Create wrapper script that uses ESM modules
    const wrapperScript = `/**
 * Lazy Widget Loader Wrapper (ESM)
 * This script loads the lazy widget bundle using ES modules
 */
import { initWidget } from './widget-entry-vanilla.js';

// Make it available globally for embed.js
if (typeof window !== 'undefined') {
  window.OmniopsWidget = { initWidget };
}

export { initWidget };
`;

    fs.writeFileSync(path.join(outputDir, 'loader.js'), wrapperScript);
    console.log('📄 ESM loader wrapper created: public/widget-lazy/loader.js\n');

  } catch (error) {
    console.error('\n❌ Build failed:\n');
    console.error(error);
    process.exit(1);
  }
}

// Run the build
buildLazyWidget();
