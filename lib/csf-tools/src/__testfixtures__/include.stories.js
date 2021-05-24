export default {
  title: 'foo/bar/baz',
  includeStories: /^Include.*/,
};

const Template = (args) => {};

// excluded
export const SomeHelper = () => {};

export const IncludeA = () => {};

export const IncludeB = () => {};
IncludeB.storyName = 'Some story';

export const IncludeC = Template.bind({});
IncludeC.args = { x: 1 };
