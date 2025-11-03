#!/usr/bin/env node
/**
 * Generate complete widget CSS using Tailwind CLI
 * This ensures 100% compatibility with the component styling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Generating complete widget CSS using Tailwind...\n');

// Create a temporary HTML file with ALL widget classes
const widgetClasses = `
<div class="fixed bottom-0 right-0 w-full h-full sm:bottom-5 sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-40px)] sm:right-5 sm:mx-0 bg-black border-2 border-white bg-[#1F2937] border rounded-lg shadow-lg flex flex-col overflow-hidden transition-all duration-200 z-50 animate-in slide-in-from-bottom-3 fade-in animate-out slide-out-to-bottom-3 fade-out">
  <div class="px-4 py-3 flex items-center justify-between border-b-2 border-white">
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <div class="min-w-0 flex-1">
        <h3 class="font-semibold text-white text-sm leading-tight">Support</h3>
        <p class="text-sm text-white opacity-90">We're here to help!</p>
      </div>
    </div>
    <div class="flex items-center gap-1">
      <button class="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50">
        <span class="h-4 w-4"></span>
      </button>
      <button class="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50">
        <span class="h-5 w-5"></span>
      </button>
    </div>
  </div>

  <div class="flex-1 min-h-0 px-2 sm:px-3 py-3 overflow-y-auto overflow-x-hidden overscroll-contain">
    <div class="flex items-center justify-center min-h-[100px]">
      <p class="text-white text-gray-300 text-base text-sm text-center">Hello!</p>
    </div>

    <div class="mb-3 flex justify-end justify-start animate-in slide-in-from-bottom-2 duration-300">
      <div class="max-w-[80%] ml-auto mr-auto">
        <div class="px-3 py-2.5 break-words overflow-wrap-anywhere text-lg text-base text-sm bg-[#3f3f46] text-white rounded-lg bg-[#27272a] text-gray-200 rounded-lg">
          <span class="leading-relaxed break-words whitespace-pre-wrap">
            <a class="text-blue-400 underline hover:text-blue-300 break-words">Link</a>
          </span>
        </div>
      </div>
    </div>

    <div class="mb-3 flex justify-start animate-in fade-in duration-300">
      <div class="max-w-[80%] mr-auto">
        <div class="px-3 py-2.5 inline-block bg-[#27272a] rounded-lg">
          <div class="flex gap-1.5 items-center">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="px-3 sm:px-4 py-3 border-t-2 border-white border-t border-white/10">
    <div class="flex gap-2 items-end">
      <textarea class="flex-1 px-4 py-2 resize-none overflow-hidden bg-black border-2 border-white text-white placeholder:text-gray-300 focus:border-yellow-400 rounded-2xl bg-[#262626] border-0 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-white/20 rounded-2xl focus:outline-none transition-all duration-200 leading-normal"></textarea>

      <button class="h-10 w-10 flex items-center justify-center rounded-full flex-shrink-0 text-white hover:bg-white hover:text-black border border-white text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50">
        <span class="h-4 w-4"></span>
      </button>

      <button class="h-10 w-10 flex items-center justify-center rounded-full flex-shrink-0 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 bg-gradient-to-br from-[#4a4a4a] to-[#3a3a3a] hover:from-[#5a5a5a] hover:to-[#4a4a4a] text-white disabled:opacity-30 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50">
        <span class="h-4 w-4"></span>
      </button>
    </div>
  </div>
</div>

<button class="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center animate-in fade-in group">
  <span class="absolute inset-0 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] opacity-75 animate-ping motion-reduce:animate-none" style="animation-duration: 3s;"></span>
  <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse motion-reduce:animate-none"></span>
  <span class="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform"></span>
</button>
`;

// Write temporary HTML
const tempHtml = path.join(__dirname, 'temp-widget.html');
fs.writeFileSync(tempHtml, widgetClasses);

try {
  // Use Tailwind CLI to process this HTML and generate CSS
  console.log('Running Tailwind CSS generation...');

  const css = execSync(
    `npx tailwindcss -i /dev/null --content "${tempHtml}" --minify`,
    { encoding: 'utf8', cwd: path.join(__dirname, '..') }
  );

  console.log(`✅ Generated ${css.length} bytes of CSS\n`);

  // Save the generated CSS
  const outputPath = path.join(__dirname, 'widget-tailwind-generated.css');
  fs.writeFileSync(outputPath, css);

  console.log(`📄 Saved to: ${outputPath}`);
  console.log('\nNext: Extract this CSS and add to constants.ts');

} catch (error) {
  console.error('❌ Error generating CSS:', error.message);
} finally {
  // Cleanup
  if (fs.existsSync(tempHtml)) {
    fs.unlinkSync(tempHtml);
  }
}
