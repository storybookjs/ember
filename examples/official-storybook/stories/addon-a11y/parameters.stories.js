import React from 'react';
import BaseButton from '../../components/BaseButton';

export default {
  title: 'Addons/A11y/Parameters',
  component: BaseButton,
  parameters: {
    options: { selectedPanel: 'storybook/a11y/panel' },
  },
};

export const ElementId = () => (
  <>
    <p>
      The a11y story <strong>element</strong> parameter is set to the invalid contrast div only{' '}
    </p>

    <div id="no-text" style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
      <h1>Missing text div</h1>
      <p>The a11y issue on alt text should not appear as this is not scanned</p>
      <BaseButton label="" />
    </div>
    <div id="invalid-contrast" style={{ border: '1px solid gray', padding: '1rem' }}>
      <h1>Invalid contrast div</h1>
      <p>The a11y issue on invalid contract should appear</p>
      <BaseButton style={{ color: 'black', backgroundColor: 'black' }} label="Invalid contrast" />
    </div>
  </>
);
ElementId.parameters = {
  a11y: {
    element: 'invalid-contrast',
  },
};
