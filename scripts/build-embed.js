/**
 * Build Script for Embed Loader
 *
 * Bundles the TypeScript-based embed loader into public/embed.js,
 * keeping the production file minified and ready for CDN delivery.
 */

const esbuild = require('esbuild');

async function buildEmbed() {
  const start = Date.now();
  console.log('\n🧩 Building embed loader...\n');

  try {
    await esbuild.build({
      entryPoints: ['lib/embed/index.ts'],
      bundle: true,
      minify: true,
      sourcemap: false,
      format: 'iife',
      target: ['es2018'],
      outfile: 'public/embed.js',
      platform: 'browser',
      logLevel: 'info',
      treeShaking: true,
      legalComments: 'none',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ Embed loader built in ${duration}s (output: public/embed.js)\n`);
  } catch (error) {
    console.error('\n❌ Failed to build embed loader.\n');
    console.error(error);
    process.exit(1);
  }
}

buildEmbed();

