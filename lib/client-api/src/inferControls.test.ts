import { StoryContext } from '@storybook/addons';
import { logger } from '@storybook/client-logger';
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
  describe('with custom matchers', () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
      warnSpy = jest.spyOn(logger, 'warn');
      warnSpy.mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should return color type when matching color', () => {
      // passing a string, should return control type color
      const inferredControls = inferControls(
        getStoryContext({
          argTypes: {
            background: {
              type: {
                name: 'string',
                value: 'red',
              },
              name: 'background',
            },
          },
          controls: {
            matchers: {
              color: /background/,
            },
          },
        })
      );

      expect(inferredControls.background.control.type).toEqual('color');
    });

    it('should return inferred type when matches color but arg is not a string', () => {
      // passing an object which is unsupported, should infer the type to object
      const inferredControls = inferControls(
        getStoryContext({
          argTypes: {
            background: {
              type: {
                name: 'object',
                value: {
                  rgb: [255, 255, 0],
                },
              },
              name: 'background',
            },
          },
          controls: {
            matchers: {
              color: /background/,
            },
          },
        })
      );

      expect(warnSpy).toHaveBeenCalled();
      expect(inferredControls.background.control.type).toEqual('object');
    });
  });

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
