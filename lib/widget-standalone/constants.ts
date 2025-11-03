/**
 * Widget Standalone Constants
 */

export const WIDGET_STYLES = `
  /* Tailwind Base - Reset */
  *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
  ::before, ::after { --tw-content: ''; }
  html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-feature-settings: normal; font-variation-settings: normal; }
  body { margin: 0; line-height: inherit; }

  /* Tailwind Utilities - Essential Classes */
  .fixed { position: fixed; }
  .absolute { position: absolute; }
  .relative { position: relative; }
  .inset-0 { inset: 0px; }
  .bottom-0 { bottom: 0px; }
  .right-0 { right: 0px; }
  .bottom-4 { bottom: 1rem; }
  .right-4 { right: 1rem; }
  .bottom-5 { bottom: 1.25rem; }
  .right-5 { right: 1.25rem; }
  .-top-1 { top: -0.25rem; }
  .-right-1 { right: -0.25rem; }
  .z-50 { z-index: 50; }
  .flex { display: flex; }
  .inline-block { display: inline-block; }
  .flex-1 { flex: 1 1 0%; }
  .flex-shrink-0 { flex-shrink: 0; }
  .items-center { align-items: center; }
  .items-end { align-items: flex-end; }
  .justify-start { justify-content: flex-start; }
  .justify-end { justify-content: flex-end; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: 0.25rem; }
  .gap-1\.5 { gap: 0.375rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-5 { gap: 1.25rem; }
  .space-y-5 > :not([hidden]) ~ :not([hidden]) { --tw-space-y-reverse: 0; margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse))); margin-bottom: calc(1.25rem * var(--tw-space-y-reverse)); }
  .overflow-hidden { overflow: hidden; }
  .overflow-visible { overflow: visible; }
  .overflow-y-auto { overflow-y: auto; }
  .overflow-x-hidden { overflow-x: hidden; }
  .overscroll-contain { overscroll-behavior: contain; }
  .rounded-full { border-radius: 9999px; }
  .rounded-2xl { border-radius: 1rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .rounded-tl-md { border-top-left-radius: 0.375rem; }
  .rounded-tr-md { border-top-right-radius: 0.375rem; }
  .border { border-width: 1px; }
  .border-2 { border-width: 2px; }
  .border-b { border-bottom-width: 1px; }
  .border-t { border-top-width: 1px; }
  .border-b-2 { border-bottom-width: 2px; }
  .border-t-2 { border-top-width: 2px; }
  .bg-transparent { background-color: transparent; }
  .bg-white { background-color: rgb(255 255 255); }
  .bg-black { background-color: rgb(0 0 0); }
  .bg-green-500 { background-color: rgb(34 197 94); }
  .bg-gray-600 { background-color: rgb(75 85 99); }
  .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
  .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
  .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
  .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
  .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
  .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
  .transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
  .transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
  .duration-200 { transition-duration: 200ms; }
  .duration-300 { transition-duration: 300ms; }
  .duration-3s { animation-duration: 3s; }
  .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
  .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-bounce { animation: bounce 1s infinite; }
  .animate-in { animation: enter 200ms ease-out; }
  .animate-out { animation: exit 200ms ease-in; }
  .fade-in { animation: fadeIn 200ms ease-out; }
  .slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }
  .slide-out-to-bottom-3 { animation: slideOutToBottom 200ms ease-in; }
  .fade-out { animation: fadeOut 200ms ease-in; }

  @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
  @keyframes enter { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInFromBottom { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideOutToBottom { from { transform: translateY(0); opacity: 1; } to { transform: translateY(12px); opacity: 0; } }
  @keyframes exit { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

  /* Dark theme widget colors */
  .bg-\\[\\#1F2937\\] { background-color: #1F2937; }
  .bg-\\[\\#27272a\\] { background-color: #27272a; }
  .bg-\\[\\#3f3f46\\] { background-color: #3f3f46; }
  .bg-\\[\\#262626\\] { background-color: #262626; }
  .bg-\\[\\#141414\\] { background-color: #141414; }
  .bg-\\[\\#1a1a1a\\] { background-color: #1a1a1a; }
  .bg-\\[\\#2a2a2a\\] { background-color: #2a2a2a; }
  .bg-\\[\\#3a3a3a\\] { background-color: #3a3a3a; }
  .bg-\\[\\#4a4a4a\\] { background-color: #4a4a4a; }
  .text-white { color: rgb(255 255 255); }
  .text-black { color: rgb(0 0 0); }
  .text-gray-100 { color: rgb(243 244 246); }
  .text-gray-200 { color: rgb(229 231 235); }
  .text-gray-300 { color: rgb(209 213 219); }
  .text-gray-400 { color: rgb(156 163 175); }
  .text-gray-500 { color: rgb(107 114 128); }
  .text-blue-300 { color: rgb(147 197 253); }
  .text-blue-400 { color: rgb(96 165 250); }
  .border-white { border-color: rgb(255 255 255); }
  .border-\\[\\#1a1a1a\\] { border-color: #1a1a1a; }
  .border-\\[\\#2a2a2a\\] { border-color: #2a2a2a; }
  .border-white\\/10 { border-color: rgb(255 255 255 / 0.1); }

  /* Gradient backgrounds */
  .bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
  .from-\\[\\#3a3a3a\\] { --tw-gradient-from: #3a3a3a; --tw-gradient-to: rgb(58 58 58 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .to-\\[\\#2a2a2a\\] { --tw-gradient-to: #2a2a2a; }
  .from-\\[\\#4a4a4a\\] { --tw-gradient-from: #4a4a4a; --tw-gradient-to: rgb(74 74 74 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .from-\\[\\#5a5a5a\\] { --tw-gradient-from: #5a5a5a; --tw-gradient-to: rgb(90 90 90 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
  .to-\\[\\#4a4a4a\\] { --tw-gradient-to: #4a4a4a; }

  /* Hover states */
  .hover\\:scale-105:hover { transform: scale(1.05); }
  .hover\\:scale-110:hover { transform: scale(1.1); }
  .hover\\:shadow-2xl:hover { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }
  .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
  .hover\\:bg-white:hover { background-color: rgb(255 255 255); }
  .hover\\:bg-gray-200:hover { background-color: rgb(229 231 235); }
  .hover\\:bg-\\[\\#1a1a1a\\]:hover { background-color: #1a1a1a; }
  .hover\\:bg-white\\/10:hover { background-color: rgb(255 255 255 / 0.1); }
  .hover\\:text-white:hover { color: rgb(255 255 255); }
  .hover\\:text-black:hover { color: rgb(0 0 0); }
  .hover\\:text-gray-300:hover { color: rgb(209 213 219); }
  .hover\\:from-\\[\\#5a5a5a\\]:hover { --tw-gradient-from: #5a5a5a; }
  .hover\\:to-\\[\\#4a4a4a\\]:hover { --tw-gradient-to: #4a4a4a; }

  /* Focus states */
  .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
  .focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.5); }

  /* Disabled states */
  .disabled\\:opacity-30:disabled { opacity: 0.3; }
  .disabled\\:bg-gray-600:disabled { background-color: rgb(75 85 99); }

  /* Responsive */
  @media (min-width: 640px) {
    .sm\\:bottom-5 { bottom: 1.25rem; }
    .sm\\:right-5 { right: 1.25rem; }
    .sm\\:w-\\[400px\\] { width: 400px; }
    .sm\\:h-\\[580px\\] { height: 580px; }
    .sm\\:max-h-\\[calc\\(100vh-40px\\)\\] { max-height: calc(100vh - 40px); }
    .sm\\:rounded-2xl { border-radius: 1rem; }
    .sm\\:px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .sm\\:px-4 { padding-left: 1rem; padding-right: 1rem; }
    .sm\\:w-14 { width: 3.5rem; }
    .sm\\:h-14 { height: 3.5rem; }
    .sm\\:h-6 { height: 1.5rem; }
    .sm\\:w-6 { width: 1.5rem; }
  }

  /* Utility classes */
  .w-full { width: 100%; }
  .h-full { height: 100%; }
  .w-12 { width: 3rem; }
  .h-12 { height: 3rem; }
  .w-10 { width: 2.5rem; }
  .h-10 { height: 2.5rem; }
  .w-8 { width: 2rem; }
  .h-8 { height: 2rem; }
  .w-5 { width: 1.25rem; }
  .h-5 { height: 1.25rem; }
  .w-4 { width: 1rem; }
  .h-4 { height: 1rem; }
  .w-3 { width: 0.75rem; }
  .h-3 { height: 0.75rem; }
  .w-2 { width: 0.5rem; }
  .h-2 { height: 0.5rem; }
  .max-w-\\[80\\%\\] { max-width: 80%; }
  .min-w-0 { min-width: 0px; }
  .min-h-0 { min-height: 0px; }
  .min-h-\\[100px\\] { min-height: 100px; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
  .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
  .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
  .p-5 { padding: 1.25rem; }
  .pt-2 { padding-top: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .ml-auto { margin-left: auto; }
  .mr-auto { margin-right: auto; }
  .text-xs { font-size: 0.75rem; line-height: 1rem; }
  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
  .text-base { font-size: 1rem; line-height: 1.5rem; }
  .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .text-center { text-align: center; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .leading-tight { line-height: 1.25; }
  .leading-normal { line-height: 1.5; }
  .leading-relaxed { line-height: 1.625; }
  .break-words { overflow-wrap: break-word; }
  .underline { text-decoration-line: underline; }
  .overflow-wrap-anywhere { overflow-wrap: anywhere; }
  .whitespace-pre-wrap { white-space: pre-wrap; }
  .resize-none { resize: none; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
  .opacity-75 { opacity: 0.75; }
  .opacity-90 { opacity: 0.9; }
  .focus\\:ring-white\\/50:focus { box-shadow: 0 0 0 3px rgb(255 255 255 / 0.5); }
  .focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }
  .focus\\:ring-offset-black:focus { --tw-ring-offset-color: #000; }
  .focus\\:border-yellow-400:focus { border-color: rgb(250 204 21); }
  .focus\\:ring-white\\/20:focus { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.2); }
  .placeholder\\:text-gray-300::placeholder { color: rgb(209 213 219); }
  .placeholder\\:text-gray-400::placeholder { color: rgb(156 163 175); }
  .aria-hidden\\:true[aria-hidden="true"] { display: none; }

  /* Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    .motion-reduce\\:animate-none { animation: none; }
  }

  /* Flex layout */
  .flex-col { flex-direction: column; }

  /* Animation for typing indicator */
  @keyframes typing-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-8px); }
  }
  .animate-typing-bounce { animation: typing-bounce 1.4s infinite; }
  .\\[animation-delay\\:0ms\\] { animation-delay: 0ms; }
  .\\[animation-delay\\:150ms\\] { animation-delay: 150ms; }
  .\\[animation-delay\\:200ms\\] { animation-delay: 200ms; }
  .\\[animation-delay\\:300ms\\] { animation-delay: 300ms; }
  .\\[animation-delay\\:400ms\\] { animation-delay: 400ms; }

  /* Group hover for button icons */
  .group:hover .group-hover\\:scale-110 { transform: scale(1.1); }
`;
