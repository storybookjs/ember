export default {
  title: 'Core/Errors',
  parameters: { chromatic: { disable: true } },
};

export const ThrowsError = () => {
  throw new Error('foo');
};
ThrowsError.parameters = { storyshots: { disable: true } };

export const NullError = () => null;
