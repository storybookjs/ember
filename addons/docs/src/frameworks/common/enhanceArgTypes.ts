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

  const normalizedArgTypes = normalizeArgTypes(userArgTypes);
  const namedArgTypes = mapValues(normalizedArgTypes, (val, key) => ({ name: key, ...val }));
  const extractedArgTypes = extractArgTypes && component ? extractArgTypes(component) : {};
  const withExtractedTypes = extractedArgTypes
    ? combineParameters(extractedArgTypes, namedArgTypes)
    : namedArgTypes;

  return withExtractedTypes;
};
