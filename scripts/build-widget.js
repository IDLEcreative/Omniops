/**
 * Build Script for Standalone Widget
 *
 * This script bundles the chat widget into a single standalone JavaScript file
 * that can be loaded by embed.js without depending on Next.js or the application layout.
 *
 * Usage: node scripts/build-widget.js
 * Or: npm run build:widget
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function buildWidget() {
  const startTime = Date.now();
  console.log('\n🚀 Building standalone widget...\n');

  try {
    // Build the widget bundle
    const result = await esbuild.build({
      entryPoints: ['lib/widget-standalone.tsx'],
      bundle: true,
      minify: true,
      sourcemap: false,
      target: ['es2020', 'chrome91', 'firefox90', 'safari14'],
      format: 'iife',
      globalName: 'OmniopsWidgetBundle',
      outfile: 'public/widget-bundle.js',
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

    // Get bundle size
    const stats = fs.statSync('public/widget-bundle.js');
    const sizeInKB = (stats.size / 1024).toFixed(2);
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Widget bundle built successfully!\n');
    console.log(`📦 Bundle size: ${sizeInKB} KB`);
    console.log(`⏱️  Build time: ${buildTime}s`);
    console.log(`📍 Output: public/widget-bundle.js\n`);

    // Analyze bundle if requested
    if (process.argv.includes('--analyze')) {
      console.log('📊 Bundle analysis:\n');
      const analyzed = await esbuild.analyzeMetafile(result.metafile, {
        verbose: true,
      });
      console.log(analyzed);
    }

    // Create a test HTML file for local testing
    const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omniops Widget Test</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      text-align: center;
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; line-height: 1.6; }
    .status { margin-top: 2rem; padding: 1rem; background: #f0f9ff; border-radius: 0.5rem; color: #0369a1; }
  </style>
</head>
<body>
  <div class="content">
    <h1>🚀 Omniops Widget Test Page</h1>
    <p>This is a test page for the standalone Omniops chat widget.</p>
    <p>The widget should appear in the bottom-right corner with a pulse animation and green notification badge.</p>
    <div class="status">
      ✅ Widget Status: <span id="status">Loading...</span>
    </div>
  </div>

  <!-- Load the standalone widget bundle -->
  <script src="/widget-bundle.js"></script>

  <!-- Load the updated embed script -->
  <script src="/embed.js"></script>

  <script>
    // Widget should auto-initialize via embed.js
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'ready') {
        document.getElementById('status').textContent = 'Ready';
        console.log('✅ Widget initialized successfully');
      }
    });

    // Timeout check
    setTimeout(() => {
      const statusEl = document.getElementById('status');
      if (statusEl.textContent === 'Loading...') {
        statusEl.textContent = 'Initialization timeout';
        statusEl.parentElement.style.background = '#fee2e2';
        statusEl.parentElement.style.color = '#991b1b';
      }
    }, 5000);
  </script>
</body>
</html>`;

    fs.writeFileSync('public/widget-test.html', testHTML);
    console.log('📄 Test page created: public/widget-test.html');
    console.log('   View at: http://localhost:3000/widget-test.html\n');

  } catch (error) {
    console.error('\n❌ Build failed:\n');
    console.error(error);
    process.exit(1);
  }
}

// Run the build
buildWidget();
