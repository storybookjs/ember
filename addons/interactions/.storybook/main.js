module.exports = {
  stories: ['../stories/', '../src/components/*/*.stories.tsx'],
  features: {
    previewCsfV3: true,
  },
  addons: ['../preset.js', '@storybook/addon-essentials'],
};
