import type { ToolbarItem } from '../types';

export const createCycleValueArray = (items: ToolbarItem[]) => {
  // Do not allow items in the cycle arrays that are conditional in placement
  const valueArray = items.filter((item) => !item.condition).map((item) => item.value);
  return valueArray;
};
