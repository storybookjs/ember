import { DecoratorFunction, LegacyStoryFn, StoryContext } from '@storybook/csf';
import { sanitizeStoryContextUpdate } from '@storybook/store';
import { computesTemplateFromComponent } from './angular-beta/ComputesTemplateFromComponent';

import { AngularFramework } from './types-6-0';

export default function decorateStory(
  mainStoryFn: LegacyStoryFn<AngularFramework>,
  decorators: DecoratorFunction<AngularFramework>[]
): LegacyStoryFn<AngularFramework> {
  const returnDecorators = [cleanArgsDecorator, ...decorators].reduce(
    (previousStoryFn: LegacyStoryFn<AngularFramework>, decorator) => (
      context: StoryContext<AngularFramework>
    ) => {
      const decoratedStory = decorator((update) => {
        return previousStoryFn({
          ...context,
          ...sanitizeStoryContextUpdate(update),
        });
      }, context);

      return decoratedStory;
    },
    (context) => prepareMain(mainStoryFn(context), context)
  );

  return returnDecorators;
}

const prepareMain = (
  story: AngularFramework['storyResult'],
  context: StoryContext<AngularFramework>
): AngularFramework['storyResult'] => {
  let { template } = story;

  const component = story.component ?? context.component;
  const userDefinedTemplate = !hasNoTemplate(template);

  if (!userDefinedTemplate && component) {
    template = computesTemplateFromComponent(component, story.props, '');
  }
  return {
    ...story,
    ...(template ? { template, userDefinedTemplate } : {}),
  };
};

function hasNoTemplate(template: string | null | undefined): template is undefined {
  return template === null || template === undefined;
}

const cleanArgsDecorator: DecoratorFunction<AngularFramework> = (storyFn, context) => {
  if (!context.argTypes || !context.args) {
    return storyFn();
  }

  const argsToClean = context.args;

  context.args = Object.entries(argsToClean).reduce((obj, [key, arg]) => {
    const argType = context.argTypes[key];

    // Only keeps args with a control or an action in argTypes
    if (argType.action || argType.control) {
      return { ...obj, [key]: arg };
    }
    return obj;
  }, {});

  return storyFn();
};
