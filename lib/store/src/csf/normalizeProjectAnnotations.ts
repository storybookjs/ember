import type { AnyFramework, ProjectAnnotations } from '@storybook/csf';

import { inferArgTypes } from '../inferArgTypes';
import { inferControls } from '../inferControls';
import type { NormalizedProjectAnnotations } from '../types';
import { normalizeInputTypes } from './normalizeInputTypes';

export function normalizeProjectAnnotations<TFramework extends AnyFramework>({
  argTypes,
  globalTypes,
  argTypesEnhancers,
  ...annotations
}: ProjectAnnotations<TFramework>): NormalizedProjectAnnotations<TFramework> {
  return {
    ...(argTypes && { argTypes: normalizeInputTypes(argTypes) }),
    ...(globalTypes && { globalTypes: normalizeInputTypes(globalTypes) }),
    argTypesEnhancers: [
      ...(argTypesEnhancers || []),
      inferArgTypes,
      // inferControls technically should only run if the user is using the controls addon,
      // and so should be added by a preset there. However, as it seems some code relies on controls
      // annotations (in particular the angular implementation's `cleanArgsDecorator`), for backwards
      // compatibility reasons, we will leave this in the store until 7.0
      inferControls,
    ],
    ...annotations,
  };
}
