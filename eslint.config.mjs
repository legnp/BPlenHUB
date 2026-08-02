import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Governanca BPlen: Politica Zero-Any
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Investigacao ad-hoc e descartavel (CLAUDE.md): nao versionada e fora do
    // padrao de producao — nao faz sentido aplicar as regras do produto nela.
    "scratch/**",
  ]),
]);

export default eslintConfig;
