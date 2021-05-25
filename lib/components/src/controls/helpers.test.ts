import { getControlId } from './helpers';

describe('getControlId', () => {
  it.each([
    // caseName, input, expected
    ['lower case', 'some-id', 'control-some-id'],
    ['upper case', 'SOME-ID', 'control-SOME-ID'],
    ['all valid characters', 'some_weird-:custom.id', 'control-some_weird-:custom.id'],
  ])('%s', (a, input, expected) => {
    expect(getControlId(input)).toBe(expected);
  });
});
