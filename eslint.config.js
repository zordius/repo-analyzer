import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals,
      ecmaVersion: 2021,
      sourceType: "commonjs",
    },
  },
  pluginJs.configs.recommended,
];