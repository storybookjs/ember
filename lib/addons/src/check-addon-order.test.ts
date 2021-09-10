import { logger } from '@storybook/node-logger';
import { checkAddonOrder } from './check-addon-order';

const configFile = './main.js';
const essentialAddons = [
  'docs',
  'controls',
  'actions',
  'backgrounds',
  'viewport',
  'toolbars',
  'measure',
  'outline',
];

const pkgName = (name) =>
  typeof name === 'string' && !name.includes('addon') ? `@storybook/addon-${name}` : name;
const fromName = (name) => ({
  name: pkgName(name),
  inEssentials: essentialAddons.includes(name),
});
const str = (name) => JSON.stringify(name);

const warn = jest.spyOn(logger, 'warn');
afterEach(() => warn.mockReset());

describe.each([
  ['docs', 'controls', ['docs', 'controls']],
  ['docs', 'controls', ['docs', 'foo/node_modules/@storybook/addon-controls']],
  ['docs', 'controls', [{ name: '@storybook/addon-docs' }, 'controls']],
  ['docs', 'controls', ['essentials', 'controls']],
  ['docs', 'controls', ['essentials']],
])('checkAddonOrder', (_before, _after, _addons) => {
  it(`${str(_before)} before ${str(_after)} in [${_addons.map(str).join(', ')}]`, async () => {
    const before = fromName(_before);
    const after = fromName(_after);
    const addons = _addons.map(pkgName);
    await checkAddonOrder({ before, after, configFile, getConfig: () => ({ addons }) });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe.each([
  ['docs', 'controls', []],
  ['docs', 'controls', ['controls']],
  ['docs', 'controls', ['docs']],
  ['docs', 'controls', ['controls', 'docs']],
  ['docs', 'controls', ['essentials', 'docs']],
  ['docs', 'controls', ['controls', 'essentials']],
  ['docs', 'controls', ['essentials', 'controls', 'docs']],
])('checkAddonOrder', (_before, _after, _addons) => {
  it(`${str(_before)} not before ${str(_after)} in [${_addons.map(str).join(', ')}]`, async () => {
    const before = fromName(_before);
    const after = fromName(_after);
    const addons = _addons.map(pkgName);
    await checkAddonOrder({ before, after, configFile, getConfig: () => ({ addons }) });
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`Expected '${before.name}' .* to be listed before '${after.name}'`)
      )
    );
  });
});
