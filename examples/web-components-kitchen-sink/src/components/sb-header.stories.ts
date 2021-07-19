import { Meta, Story } from '@storybook/web-components';
import { html } from 'lit';

import './sb-header';
import type { SbHeader } from './sb-header';

export default {
  title: 'Example/Header',
  component: 'sb-header',
} as Meta;

const Template: Story<SbHeader> = ({ user }) => html`<sb-header .user="${user}"></sb-header>`;

export const LoggedIn: Story<SbHeader> = Template.bind({});
LoggedIn.args = {
  user: {},
};

export const LoggedOut: Story<SbHeader> = Template.bind({});
LoggedOut.args = {};
