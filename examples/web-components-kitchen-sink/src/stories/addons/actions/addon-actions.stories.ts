import { html } from 'lit';
import { Story, Meta } from '@storybook/web-components';

export default {
  title: 'Addons / Actions',
} as Meta;

const Template: Story = () => html`<button>Click Me!</button>`;

export const Story1 = Template.bind({});
Story1.storyName = 'Simple `click` handler';
Story1.parameters = {
  actions: {
    handles: ['click'],
  },
};

export const Story2 = Template.bind({});
Story2.storyName = 'Multiple actions';
Story2.parameters = {
  actions: {
    handles: ['click', 'contextmenu'],
  },
};

export const Story3 = Template.bind({});
Story3.storyName = 'Multiple actions + config';

Story3.parameters = {
  actions: {
    handles: ['click', 'contextmenu', { clearOnStoryChange: false }],
  },
};

export const Story4 = Template.bind({});
Story4.storyName = 'Multiple actions, object';

Story4.parameters = {
  actions: {
    handles: [{ click: 'clicked', contextmenu: 'right clicked' }],
  },
};

export const Story5 = () => html`
  <div>Clicks on this button will be logged: <button class="btn" type="button">Button</button></div>
`;
Story5.storyName = 'Multiple actions, selector';

Story5.parameters = {
  actions: {
    handles: [{ 'click .btn': 'clicked', contextmenu: 'right clicked' }],
  },
};

export const Story6 = Template.bind({});
Story6.storyName = 'Multiple actions, object + config';

Story6.parameters = {
  actions: {
    handles: [{ click: 'clicked', contextmenu: 'right clicked' }, { clearOnStoryChange: false }],
  },
};
