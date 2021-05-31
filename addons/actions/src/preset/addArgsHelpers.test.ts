import { StoryContext } from '@storybook/addons';
import { inferActionsFromArgTypesRegex, addActionsFromArgTypes } from './addArgsHelpers';

describe('actions parameter enhancers', () => {
  describe('actions.argTypesRegex parameter', () => {
    const parameters = { actions: { argTypesRegex: '^on.*' } };
    const argTypes = { onClick: {}, onFocus: {}, somethingElse: {} };

    it('should add actions that match a pattern', () => {
      const args = inferActionsFromArgTypesRegex(({
        argTypes,
        parameters,
      } as unknown) as StoryContext);
      expect(args).toEqual({
        onClick: expect.any(Function),
        onFocus: expect.any(Function),
      });
    });

    it('should override pre-existing argTypes', () => {
      const args = inferActionsFromArgTypesRegex(({
        parameters,
        argTypes: {
          onClick: { defaultValue: 'pre-existing value' },
        },
      } as unknown) as StoryContext);
      expect(args).toEqual({
        onClick: expect.any(Function),
      });
    });

    it('should do nothing if actions are disabled', () => {
      const args = inferActionsFromArgTypesRegex(({
        parameters: {
          ...parameters,
          actions: { ...parameters.actions, disable: true },
        },
        argTypes,
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
        addActionsFromArgTypes(({ argTypes, parameters: {} } as unknown) as StoryContext)
      ).toEqual({
        onClick: expect.any(Function),
        onBlur: expect.any(Function),
      });
    });

    it('should do nothing if actions are disabled', () => {
      expect(
        addActionsFromArgTypes(({
          argTypes,
          parameters: { actions: { disable: true } },
        } as unknown) as StoryContext)
      ).toEqual({});
    });
  });
});
