import { html } from 'lit';
import { Story, Meta } from '@storybook/web-components';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

export default {
  title: 'Addons / Viewport',
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
  },
} as Meta;

const Template: Story<{ title: string }> = (args) => html`<h2>${args.title}</h2>`;

export const Default = Template.bind({});
Default.args = {
  title: 'Click on the viewports icon on toolbar to make the viewport change',
};

export const CustomViewports = Template.bind({});
CustomViewports.args = {
  title: 'I am using a custom viewport for Kindle Fire 2',
};
CustomViewports.parameters = {
  viewport: {
    viewports: {
      kindleFire2: {
        name: 'Kindle Fire 2',
        styles: {
          width: '600px',
          height: '963px',
        },
      },
    },
    defaultViewport: 'kindleFire2',
  },
};

export const Overriden = Template.bind({});
Overriden.args = {
  title: 'I have a different default viewport: ipad!',
};
Overriden.storyName = 'Overridden via "defaultViewport" parameter';
Overriden.parameters = {
  viewport: { defaultViewport: 'ipad' },
};

export const Disabled = Template.bind({});
Disabled.args = {
  title: 'I have disabled viewports addon',
};
Disabled.parameters = {
  viewport: { disable: true },
};
