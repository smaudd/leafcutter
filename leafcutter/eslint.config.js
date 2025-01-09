module.exports = [
  {
    files: ["**/*.js"], // Match JavaScript files
    ignores: ["node_modules/**"], // Ignore patterns
    languageOptions: {
      ecmaVersion: "latest", // Use the latest ECMAScript features
      sourceType: "module",
    },
    rules: {
      semi: ["off"], // Enforce semicolons
    },
  },
];
