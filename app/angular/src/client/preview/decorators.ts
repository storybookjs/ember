/* eslint-disable no-param-reassign */
import { Type } from '@angular/core';
import { DecoratorFunction, StoryContext } from '@storybook/csf';
import { computesTemplateFromComponent } from './angular-beta/ComputesTemplateFromComponent';
import { isComponent } from './angular-beta/utils/NgComponentAnalyzer';
import { ICollection, NgModuleMetadata } from './types';
import { AngularFramework } from './types-6-0';

export const moduleMetadata = (
  metadata: Partial<NgModuleMetadata>
): DecoratorFunction<AngularFramework> => (storyFn) => {
  const story = storyFn();
  const storyMetadata = story.moduleMetadata || {};
  metadata = metadata || {};

  return {
    ...story,
    moduleMetadata: {
      declarations: [...(metadata.declarations || []), ...(storyMetadata.declarations || [])],
      entryComponents: [
        ...(metadata.entryComponents || []),
        ...(storyMetadata.entryComponents || []),
      ],
      imports: [...(metadata.imports || []), ...(storyMetadata.imports || [])],
      schemas: [...(metadata.schemas || []), ...(storyMetadata.schemas || [])],
      providers: [...(metadata.providers || []), ...(storyMetadata.providers || [])],
    },
  };
};

export const componentWrapperDecorator = (
  element: Type<unknown> | ((story: string) => string),
  props?: ICollection | ((storyContext: StoryContext<AngularFramework>) => ICollection)
): DecoratorFunction<AngularFramework> => (storyFn, storyContext) => {
  const story = storyFn();
  const currentProps = typeof props === 'function' ? (props(storyContext) as ICollection) : props;

  const template = isComponent(element)
    ? computesTemplateFromComponent(element, currentProps ?? {}, story.template)
    : element(story.template);

  return {
    ...story,
    template,
    ...(currentProps || story.props
      ? {
          props: {
            ...currentProps,
            ...story.props,
          },
        }
      : {}),
  };
};
