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
      The <code>a11y.element</code> parameter is set to the <strong>Insufficient contrast</strong>{' '}
      section.{' '}
    </p>

    <div id="no-text" style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
      <strong>No discernable button text</strong>
      <p>This a11y violation should not be reported, as this section is not scanned.</p>
      <BaseButton label="" />
    </div>
    <div id="insufficient-contrast" style={{ border: '1px solid gray', padding: '1rem' }}>
      <strong>Insufficient contrast</strong>
      <p>This a11y issue (incomplete) should be reported.</p>
      <BaseButton
        style={{ color: 'black', backgroundColor: 'black' }}
        label="Insufficient contrast"
      />
    </div>
  </>
);
ElementId.parameters = {
  a11y: {
    element: '#insufficient-contrast',
  },
};
