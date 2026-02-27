module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "pickleglass_web/**",
      "public/assets/**",
      "src/ui/assets/**",
    ],
  },
  {
    files: ["src/**/*.js", "build.js", "notarize.js", "preload.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
