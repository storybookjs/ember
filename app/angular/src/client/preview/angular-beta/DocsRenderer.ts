import addons from '@storybook/addons';
import Events from '@storybook/core-events';
import { AbstractRenderer } from './AbstractRenderer';
import { StoryFnAngularReturnType } from '../types';
import { Parameters } from '../types-6-0';

export class DocsRenderer extends AbstractRenderer {
  public async render(options: {
    storyFnAngular: StoryFnAngularReturnType;
    forced: boolean;
    parameters: Parameters;
    targetDOMNode: HTMLElement;
  }) {
    const channel = addons.getChannel();
    /**
     * Destroy and recreate the PlatformBrowserDynamic of angular
     * For several stories to be rendered in the same docs we should
     * not destroy angular between each rendering but do it when the
     * rendered stories are not needed anymore.
     *
     * Note for improvement: currently there is one event per story
     * rendered in the doc. But one event could be enough for the whole docs
     *
     */
    channel.once(Events.STORY_CHANGED, async () => {
      await DocsRenderer.resetPlatformBrowserDynamic();
    });

    await super.render({ ...options, forced: false });

    await AbstractRenderer.resetCompiledComponents();
  }

  async beforeFullRender(): Promise<void> {}
}
