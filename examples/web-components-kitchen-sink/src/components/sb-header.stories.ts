import { Meta, Story } from '@storybook/web-components';
import { html } from 'lit';

import './sb-header';
import type { SbHeader } from './sb-header';

export default {
  title: 'Example/Header',
  component: 'sb-header',
} as Meta;

interface SbHeaderProps extends SbHeader {
  onSbHeaderCreateAccount: (event: Event) => void;
  onSbHeaderLogin: (event: Event) => void;
  onSbHeaderLogout: (event: Event) => void;
}

const Template: Story<SbHeaderProps> = ({
  user,
  onSbHeaderCreateAccount,
  onSbHeaderLogin,
  onSbHeaderLogout,
}) => {
  return html`<sb-header
    @sb-header:createAccount=${onSbHeaderCreateAccount}
    @sb-header:login=${onSbHeaderLogin}
    @sb-header:logout=${onSbHeaderLogout}
    .user=${user}
  ></sb-header>`;
};

export const LoggedIn: Story<SbHeaderProps> = Template.bind({});
LoggedIn.args = {
  user: {},
};

export const LoggedOut: Story<SbHeaderProps> = Template.bind({});
LoggedOut.args = {};
