import { ArgTypes } from '@storybook/api';
import { PropDef, ArgTypesExtractor } from '../../lib/docgen';
import { extractProps } from './extractProps';

export const extractArgTypes: ArgTypesExtractor = (component) => {
  if (component) {
    const { rows } = extractProps(component);
    if (rows) {
      return rows.reduce((acc: ArgTypes, row: PropDef) => {
        const {
          name,
          type,
          sbType,
          defaultValue: defaultSummary,
          jsDocTags,
          required,
          ...rest
        } = row;

        acc[name] = {
          ...rest,
          type: { required, ...sbType },
          table: {
            type,
            jsDocTags,
            defaultValue: defaultSummary,
          },
        };
        return acc;
      }, {});
    }
  }

  return null;
};
