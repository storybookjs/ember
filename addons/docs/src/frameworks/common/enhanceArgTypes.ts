import { AnyFramework, StoryContextForEnhancers } from '@storybook/csf';
import { combineParameters } from '@storybook/store';

export const enhanceArgTypes = <TFramework extends AnyFramework>(
  context: StoryContextForEnhancers<TFramework>
) => {
  const {
    component,
    argTypes: userArgTypes,
    parameters: { docs = {} },
  } = context;
  const { extractArgTypes } = docs;

  const extractedArgTypes = extractArgTypes && component ? extractArgTypes(component) : {};
  const withExtractedTypes = extractedArgTypes
    ? combineParameters(extractedArgTypes, userArgTypes)
    : userArgTypes;

  return withExtractedTypes;
};
