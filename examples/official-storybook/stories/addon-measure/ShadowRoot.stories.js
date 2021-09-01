import React from 'react';

import { ShadowRoot } from '../../components/addon-measure/ShadowRoot';

export default {
  title: 'Addons/Measure/ShadowRoot',
  component: ShadowRoot,
};

const Template = (args) => (
  <div
    style={{
      display: 'inline-block',
      padding: 64,
    }}
  >
    <ShadowRoot {...args} />
  </div>
);

export const Root = Template.bind({});

export const Nested = Template.bind({});
Nested.args = {
  drawMode: 'NESTED',
};
