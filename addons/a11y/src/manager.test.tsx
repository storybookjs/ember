import { addons } from '@storybook/addons';
import { PANEL_ID } from './constants';
import './manager';

jest.mock('@storybook/addons');
const mockedAddons = addons as jest.Mocked<typeof addons>;
const registrationImpl = mockedAddons.register.mock.calls[0][1];

describe('A11yManager', () => {
  it('should register the panels', () => {
    // when
    registrationImpl();

    // then
    expect(mockedAddons.add.mock.calls).toHaveLength(2);
    expect(mockedAddons.add).toHaveBeenCalledWith(PANEL_ID, expect.anything());

    const panel = mockedAddons.add.mock.calls
      .map(([_, def]) => def)
      .find(({ type }) => type === 'panel');
    const tool = mockedAddons.add.mock.calls
      .map(([_, def]) => def)
      .find(({ type }) => type === 'tool');
    expect(panel).toBeDefined();
    expect(tool).toBeDefined();
  });

  it('should compute title with no issues', () => {
    // given
    registrationImpl();
    const title = mockedAddons.add.mock.calls
      .map(([_, def]) => def)
      .find(({ type }) => type === 'panel').title as Function;

    // when / then
    expect(title()).toBe('Accessibility');
  });

  it('should compute title with issues', () => {
    // given
    registrationImpl();
    const title = mockedAddons.add.mock.calls
      .map(([_, def]) => def)
      .find(({ type }) => type === 'panel').title as Function;

    // when / then
    expect(title({ violations: [{}], incomplete: [{}, {}] })).toBe('Accessibility (3)');
  });
});
