import global from 'global';
import { AnyFramework, StoryId, ViewMode, StoryContextForLoaders } from '@storybook/csf';
import { Story, StoryStore, CSFFile } from '@storybook/store';
import { Channel } from '@storybook/addons';
import { DOCS_RENDERED } from '@storybook/core-events';

import { DocsContextProps } from './types';

export class DocsRender<TFramework extends AnyFramework> {
  private canvasElement?: HTMLElement;

  private context?: DocsContextProps;

  public disableKeyListeners = false;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private channel: Channel,
    private store: StoryStore<TFramework>,
    public id: StoryId,
    public story: Story<TFramework>
  ) {}

  // DocsRender doesn't prepare, it is created *from* a prepared StoryRender
  isPreparing() {
    return false;
  }

  async renderToElement(
    canvasElement: HTMLElement,
    renderStoryToElement: DocsContextProps['renderStoryToElement']
  ) {
    this.canvasElement = canvasElement;

    const { id, title, name } = this.story;
    const csfFile: CSFFile<TFramework> = await this.store.loadCSFFileByStoryId(this.id);

    this.context = {
      id,
      title,
      name,
      // NOTE: these two functions are *sync* so cannot access stories from other CSF files
      storyById: (storyId: StoryId) => this.store.storyFromCSFFile({ storyId, csfFile }),
      componentStories: () => this.store.componentStoriesFromCSFFile({ csfFile }),
      loadStory: (storyId: StoryId) => this.store.loadStory({ storyId }),
      renderStoryToElement: renderStoryToElement.bind(this),
      getStoryContext: (renderedStory: Story<TFramework>) =>
        ({
          ...this.store.getStoryContext(renderedStory),
          viewMode: 'docs' as ViewMode,
        } as StoryContextForLoaders<TFramework>),
      // Put all the storyContext fields onto the docs context for back-compat
      ...(!global.FEATURES?.breakingChangesV7 && this.store.getStoryContext(this.story)),
    };

    return this.render();
  }

  async render() {
    if (!this.story || !this.context || !this.canvasElement)
      throw new Error('DocsRender not ready to render');

    const renderer = await import('./renderDocs');
    renderer.renderDocs(this.story, this.context, this.canvasElement, () =>
      this.channel.emit(DOCS_RENDERED, this.id)
    );
  }

  async rerender() {
    // NOTE: in modern inline render mode, each story is rendered via
    // `preview.renderStoryToElement` which means the story will track
    // its own re-renders. Thus there will be no need to re-render the whole
    // docs page when a single story changes.
    if (!global.FEATURES?.modernInlineRender) await this.render();
  }

  async teardown({ viewModeChanged }: { viewModeChanged?: boolean } = {}) {
    if (!viewModeChanged || !this.canvasElement) return;
    const renderer = await import('./renderDocs');
    renderer.unmountDocs(this.canvasElement);
  }
}
