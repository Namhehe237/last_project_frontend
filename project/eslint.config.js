// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../eslint.config.js");

module.exports = tseslint.config(
  ...rootConfig,
  {
    files: ["**/*.ts"],
    rules: {
			"@angular-eslint/component-selector": "off",
			"@angular-eslint/prefer-signals": 'error'
    },
  },
  {
    files: ["**/*.html"],
    rules: {
			"@angular-eslint/template/label-has-associated-control": "off"
		},
  }
);
