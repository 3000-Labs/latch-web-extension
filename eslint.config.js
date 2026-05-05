const js = require("@eslint/js")
const tseslint = require("typescript-eslint")

module.exports = [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.plasmo/**", "**/build/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
]

