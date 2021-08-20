import { addons, StoryContext } from '@storybook/addons';
import { sourceDecorator } from './sourceDecorator';
import { SNIPPET_RENDERED } from '../../shared';

jest.mock('@storybook/addons');
const mockedAddons = addons as jest.Mocked<typeof addons>;

expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => typeof val === 'string',
});

const makeContext = (name: string, parameters: any, args: any, extra?: object): StoryContext => ({
  id: `html-test--${name}`,
  kind: 'js-text',
  name,
  parameters,
  args,
  argTypes: {},
  globals: {},
  ...extra,
});

describe('sourceDecorator', () => {
  let mockChannel: { on: jest.Mock; emit?: jest.Mock };
  beforeEach(() => {
    mockedAddons.getChannel.mockReset();

    mockChannel = { on: jest.fn(), emit: jest.fn() };
    mockedAddons.getChannel.mockReturnValue(mockChannel as any);
  });

  it('should render dynamically for args stories', () => {
    const storyFn = (args: any) => `<div>args story</div>`;
    const context = makeContext('args', { __isArgsStory: true }, {});
    sourceDecorator(storyFn, context);
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'html-test--args',
      '<div>args story</div>'
    );
  });

  it('should dedent source by default', () => {
    const storyFn = (args: any) => `
      <div>
        args story
      </div>
    `;
    const context = makeContext('args', { __isArgsStory: true }, {});
    sourceDecorator(storyFn, context);
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'html-test--args',
      ['<div>', '  args story', '</div>'].join('\n')
    );
  });

  it('should skip dynamic rendering for no-args stories', () => {
    const storyFn = () => `<div>classic story</div>`;
    const context = makeContext('classic', {}, {});
    sourceDecorator(storyFn, context);
    expect(mockChannel.emit).not.toHaveBeenCalled();
  });

  it('should use the originalStoryFn if excludeDecorators is set', () => {
    const storyFn = (args: any) => `<div>args story</div>`;
    const decoratedStoryFn = (args: any) => `
      <div style="padding: 25px; border: 3px solid red;">${storyFn(args)}</div>
    `;
    const context = makeContext(
      'args',
      {
        __isArgsStory: true,
        docs: {
          source: {
            excludeDecorators: true,
          },
        },
      },
      {},
      { originalStoryFn: storyFn }
    );
    sourceDecorator(decoratedStoryFn, context);
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'html-test--args',
      '<div>args story</div>'
    );
  });

  it('allows the snippet output to be modified by transformSource', () => {
    const storyFn = (args: any) => `<div>args story</div>`;
    const transformSource = (dom: string) => `<p>${dom}</p>`;
    const docs = { transformSource };
    const context = makeContext('args', { __isArgsStory: true, docs }, {});
    sourceDecorator(storyFn, context);
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'html-test--args',
      '<p><div>args story</div></p>'
    );
  });

  it('provides the story context to transformSource', () => {
    const storyFn = (args: any) => `<div>args story</div>`;
    const transformSource = jest.fn((x) => x);
    const docs = { transformSource };
    const context = makeContext('args', { __isArgsStory: true, docs }, {});
    sourceDecorator(storyFn, context);
    expect(transformSource).toHaveBeenCalledWith('<div>args story</div>', context);
  });
});
