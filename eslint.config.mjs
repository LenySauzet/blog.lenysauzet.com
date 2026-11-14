import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Tests stub next/image with <img>: the real one needs config Vitest does not load.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // Replaces eslint-config-next's ignores, so its defaults are restated.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A function expression handed to Playwright MCP, not a module.
    ".claude/skills/*/scripts/**",
  ]),
]);

export default eslintConfig;
