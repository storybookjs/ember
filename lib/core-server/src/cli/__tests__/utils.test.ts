import { parseList } from '../utils';

describe('parseList', () => {
  test.each`
    source                     | expected
    ${'item1,item2, item3'}    | ${['item1', 'item2', 'item3']}
    ${'item1 , item2, item3 '} | ${['item1', 'item2', 'item3']}
  `(`Items will be trimmed, source "$source" should return $expected`, ({ source, expected }) => {
    const result = parseList(source);
    expect(result).toEqual(expected);
  });

  test.each`
    source              | expected
    ${'item1,item2, '}  | ${['item1', 'item2']}
    ${'item1, ,item3 '} | ${['item1', 'item3']}
    ${'item1,,item3 '}  | ${['item1', 'item3']}
    ${'item1,, '}       | ${['item1']}
  `(
    `Empty items will be stripped, source "$source" should return $expected`,
    ({ source, expected }) => {
      const result = parseList(source);
      expect(result).toEqual(expected);
    }
  );
});
