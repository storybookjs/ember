import { StoryContext } from '@storybook/addons';
import { inferActionsFromArgTypesRegex, addActionsFromArgTypes } from './addArgsHelpers';

describe('actions parameter enhancers', () => {
  describe('actions.argTypesRegex parameter', () => {
    const parameters = { actions: { argTypesRegex: '^on.*' } };
    const argTypes = { onClick: {}, onFocus: {}, somethingElse: {} };

    it('should add actions that match a pattern', () => {
      const args = inferActionsFromArgTypesRegex(({
        args: {},
        argTypes,
        parameters,
      } as unknown) as StoryContext);
      expect(args).toEqual({
        onClick: expect.any(Function),
        onFocus: expect.any(Function),
      });
    });

    it('should NOT override pre-existing args', () => {
      const args = inferActionsFromArgTypesRegex(({
        args: { onClick: 'pre-existing value' },
        argTypes,
        parameters,
      } as unknown) as StoryContext);
      expect(args).toEqual({ onFocus: expect.any(Function) });
    });

    it('should NOT override pre-existing args, if null', () => {
      const args = inferActionsFromArgTypesRegex(({
        args: { onClick: null },
        argTypes,
        parameters,
      } as unknown) as StoryContext);
      expect(args).toEqual({ onFocus: expect.any(Function) });
    });

    it('should override pre-existing args, if undefined', () => {
      const args = inferActionsFromArgTypesRegex(({
        args: { onClick: undefined },
        argTypes,
        parameters,
      } as unknown) as StoryContext);
      expect(args).toEqual({ onClick: expect.any(Function), onFocus: expect.any(Function) });
    });

    it('should do nothing if actions are disabled', () => {
      const args = inferActionsFromArgTypesRegex(({
        args: {},
        argTypes,
        parameters: {
          ...parameters,
          actions: { ...parameters.actions, disable: true },
        },
      } as unknown) as StoryContext);
      expect(args).toEqual({});
    });
  });

  describe('argTypes.action parameter', () => {
    const argTypes = {
      onClick: { action: 'clicked!' },
      onBlur: { action: 'blurred!' },
    };
    it('should add actions based on action.args', () => {
      expect(
        addActionsFromArgTypes(({ args: {}, argTypes, parameters: {} } as unknown) as StoryContext)
      ).toEqual({
        onClick: expect.any(Function),
        onBlur: expect.any(Function),
      });
    });

    it('should NOT override pre-existing args', () => {
      expect(
        addActionsFromArgTypes(({
          argTypes: { onClick: { action: 'clicked!' } },
          args: { onClick: 'pre-existing value' },
          parameters: {},
        } as unknown) as StoryContext)
      ).toEqual({});
    });

    it('should NOT override pre-existing args, if null', () => {
      expect(
        addActionsFromArgTypes(({
          argTypes: { onClick: { action: 'clicked!' } },
          args: { onClick: null },
          parameters: {},
        } as unknown) as StoryContext)
      ).toEqual({});
    });

    it('should override pre-existing args, if undefined', () => {
      expect(
        addActionsFromArgTypes(({
          argTypes: { onClick: { action: 'clicked!' } },
          args: { onClick: undefined },
          parameters: {},
        } as unknown) as StoryContext)
      ).toEqual({ onClick: expect.any(Function) });
    });

    it('should do nothing if actions are disabled', () => {
      expect(
        addActionsFromArgTypes(({
          args: {},
          argTypes,
          parameters: { actions: { disable: true } },
        } as unknown) as StoryContext)
      ).toEqual({});
    });
  });
});
