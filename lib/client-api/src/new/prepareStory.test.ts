import addons, { HooksContext } from '@storybook/addons';
import { prepareStory } from './prepareStory';
import { ArgsEnhancer } from './types';

const id = 'id';
const name = 'name';
const title = 'title';
const render = (args: any) => {};

describe('prepareStory', () => {
  describe('parameters', () => {
    it('are combined in the right order', () => {
      const { parameters } = prepareStory(
        { id, name, parameters: { a: 'story', nested: { z: 'story' } } },
        {
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
      const { parameters } = prepareStory({ id, name }, { title }, { render });

      expect(parameters).toEqual({ __isArgsStory: true });
    });

    it('does not set `__isArgsStory` if `passArgsFirst` is disabled', () => {
      const { parameters } = prepareStory(
        { id, name, parameters: { passArgsFirst: false } },
        { title },
        { render }
      );

      expect(parameters).toEqual({ passArgsFirst: false, __isArgsStory: false });
    });

    it('does not set `__isArgsStory` if `render` does not take args', () => {
      const { parameters } = prepareStory({ id, name }, { title }, { render: () => {} });

      expect(parameters).toEqual({ __isArgsStory: false });
    });
  });

  describe('args/initialArgs', () => {
    it('are combined in the right order', () => {
      const { initialArgs } = prepareStory(
        { id, name, args: { a: 'story', nested: { z: 'story' } } },
        {
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
        nested: { z: 'story', y: 'component', x: 'global' },
      });
    });

    it('sets a value even if metas do not have args', () => {
      const { initialArgs } = prepareStory({ id, name }, { title }, { render });

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
            arg1: { defaultValue: 'arg1' },
            arg2: { defaultValue: 2 },
            arg3: { defaultValue: { complex: { object: ['type'] } } },
            arg4: {},
            arg5: {},
            arg6: { defaultValue: 0 }, // See https://github.com/storybookjs/storybook/issues/12767 }
          },
        },
        { title },
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
        const enhancerOne: ArgsEnhancer = () => {
          run.push(1);
          return {};
        };
        const enhancerTwo: ArgsEnhancer = () => {
          run.push(2);
          return {};
        };

        prepareStory(
          { id, name },
          { title },
          { render, argsEnhancers: [enhancerOne, enhancerTwo] }
        );

        expect(run).toEqual([1, 2]);
      });

      it('allow you to add args', () => {
        const enhancer = jest.fn(() => ({ c: 'd' }));

        const { initialArgs } = prepareStory(
          { id, name, args: { a: 'b' } },
          { title },
          { render, argsEnhancers: [enhancer] }
        );

        expect(enhancer).toHaveBeenCalledWith(expect.objectContaining({ initialArgs: { a: 'b' } }));
        expect(initialArgs).toEqual({ a: 'b', c: 'd' });
      });

      it('does not pass result of earlier enhancers into subsequent ones, but composes their output', () => {
        const enhancerOne = jest.fn(() => ({ c: 'd' }));
        const enhancerTwo = jest.fn(() => ({ e: 'f' }));

        const { initialArgs } = prepareStory(
          { id, name, args: { a: 'b' } },
          { title },
          { render, argsEnhancers: [enhancerOne, enhancerTwo] }
        );

        expect(enhancerOne).toHaveBeenCalledWith(
          expect.objectContaining({ initialArgs: { a: 'b' } })
        );
        expect(enhancerTwo).toHaveBeenCalledWith(
          expect.objectContaining({ initialArgs: { a: 'b' } })
        );
        expect(initialArgs).toEqual({ a: 'b', c: 'd', e: 'f' });
      });
    });
  });

  describe('argTypes', () => {
    it('are combined in the right order', () => {
      const { argTypes } = prepareStory(
        { id, name, argTypes: { a: { name: 'story' }, nested: { z: { name: 'story' } } } },
        {
          title,
          argTypes: {
            a: { name: 'component' },
            b: { name: 'component' },
            nested: { z: { name: 'component' }, y: { name: 'component' } },
          },
        },
        {
          render,
          argTypes: {
            a: { name: 'global' },
            b: { name: 'global' },
            c: { name: 'global' },
            nested: { z: { name: 'global' }, x: { name: 'global' } },
          },
        }
      );

      expect(argTypes).toEqual({
        a: { name: 'story' },
        b: { name: 'component' },
        c: { name: 'global' },
        nested: { z: { name: 'story' }, y: { name: 'component' }, x: { name: 'global' } },
      });
    });
    describe('argTypesEnhancers', () => {
      it('allows you to alter argTypes when stories are added', () => {
        const enhancer = jest.fn((context) => ({ ...context.argTypes, c: { name: 'd' } }));
        const { argTypes } = prepareStory(
          { id, name, argTypes: { a: { name: 'b' } } },
          { title },
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
          { title },
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
          { title },
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
      const { applyLoaders } = prepareStory({ id, name, loaders: [loader] }, { title }, { render });

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
        { title, loaders: [componentLoader] },
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

      const { applyLoaders } = prepareStory({ id, name, loaders }, { title }, { render });

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
            one: { mapping: { 1: 'mapped' } },
            two: { mapping: { 1: 'no match' } },
          },
          args: { one: 1, two: 2, three: 3 },
        },
        { title },
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
        { title },
        { render: renderMock }
      );

      firstStory.undecoratedStoryFn({ args: firstStory.initialArgs, ...firstStory } as any);
      expect(renderMock).toHaveBeenCalledWith(
        { a: 1 },
        expect.objectContaining({ args: { a: 1 } })
      );

      const secondStory = prepareStory(
        { id, name, args: { a: 1 }, parameters: { passArgsFirst: false } },
        { title },
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
        { title, decorators: [componentDecorator] },
        { render: renderMock, decorators: [globalDecorator] }
      );

      addons.setChannel({ on: jest.fn(), removeListener: jest.fn() } as any);
      const hooks = new HooksContext();
      story.storyFn({ args: story.initialArgs, hooks, ...story } as any);

      expect(globalDecorator).toHaveBeenCalled();
      expect(componentDecorator).toHaveBeenCalled();
      expect(storyDecorator).toHaveBeenCalled();
      expect(renderMock).toHaveBeenCalled();

      hooks.clean();
    });
  });

  describe('runPlayFunction', () => {
    it('awaits play if defined', async () => {
      const inner = jest.fn();
      const play = jest.fn(async () => {
        await new Promise((r) => setTimeout(r, 0)); // Ensure this puts an async boundary in
        inner();
      });
      const { runPlayFunction } = prepareStory({ id, name, play }, { title }, { render });

      await runPlayFunction();
      expect(play).toHaveBeenCalled();
      expect(inner).toHaveBeenCalled();
    });
  });
});
