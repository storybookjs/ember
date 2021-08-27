import * as mock from 'jest-mock';
import { instrument } from './instrument';

export const { jest } = instrument({ jest: mock });
