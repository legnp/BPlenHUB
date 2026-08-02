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
  // Scripts utilitarios de manutencao (`scripts/`) rodam direto no Node, fora do
  // bundle do Next, e sao legitimamente CommonJS. A proibicao de `require()` existe
  // para o codigo de aplicacao — aplicar aqui so obrigaria a reescrever script que
  // funciona. As demais regras (inclusive Zero-Any) seguem valendo nesta pasta.
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
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
    // `scratch_*` na raiz sao da mesma natureza (ver .gitignore).
    "scratch/**",
    "scratch_*",
  ]),
]);

export default eslintConfig;
