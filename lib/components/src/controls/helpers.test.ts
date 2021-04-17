import { getControlId } from './helpers';

describe('getControlId', () => {
  [
    // testName, input, output
    ['empty string', ' ', 'control--'],
    ['lower case', 'some-id', 'control-some-id'],
    ['upper case', 'SOME-ID', 'control-SOME-ID'],
    ['handles basic substitution', 'a b$c?d😀e', 'control-a-b$c?d😀e'],
    ['cyrillic', 'Кириллический идентификатор', 'control-Кириллический-идентификатор'],
    ['korean', '바보', 'control-바보'],
    [
      'weird',
      'some ,’–—―′¿`" weird <>()!.!!!{}[] id %^&$*#& 😀',
      'control-some-,’–—―′¿`"-weird-<>()!.!!!{}[]-id-%^&$*#&-😀',
    ],
  ].forEach(([testName, input, output]) => {
    it(`${testName}`, () => {
      expect(getControlId(input)).toBe(output);
    });
  });
});
