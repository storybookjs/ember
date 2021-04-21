import { StoryContext } from '@storybook/addons';
import { inferControls } from './inferControls';

const getStoryContext = (customParams = {}): StoryContext => ({
  id: '',
  kind: '',
  name: '',
  args: {},
  globals: {},
  argTypes: {},
  parameters: {
    argTypes: {
      label: { control: 'text' },
      labelName: { control: 'text' },
      borderWidth: { control: { type: 'number', min: 0, max: 10 } },
    },
    __isArgsStory: true,
    ...customParams,
  },
});

describe('inferControls', () => {
  it('should return argTypes as is when no exclude or include is passed', () => {
    const controls = inferControls(getStoryContext());
    expect(Object.keys(controls)).toEqual(['label', 'labelName', 'borderWidth']);
  });

  it('should return filtered argTypes when include is passed', () => {
    const [includeString, includeArray, includeRegex] = [
      inferControls(getStoryContext({ controls: { include: 'label' } })),
      inferControls(getStoryContext({ controls: { include: ['label'] } })),
      inferControls(getStoryContext({ controls: { include: /label*/ } })),
    ];

    expect(Object.keys(includeString)).toEqual(['label', 'labelName']);
    expect(Object.keys(includeArray)).toEqual(['label']);
    expect(Object.keys(includeRegex)).toEqual(['label', 'labelName']);
  });

  it('should return filtered argTypes when exclude is passed', () => {
    const [excludeString, excludeArray, excludeRegex] = [
      inferControls(getStoryContext({ controls: { exclude: 'label' } })),
      inferControls(getStoryContext({ controls: { exclude: ['label'] } })),
      inferControls(getStoryContext({ controls: { exclude: /label*/ } })),
    ];

    expect(Object.keys(excludeString)).toEqual(['borderWidth']);
    expect(Object.keys(excludeArray)).toEqual(['labelName', 'borderWidth']);
    expect(Object.keys(excludeRegex)).toEqual(['borderWidth']);
  });
});
