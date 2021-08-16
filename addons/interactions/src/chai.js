import * as chai from 'chai';
import { instrument } from './instrument';

export const { assert, expect, should } = instrument(chai, { intercept: true });
