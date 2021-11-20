module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-property-sort-order-smacss',
    'stylelint-plugin-stylus/standard',
  ],
  rules: {
    'declaration-colon-newline-after': null,
    'declaration-empty-line-before': 'never',
    'no-descending-specificity': null,
    'length-zero-no-unit': [true, {
      ignore: ['custom-properties'],
    }],
    'max-line-length': [120, {
      ignore: ['comments'],
    }],
    'selector-class-pattern': null,
    'string-quotes': 'single',
    'stylus/color-hex-case': 'upper',
    'stylus/declaration-colon': 'always',
    'stylus/indentation': 'tab',
    'stylus/no-at-require': null,
  },
};
