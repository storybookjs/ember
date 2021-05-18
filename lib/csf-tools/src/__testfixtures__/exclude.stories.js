export default {
  title: 'foo/bar/baz',
  excludeStories: ['C', 'D'],
};

const Template = (args) => {};

export const A = () => {};

export const B = () => {};
B.storyName = 'Some story';

export const C = Template.bind({});
C.args = { x: 1 };

export const D = () => {};
