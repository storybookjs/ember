import * as expectPatched from '@storybook/expect';
import * as mock from 'jest-mock';
import { instrument } from './instrumenter';

export const { jest } = instrument({ jest: mock });
export const { expect } = instrument(expectPatched, { intercept: true });
