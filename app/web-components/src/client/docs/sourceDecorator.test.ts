import { html } from 'lit-html';
import { styleMap } from 'lit-html/directives/style-map';
import { addons, useEffect } from '@storybook/addons';
import { SNIPPET_RENDERED } from '@storybook/docs-tools';
import type { StoryContext, WebComponentsFramework } from '..';
import { sourceDecorator } from './sourceDecorator';

jest.mock('@storybook/addons');
const mockedAddons = addons as jest.Mocked<typeof addons>;
const mockedUseEffect = useEffect as jest.Mock;

expect.addSnapshotSerializer({
  print: (val: any) => val,
  test: (val) => typeof val === 'string',
});

const tick = () => new Promise((r) => setTimeout(r, 0));

const makeContext = (
  name: string,
  parameters: any,
  args: any,
  extra?: Partial<StoryContext<WebComponentsFramework>>
) =>
  ({
    id: `lit-test--${name}`,
    kind: 'js-text',
    name,
    parameters,
    args,
    argTypes: {},
    globals: {},
    ...extra,
  } as StoryContext<WebComponentsFramework>);

describe('sourceDecorator', () => {
  let mockChannel: { on: jest.Mock; emit?: jest.Mock };
  beforeEach(() => {
    mockedAddons.getChannel.mockReset();
    mockedUseEffect.mockImplementation((cb) => setTimeout(cb, 0));

    mockChannel = { on: jest.fn(), emit: jest.fn() };
    mockedAddons.getChannel.mockReturnValue(mockChannel as any);
  });

  it('should render dynamically for args stories', async () => {
    const storyFn = (args: any) => html`<div>args story</div>`;
    const context = makeContext('args', { __isArgsStory: true }, {});
    sourceDecorator(storyFn, context);
    await tick();
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'lit-test--args',
      '<div>args story</div>'
    );
  });

  it('should skip dynamic rendering for no-args stories', async () => {
    const storyFn = () => html`<div>classic story</div>`;
    const context = makeContext('classic', {}, {});
    sourceDecorator(storyFn, context);
    await tick();
    expect(mockChannel.emit).not.toHaveBeenCalled();
  });

  it('should use the originalStoryFn if excludeDecorators is set', async () => {
    const storyFn = (args: any) => html`<div>args story</div>`;
    const decoratedStoryFn = (args: any) => html`
      <div style=${styleMap({ padding: `${25}px`, border: '3px solid red' })}>${storyFn(args)}</div>
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
    await tick();
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'lit-test--args',
      '<div>args story</div>'
    );
  });

  it('allows the snippet output to be modified by transformSource', async () => {
    const storyFn = (args: any) => html`<div>args story</div>`;
    const transformSource = (dom: string) => `<p>${dom}</p>`;
    const docs = { transformSource };
    const context = makeContext('args', { __isArgsStory: true, docs }, {});
    sourceDecorator(storyFn, context);
    await tick();
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'lit-test--args',
      '<p><div>args story</div></p>'
    );
  });

  it('provides the story context to transformSource', () => {
    const storyFn = (args: any) => html`<div>args story</div>`;
    const transformSource = jest.fn((x) => x);
    const docs = { transformSource };
    const context = makeContext('args', { __isArgsStory: true, docs }, {});
    sourceDecorator(storyFn, context);
    expect(transformSource).toHaveBeenCalledWith('<div>args story</div>', context);
  });

  it('should clean lit expression comments', async () => {
    const storyFn = (args: any) => html`<div>${args.slot}</div>`;
    const context = makeContext(
      'args',
      { __isArgsStory: true },
      { slot: 'some content' },
      { originalStoryFn: storyFn }
    );
    // bind args to storyFn, as it's done in Storybook
    const boundStoryFn = storyFn.bind(null, context.args);
    sourceDecorator(boundStoryFn, context);
    await tick();
    expect(mockChannel.emit).toHaveBeenCalledWith(
      SNIPPET_RENDERED,
      'lit-test--args',
      '<div>some content</div>'
    );
  });
});
