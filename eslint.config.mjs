import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores - these patterns will be ignored in all configurations
  {
    ignores: [
      // Build outputs
      ".next/**/*",
      ".vercel/**/*",
      "dist/**/*",
      "build/**/*",
      "out/**/*",
      
      // Dependencies
      "node_modules/**/*",
      
      // Test coverage
      "coverage/**/*",
      
      // Config files
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "**/*.config.js",
      "config/**/*",
      "jest.setup.js",
      
      // Next.js generated files
      "next-env.d.ts",
      
      // Test and utility files in root
      "test-*.js",
      "test-*.ts",
      "verify-*.js",
      "verify-*.ts", 
      "check-*.js",
      "check-*.ts",
      "apply-*.js",
      "diagnose-*.js",
      "investigate*.js",
      "execute-*.js",
      "setup-*.js",
      "clean-*.ts",
      "edge-case-*.ts",
      "performance-*.ts",
      
      // Compiled JavaScript files in lib directory (TypeScript sources exist)
      "lib/*.js",

      // Temporary TypeScript compilation output
      ".tmp-ts/**/*",

      // Browser automation scripts (not part of main app)
      "browser-automation/**/*",
      
      // Directories
      "public/**/*",
      "docker/**/*",
      "supabase/**/*",
      "omniops-scraper/**/*",
      ".git/**/*",
      
      // Scripts directory
      "scripts/**/*",

      // Test samples directory (not part of production code)
      "test-samples/**/*",
      
      // Generated/temporary files
      "*.tmp",
      "*.temp",
      "*.log",
      ".env*",
      ".DS_Store"
    ]
  },
  // Next.js configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Custom rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "off"
    }
  }
];

export default eslintConfig;
