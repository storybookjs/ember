module.exports = {
  root: true,
  extends: ['@storybook/eslint-config-storybook', 'plugin:storybook/recommended'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'warn',
    'jest/no-standalone-expect': [
      'error',
      { additionalTestBlockFunctions: ['it.skipWindows', 'it.onWindows'] },
    ],
  },
  overrides: [
    {
      files: [
        '**/__tests__/**',
        'scripts/**',
        '**/__testfixtures__/**',
        '**/*.test.*',
        '**/*.stories.*',
        '**/storyshots/**/stories/**',
      ],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/__testfixtures__/**'],
      rules: {
        'react/forbid-prop-types': 'off',
        'react/no-unused-prop-types': 'off',
        'react/require-default-props': 'off',
      },
    },
    { files: '**/.storybook/config.js', rules: { 'global-require': 'off' } },
    { files: 'cypress/**', rules: { 'jest/expect-expect': 'off' } },
    {
      files: ['**/*.stories.*'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['**/*.tsx', '**/*.ts'],
      rules: {
        'react/require-default-props': 'off',
        'react/prop-types': 'off', // we should use types
        'react/forbid-prop-types': 'off', // we should use types
        'no-dupe-class-members': 'off', // this is called overloads in typescript
        'react/no-unused-prop-types': 'off', // we should use types
        'react/default-props-match-prop-types': 'off', // we should use types
        'import/no-named-as-default': 'warn',
        'import/no-named-as-default-member': 'warn',
        'react/destructuring-assignment': 'warn',

        // This warns about importing interfaces and types in a normal import, it's arguably better to import with the `type` prefix separate from the runtime imports,
        // I leave this as a warning right now because we haven't really decided yet, and the codebase is riddled with errors if I set to 'error'.
        // It IS set to 'error' for JS files.
        'import/named': 'warn',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'vars-on-top': 'off',
        'no-var': 'off', // this is how typescript works
        'spaced-comment': 'off',
      },
    },
    {
      files: ['**/mithril/**/*'],
      rules: {
        'react/no-unknown-property': 'off', // Need to deactivate otherwise eslint replaces some unknown properties with React ones
      },
    },
  ],
};
