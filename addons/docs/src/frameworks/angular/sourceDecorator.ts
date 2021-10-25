import { addons, useEffect } from '@storybook/addons';
import { PartialStoryFn } from '@storybook/csf';
import { StoryContext, AngularFramework } from '@storybook/angular';
import { computesTemplateSourceFromComponent } from '@storybook/angular/renderer';
import prettierHtml from 'prettier/parser-html';
import prettier from 'prettier/standalone';
import { SNIPPET_RENDERED, SourceType } from '../../shared';

export const skipSourceRender = (context: StoryContext) => {
  const sourceParams = context?.parameters.docs?.source;

  // always render if the user forces it
  if (sourceParams?.type === SourceType.DYNAMIC) {
    return false;
  }
  // never render if the user is forcing the block to render code, or
  // if the user provides code
  return sourceParams?.code || sourceParams?.type === SourceType.CODE;
};

const prettyUp = (source: string) => {
  return prettier.format(source, {
    parser: 'angular',
    plugins: [prettierHtml],
    htmlWhitespaceSensitivity: 'ignore',
  });
};

/**
 * Svelte source decorator.
 * @param storyFn Fn
 * @param context  StoryContext
 */
export const sourceDecorator = (
  storyFn: PartialStoryFn<AngularFramework>,
  context: StoryContext
) => {
  const story = storyFn();
  if (skipSourceRender(context)) {
    return story;
  }
  const channel = addons.getChannel();
  const { props, template, userDefinedTemplate } = story;

  const { component, argTypes } = context;

  let toEmit: string;
  useEffect(() => {
    if (toEmit) channel.emit(SNIPPET_RENDERED, context.id, prettyUp(template));
  });

  if (component && !userDefinedTemplate) {
    const source = computesTemplateSourceFromComponent(component, props, argTypes);

    // We might have a story with a Directive or Service defined as the component
    // In these cases there might exist a template, even if we aren't able to create source from component
    if (source || template) {
      toEmit = prettyUp(source || template);
    }
  } else if (template) {
    toEmit = prettyUp(template);
  }

  return story;
};
