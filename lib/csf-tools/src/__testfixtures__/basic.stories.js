export default {
  title: 'foo/bar',
};

const Template = (args) => {};

export const A = () => {};

export const B = (args) => {};
B.storyName = 'Some story';

export const D = Template.bind({});
D.args = { x: 1 };
