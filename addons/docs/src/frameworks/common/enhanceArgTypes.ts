import mapValues from 'lodash/mapValues';
import { Framework, StoryContextForEnhancers } from '@storybook/csf';
import { combineParameters } from '@storybook/store';
import { normalizeArgTypes } from './normalizeArgTypes';

export const enhanceArgTypes = <TFramework extends Framework>(
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
