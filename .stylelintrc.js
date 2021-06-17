module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-property-sort-order-smacss',
    'stylelint-plugin-stylus/standard',
  ],
  rules: {
    'declaration-colon-newline-after': null,
    'declaration-empty-line-before': 'never',
    'function-calc-no-invalid': null,
    'no-descending-specificity': null,
    'stylus/color-hex-case': 'upper',
    'stylus/declaration-colon': 'always',
    'stylus/indentation': 'tab',
  },
};
