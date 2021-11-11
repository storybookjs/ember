import React from 'react';

const Component = (props: Record<string, number>) => <pre>{JSON.stringify(props)}</pre>;

export default {
  component: Component,
  argTypes: {
    a: { target: 'somewhere' },
  },
  parameters: {
    argTypeTarget: true,
  },
};

export const StoryOne = {
  args: {
    a: 1,
    b: 2,
    c: 3,
  },
};

export const StoryTwo = {
  args: {
    a: 1,
    b: 2,
    c: 3,
  },
  argTypes: {
    c: { target: 'somewhere' },
  },
};
