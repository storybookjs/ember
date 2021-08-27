module.exports = {
  stories: ['../stories/', '../src/components/**/*.stories.tsx'],
  features: {
    previewCsfV3: true,
  },
  addons: ['@storybook/addon-essentials', '../preset.js'],
};
