import * as expectPatched from '@storybook/expect';
import { instrument } from './instrument';

export const { expect } = instrument(expectPatched, { intercept: true });
