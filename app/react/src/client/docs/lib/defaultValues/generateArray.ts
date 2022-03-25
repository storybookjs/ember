import {
  createSummaryValue,
  isTooLongForDefaultValueSummary,
  PropDefaultValue,
} from '@storybook/docs-tools';
import { ARRAY_CAPTION } from '../captions';
import { InspectionResult, InspectionArray } from '../inspection';
import { generateArrayCode } from '../generateCode';

export function generateArray({ inferredType, ast }: InspectionResult): PropDefaultValue {
  const { depth } = inferredType as InspectionArray;

  if (depth <= 2) {
    const compactArray = generateArrayCode(ast, true);

    if (!isTooLongForDefaultValueSummary(compactArray)) {
      return createSummaryValue(compactArray);
    }
  }

  return createSummaryValue(ARRAY_CAPTION, generateArrayCode(ast));
}
