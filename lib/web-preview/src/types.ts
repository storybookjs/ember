import { StoryId, Framework, GlobalAnnotations, StoryContextForLoaders } from '@storybook/csf';
import { RenderContext, DecoratorApplicator, Story } from '@storybook/store';
import { WebPreview } from './WebPreview';

export type WebGlobalAnnotations<TFramework extends Framework> = GlobalAnnotations<TFramework> & {
  renderToDOM?: (context: RenderContext<TFramework>, element: Element) => Promise<void> | void;
};

export interface DocsContextProps<TFramework extends Framework> {
  id: string;
  title: string;
  name: string;
  storyById: (id: StoryId) => Story<TFramework>;
  componentStories: () => Story<TFramework>[];
  renderStoryToElement: WebPreview<TFramework>['renderStoryToElement'];
  getStoryContext: (story: Story<TFramework>) => StoryContextForLoaders<TFramework>;

  /**
   * mdxStoryNameToKey is an MDX-compiler-generated mapping of an MDX story's
   * display name to its story key for ID generation. It's used internally by the `<Story>`
   * and `Preview` doc blocks.
   */
  mdxStoryNameToKey?: Record<string, string>;
  mdxComponentAnnotations?: any;
}
