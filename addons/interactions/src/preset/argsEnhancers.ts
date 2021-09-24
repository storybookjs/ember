import { Args, addons } from '@storybook/addons';
import { FORCE_REMOUNT, STORY_RENDER_PHASE_CHANGED } from '@storybook/core-events';
import { AnyFramework, ArgsEnhancer } from '@storybook/csf';
import { fn } from 'jest-mock';
import { instrument } from '../lib/instrumenter';

// Aliasing `fn` to `action` here, so we get a more descriptive label in the UI.
const { action } = instrument({ action: fn }, { retain: true });
const channel = addons.getChannel();
const spies: any[] = [];

channel.on(FORCE_REMOUNT, () => spies.forEach((mock) => mock?.mockReset?.()));
channel.on(STORY_RENDER_PHASE_CHANGED, ({ newPhase }) => {
  if (newPhase === 'loading') spies.forEach((mock) => mock?.mockReset?.());
});

const addActionsFromArgTypes: ArgsEnhancer<AnyFramework> = ({ initialArgs }) => {
  return Object.entries(initialArgs).reduce((acc, [key, val]) => {
    if (typeof val === 'function' && val.name === 'actionHandler') {
      Object.defineProperty(val, 'name', { value: key, writable: false });
      acc[key] = action(val);
      spies.push(acc[key]);
      return acc;
    }
    acc[key] = val;
    return acc;
  }, {} as Args);
};

export const argsEnhancers = [addActionsFromArgTypes];
