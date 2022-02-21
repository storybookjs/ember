import global from 'global';
import addons, { HooksContext } from '@storybook/addons';
import {
  AnyFramework,
  ArgsEnhancer,
  SBObjectType,
  SBScalarType,
  StoryContext,
} from '@storybook/csf';
import { NO_TARGET_NAME } from '../args';
import { prepareStory } from './prepareStory';

jest.mock('global', () => ({
  ...(jest.requireActual('global') as any),
  FEATURES: {
    breakingChangesV7: true,
  },
}));

const id = 'id';
const name = 'name';
const title = 'title';
const render = (args: any) => {};

const stringType: SBScalarType = { name: 'string' };
const numberType: SBScalarType = { name: 'number' };
const booleanType: SBScalarType = { name: 'boolean' };
const complexType: SBObjectType = {
  name: 'object',
  value: {
    complex: {
      name: 'object',
      value: {
        object: {
          name: 'array',
          value: { name: 'string' },
        },
      },
    },
  },
};

beforeEach(() => {
  global.FEATURES = { breakingChangesV7: true };
});

describe('prepareStory', () => {
  describe('parameters', () => {
    it('are combined in the right order', () => {
      const { parameters } = prepareStory(
        { id, name, parameters: { a: 'story', nested: { z: 'story' } } },
        {
          id,
          title,
          parameters: {
            a: { name: 'component' },
            b: { name: 'component' },
            nested: { z: { name: 'component' }, y: { name: 'component' } },
          },
        },
        {
          render,
          parameters: {
            a: { name: 'global' },
            b: { name: 'global' },
            c: { name: 'global' },
            nested: { z: { name: 'global' }, x: { name: 'global' } },
          },
        }
      );

      expect(parameters).toEqual({
        __isArgsStory: true,
        a: 'story',
        b: { name: 'component' },
        c: { name: 'global' },
        nested: { z: 'story', y: { name: 'component' }, x: { name: 'global' } },
      });
    });

    it('sets a value even if metas do not have parameters', () => {
      const { parameters } = prepareStory({ id, name }, { id, title }, { render });

      expect(parameters).toEqual({ __isArgsStory: true });
    });

    it('does not set `__isArgsStory` if `passArgsFirst` is disabled', () => {
      const { parameters } = prepareStory(
        { id, name, parameters: { passArgsFirst: false } },
        { id, title },
        { render }
      );

      expect(parameters).toEqual({ passArgsFirst: false, __isArgsStory: false });
    });

    it('does not set `__isArgsStory` if `render` does not take args', () => {
      const { parameters } = prepareStory({ id, name }, { id, title }, { render: () => {} });

      expect(parameters).toEqual({ __isArgsStory: false });
    });
  });

  describe('args/initialArgs', () => {
    it('are combined in the right order', () => {
      const { initialArgs } = prepareStory(
        { id, name, args: { a: 'story', nested: { z: 'story' } } },
        {
          id,
          title,
          args: {
            a: 'component',
            b: 'component',
            nested: { z: 'component', y: 'component' },
          },
        },
        {
          render,
          args: {
            a: 'global',
            b: 'global',
            c: 'global',
            nested: { z: 'global', x: 'global' },
          },
        }
      );

      expect(initialArgs).toEqual({
        a: 'story',
        b: 'component',
        c: 'global',
        nested: { z: 'story' },
      });
    });

    it('can be overriden by `undefined`', () => {
      const { initialArgs } = prepareStory(
        { id, name, args: { a: undefined } },
        { id, title, args: { a: 'component' } },
        { render }
      );
      expect(initialArgs).toEqual({ a: undefined });
    });

    it('sets a value even if metas do not have args', () => {
      const { initialArgs } = prepareStory({ id, name }, { id, title }, { render });

      expect(initialArgs).toEqual({});
    });

    it('are initialized to argTypes[x].defaultValue if unset', () => {
      const { initialArgs } = prepareStory(
        {
          id,
          name,
          args: {
            arg2: 3,
            arg4: 'foo',
            arg7: false,
          },
          argTypes: {
            arg1: { name: 'arg1', type: stringType, defaultValue: 'arg1' },
            arg2: { name: 'arg2', type: numberType, defaultValue: 2 },
            arg3: {
              name: 'arg3',
              type: complexType,
              defaultValue: { complex: { object: ['type'] } },
            },
            arg4: { name: 'arg4', type: stringType },
            arg5: { name: 'arg5', type: stringType },
            arg6: { name: 'arg6', type: numberType, defaultValue: 0 }, // See https://github.com/storybookjs/storybook/issues/12767 }
          },
        },
        { id, title },
        { render: () => {} }
      );

      expect(initialArgs).toEqual({
        arg1: 'arg1',
        arg2: 3,
        arg3: { complex: { object: ['type'] } },
        arg4: 'foo',
        arg6: 0,
        arg7: false,
      });
    });

    describe('argsEnhancers', () => {
      it('are applied in the right order', () => {
        const run = [];
        const enhancerOne: ArgsEnhancer<AnyFramework> = () => {
          run.push(1);
          return {};
        };
        const enhancerTwo: ArgsEnhancer<AnyFramework> = () => {
          run.push(2);
          return {};
        };

        prepareStory(
          { id, name },
          { id, title },
          { render, argsEnhancers: [enhancerOne, enhancerTwo] }
        );

        expect(run).toEqual([1, 2]);
      });

      it('allow you to add args', () => {
        const enhancer = jest.fn(() => ({ c: 'd' }));

        const { initialArgs } = prepareStory(
          { id, name, args: { a: 'b' } },
          { id, title },
          { render, argsEnhancers: [enhancer] }
        );

        expect(enhancer).toHaveBeenCalledWith(expect.objectContaining({ initialArgs: { a: 'b' } }));
        expect(initialArgs).toEqual({ a: 'b', c: 'd' });
      });

      it('passes result of earlier enhancers into subsequent ones, and composes their output', () => {
        const enhancerOne = jest.fn(() => ({ b: 'B' }));
        const enhancerTwo = jest.fn(({ initialArgs }) =>
          Object.entries(initialArgs).reduce(
            (acc, [key, val]) => ({ ...acc, [key]: `enhanced ${val}` }),
            {}
          )
        );
        const enhancerThree = jest.fn(() => ({ c: 'C' }));

        const { initialArgs } = prepareStory(
          { id, name, args: { a: 'A' } },
          { id, title },
          { render, argsEnhancers: [enhancerOne, enhancerTwo, enhancerThree] }
        );

        expect(enhancerOne).toHaveBeenCalledWith(
          expect.objectContaining({ initialArgs: { a: 'A' } })
        );
        expect(enhancerTwo).toHaveBeenCalledWith(
          expect.objectContaining({ initialArgs: { a: 'A', b: 'B' } })
        );
        expect(enhancerThree).toHaveBeenCalledWith(
          expect.objectContaining({ initialArgs: { a: 'enhanced A', b: 'enhanced B' } })
        );
        expect(initialArgs).toEqual({
          a: 'enhanced A',
          b: 'enhanced B',
          c: 'C',
        });
      });
    });
  });

  describe('argTypes', () => {
    it('are combined in the right order', () => {
      const { argTypes } = prepareStory(
        {
          id,
          name,
          argTypes: {
            a: { name: 'a-story', type: booleanType },
            nested: { name: 'nested', type: booleanType, a: 'story' },
          },
        },
        {
          id,
          title,
          argTypes: {
            a: { name: 'a-component', type: stringType },
            b: { name: 'b-component', type: stringType },
            nested: { name: 'nested', type: booleanType, a: 'component', b: 'component' },
          },
        },
        {
          render,
          argTypes: {
            a: { name: 'a-global', type: numberType },
            b: { name: 'b-global', type: numberType },
            c: { name: 'c-global', type: numberType },
            nested: { name: 'nested', type: booleanType, a: 'global', b: 'global', c: 'global' },
          },
        }
      );

      expect(argTypes).toEqual({
        a: { name: 'a-story', type: booleanType },
        b: { name: 'b-component', type: stringType },
        c: { name: 'c-global', type: numberType },
        nested: { name: 'nested', type: booleanType, a: 'story', b: 'component', c: 'global' },
      });
    });
    describe('argTypesEnhancers', () => {
      it('allows you to alter argTypes when stories are added', () => {
        const enhancer = jest.fn((context) => ({ ...context.argTypes, c: { name: 'd' } }));
        const { argTypes } = prepareStory(
          { id, name, argTypes: { a: { name: 'b' } } },
          { id, title },
          { render, argTypesEnhancers: [enhancer] }
        );

        expect(enhancer).toHaveBeenCalledWith(
          expect.objectContaining({ argTypes: { a: { name: 'b' } } })
        );
        expect(argTypes).toEqual({ a: { name: 'b' }, c: { name: 'd' } });
      });

      it('does not merge argType enhancer results', () => {
        const enhancer = jest.fn(() => ({ c: { name: 'd' } }));
        const { argTypes } = prepareStory(
          { id, name, argTypes: { a: { name: 'b' } } },
          { id, title },
          { render, argTypesEnhancers: [enhancer] }
        );

        expect(enhancer).toHaveBeenCalledWith(
          expect.objectContaining({ argTypes: { a: { name: 'b' } } })
        );
        expect(argTypes).toEqual({ c: { name: 'd' } });
      });

      it('recursively passes argTypes to successive enhancers', () => {
        const firstEnhancer = jest.fn((context) => ({ ...context.argTypes, c: { name: 'd' } }));
        const secondEnhancer = jest.fn((context) => ({ ...context.argTypes, e: { name: 'f' } }));
        const { argTypes } = prepareStory(
          { id, name, argTypes: { a: { name: 'b' } } },
          { id, title },
          { render, argTypesEnhancers: [firstEnhancer, secondEnhancer] }
        );

        expect(firstEnhancer).toHaveBeenCalledWith(
          expect.objectContaining({ argTypes: { a: { name: 'b' } } })
        );
        expect(secondEnhancer).toHaveBeenCalledWith(
          expect.objectContaining({ argTypes: { a: { name: 'b' }, c: { name: 'd' } } })
        );
        expect(argTypes).toEqual({ a: { name: 'b' }, c: { name: 'd' }, e: { name: 'f' } });
      });
    });
  });

  describe('applyLoaders', () => {
    it('awaits the result of a loader', async () => {
      const loader = jest.fn(async () => new Promise((r) => setTimeout(() => r({ foo: 7 }), 100)));
      const { applyLoaders } = prepareStory(
        { id, name, loaders: [loader] },
        { id, title },
        { render }
      );

      const storyContext = { context: 'value' } as any;
      const loadedContext = await applyLoaders(storyContext);

      expect(loader).toHaveBeenCalledWith(storyContext);
      expect(loadedContext).toEqual({
        context: 'value',
        loaded: { foo: 7 },
      });
    });

    it('loaders are composed in the right order', async () => {
      const globalLoader = async () => ({ foo: 1, bar: 1, baz: 1 });
      const componentLoader = async () => ({ foo: 3, bar: 3 });
      const storyLoader = async () => ({ foo: 5 });

      const { applyLoaders } = prepareStory(
        { id, name, loaders: [storyLoader] },
        { id, title, loaders: [componentLoader] },
        { render, loaders: [globalLoader] }
      );

      const storyContext = { context: 'value' } as any;
      const loadedContext = await applyLoaders(storyContext);

      expect(loadedContext).toEqual({
        context: 'value',
        loaded: { foo: 5, bar: 3, baz: 1 },
      });
    });

    it('later loaders override earlier loaders', async () => {
      const loaders = [
        async () => new Promise((r) => setTimeout(() => r({ foo: 7 }), 100)),
        async () => new Promise((r) => setTimeout(() => r({ foo: 3 }), 50)),
      ];

      const { applyLoaders } = prepareStory({ id, name, loaders }, { id, title }, { render });

      const storyContext = { context: 'value' } as any;
      const loadedContext = await applyLoaders(storyContext);

      expect(loadedContext).toEqual({
        context: 'value',
        loaded: { foo: 3 },
      });
    });
  });

  describe('undecoratedStoryFn', () => {
    it('args are mapped by argTypes[x].mapping', () => {
      const renderMock = jest.fn();
      const story = prepareStory(
        {
          id,
          name,
          argTypes: {
            one: { name: 'one', type: { name: 'string' }, mapping: { 1: 'mapped' } },
            two: { name: 'two', type: { name: 'string' }, mapping: { 1: 'no match' } },
          },
          args: { one: 1, two: 2, three: 3 },
        },
        { id, title },
        { render: renderMock }
      );

      const context = { args: story.initialArgs, ...story };
      story.undecoratedStoryFn(context as any);
      expect(renderMock).toHaveBeenCalledWith(
        { one: 'mapped', two: 2, three: 3 },
        expect.objectContaining({ args: { one: 'mapped', two: 2, three: 3 } })
      );
    });

    it('passes args as the first argument to the story if `parameters.passArgsFirst` is true', () => {
      const renderMock = jest.fn();
      const firstStory = prepareStory(
        { id, name, args: { a: 1 }, parameters: { passArgsFirst: true } },
        { id, title },
        { render: renderMock }
      );

      firstStory.undecoratedStoryFn({ args: firstStory.initialArgs, ...firstStory } as any);
      expect(renderMock).toHaveBeenCalledWith(
        { a: 1 },
        expect.objectContaining({ args: { a: 1 } })
      );

      const secondStory = prepareStory(
        { id, name, args: { a: 1 }, parameters: { passArgsFirst: false } },
        { id, title },
        { render: renderMock }
      );

      secondStory.undecoratedStoryFn({ args: secondStory.initialArgs, ...secondStory } as any);
      expect(renderMock).toHaveBeenCalledWith(expect.objectContaining({ args: { a: 1 } }));
    });
  });

  describe('storyFn', () => {
    it('produces a story with inherited decorators applied', () => {
      const renderMock = jest.fn();
      const globalDecorator = jest.fn((s) => s());
      const componentDecorator = jest.fn((s) => s());
      const storyDecorator = jest.fn((s) => s());
      const story = prepareStory(
        {
          id,
          name,
          decorators: [storyDecorator],
        },
        { id, title, decorators: [componentDecorator] },
        { render: renderMock, decorators: [globalDecorator] }
      );

      addons.setChannel({ on: jest.fn(), removeListener: jest.fn() } as any);
      const hooks = new HooksContext();
      story.unboundStoryFn({ args: story.initialArgs, hooks, ...story } as any);

      expect(globalDecorator).toHaveBeenCalled();
      expect(componentDecorator).toHaveBeenCalled();
      expect(storyDecorator).toHaveBeenCalled();
      expect(renderMock).toHaveBeenCalled();

      hooks.clean();
    });
  });

  describe('with `FEATURES.argTypeTargetsV7`', () => {
    beforeEach(() => {
      global.FEATURES = { breakingChangesV7: true, argTypeTargetsV7: true };
    });
    it('filters out targeted args', () => {
      const renderMock = jest.fn();
      const firstStory = prepareStory(
        {
          id,
          name,
          args: { a: 1, b: 2 },
          argTypes: { b: { name: 'b', target: 'foo' } },
        },
        { id, title },
        { render: renderMock }
      );

      firstStory.unboundStoryFn({
        args: firstStory.initialArgs,
        hooks: new HooksContext(),
        ...firstStory,
      } as any);
      expect(renderMock).toHaveBeenCalledWith(
        { a: 1 },
        expect.objectContaining({ args: { a: 1 }, allArgs: { a: 1, b: 2 } })
      );
    });

    it('adds argsByTarget to context', () => {
      const renderMock = jest.fn();
      const firstStory = prepareStory(
        {
          id,
          name,
          args: { a: 1, b: 2 },
          argTypes: { b: { name: 'b', target: 'foo' } },
        },
        { id, title },
        { render: renderMock }
      );

      firstStory.unboundStoryFn({
        args: firstStory.initialArgs,
        hooks: new HooksContext(),
        ...firstStory,
      } as any);
      expect(renderMock).toHaveBeenCalledWith(
        { a: 1 },
        expect.objectContaining({ argsByTarget: { [NO_TARGET_NAME]: { a: 1 }, foo: { b: 2 } } })
      );
    });

    it('always sets args, even when all are targetted', () => {
      const renderMock = jest.fn();
      const firstStory = prepareStory(
        {
          id,
          name,
          args: { b: 2 },
          argTypes: { b: { name: 'b', target: 'foo' } },
        },
        { id, title },
        { render: renderMock }
      );

      firstStory.unboundStoryFn({
        args: firstStory.initialArgs,
        hooks: new HooksContext(),
        ...firstStory,
      } as any);
      expect(renderMock).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ argsByTarget: { foo: { b: 2 } } })
      );
    });

    it('always sets args, even when none are set for the story', () => {
      const renderMock = jest.fn();
      const firstStory = prepareStory(
        {
          id,
          name,
        },
        { id, title },
        { render: renderMock }
      );

      firstStory.unboundStoryFn({
        args: firstStory.initialArgs,
        hooks: new HooksContext(),
        ...firstStory,
      } as any);
      expect(renderMock).toHaveBeenCalledWith({}, expect.objectContaining({ argsByTarget: {} }));
    });
  });
});

describe('playFunction', () => {
  it('awaits play if defined', async () => {
    const inner = jest.fn();
    const play = jest.fn(async () => {
      await new Promise((r) => setTimeout(r, 0)); // Ensure this puts an async boundary in
      inner();
    });
    const { playFunction } = prepareStory({ id, name, play }, { id, title }, { render });

    await playFunction({} as StoryContext<AnyFramework>);
    expect(play).toHaveBeenCalled();
    expect(inner).toHaveBeenCalled();
  });
});
