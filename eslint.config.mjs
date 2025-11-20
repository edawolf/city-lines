import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "scripts/**",
      "src/app/debug/**",
      "src/app/layout/**",
      "pixi-scaffold-particle-editor/**",
      "src/packages/pixi-particle-editor/**",
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // Allow unused vars that start with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Allow any types in non-production code
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty interfaces
      "@typescript-eslint/no-empty-interface": "warn",
      // Allow lexical declarations in case blocks
      "no-case-declarations": "warn",
    },
  },
);
