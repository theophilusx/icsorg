import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      quotes: ["error", "double"],
    },
    ignores: ["node_modules/", "dist/", "build/"],
  },
];
