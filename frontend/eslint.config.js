export default [
  {
    files: ["**/*.js"], // Match JavaScript files
    ignores: ["node_modules/**"], // Ignore patterns
    languageOptions: {
      ecmaVersion: "latest", // Use the latest ECMAScript features
      sourceType: "module",
    },
    rules: {
      "no-console": "warn", // Example rule
      semi: ["error", "always"], // Enforce semicolons
    },
  },
];
