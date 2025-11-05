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
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@supabase/supabase-js"],
              "message": "Import from @/lib/supabase/server (for service role) or @/lib/supabase/client (for browser) instead. Only import types with 'import type { SupabaseClient } from @supabase/supabase-js'."
            },
            {
              "group": ["@supabase/ssr"],
              "importNames": ["createServerClient", "createBrowserClient"],
              "message": "Import from @/lib/supabase/server (server-side), @/lib/supabase/client (client-side), or @/lib/supabase/middleware (middleware) instead."
            }
          ]
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "Literal[value=/thompsonseparts|cifa|hydraulic pump/i]",
          "message": "Do not use specific company/brand names or industry-specific product types in production code. Use generic terms like 'Brand A', 'Model-123', 'product', 'equipment' or make configurable via database. Tests in __tests__/ are exempt (see CLAUDE.md)."
        }
      ]
    }
  },
  {
    files: ["lib/supabase/**/*"],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["__tests__/**/*", "test-utils/**/*", "__mocks__/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
  {
    files: ["types/supabase.ts"],
    rules: {
      "no-restricted-imports": "off"
    }
  }
];

export default eslintConfig;
