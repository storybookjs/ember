import React from 'react';
import { Meta, Story } from '@storybook/react';

type PropTypes = {};

export default {
  title: 'foo/bar/baz',
} as Meta<PropTypes>;

const Template: Story<PropTypes> = (args) => <>template</>;

export const A: Story<PropTypes> = () => <>A</>;

export const B = (args: any) => <>B</>;
B.storyName = 'Some story';

export const C = Template.bind({});
C.args = { x: 1 };
