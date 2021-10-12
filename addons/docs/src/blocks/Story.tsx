import React, {
  FunctionComponent,
  ReactNode,
  ElementType,
  ComponentProps,
  useContext,
  useRef,
  useEffect,
} from 'react';
import { MDXProvider } from '@mdx-js/react';
import global from 'global';
import { resetComponents, Story as PureStory } from '@storybook/components';
import { StoryId, toId, storyNameFromExport, StoryAnnotations, AnyFramework } from '@storybook/csf';
import { Story as StoryType } from '@storybook/store';
import { addons } from '@storybook/addons';
import Events from '@storybook/core-events';

import { CURRENT_SELECTION } from './types';
import { DocsContext, DocsContextProps } from './DocsContext';
import { useStory } from './useStory';

export const storyBlockIdFromId = (storyId: string) => `story--${storyId}`;

type PureStoryProps = ComponentProps<typeof PureStory>;

type CommonProps = StoryAnnotations & {
  height?: string;
  inline?: boolean;
};

type StoryDefProps = {
  name: string;
  children: ReactNode;
};

type StoryRefProps = {
  id?: string;
};

type StoryImportProps = {
  name: string;
  story: ElementType;
};

export type StoryProps = (StoryDefProps | StoryRefProps | StoryImportProps) & CommonProps;

export const lookupStoryId = (
  storyName: string,
  { mdxStoryNameToKey, mdxComponentAnnotations }: DocsContextProps
) =>
  toId(
    mdxComponentAnnotations.id || mdxComponentAnnotations.title,
    storyNameFromExport(mdxStoryNameToKey[storyName])
  );

export const getStoryId = (props: StoryProps, context: DocsContextProps): StoryId => {
  const { id } = props as StoryRefProps;
  const { name } = props as StoryDefProps;
  const inputId = id === CURRENT_SELECTION ? context.id : id;
  return inputId || lookupStoryId(name, context);
};

export const getStoryProps = <TFramework extends AnyFramework>(
  { height, inline }: StoryProps,
  story: StoryType<TFramework>,
  context: DocsContextProps<TFramework>,
  onStoryFnCalled: () => void
): PureStoryProps => {
  const { name: storyName, parameters } = story;
  const { docs = {} } = parameters;

  if (docs.disable) {
    return null;
  }

  // prefer block props, then story parameters defined by the framework-specific settings and optionally overridden by users
  const { inlineStories = false, iframeHeight = 100, prepareForInline } = docs;
  const storyIsInline = typeof inline === 'boolean' ? inline : inlineStories;
  if (storyIsInline && !prepareForInline) {
    throw new Error(
      `Story '${storyName}' is set to render inline, but no 'prepareForInline' function is implemented in your docs configuration!`
    );
  }

  const boundStoryFn = () => {
    const storyResult = story.unboundStoryFn({
      ...context.getStoryContext(story),
      loaded: {},
    });

    // We need to wait until the bound story function has actually been called before we
    // consider the story rendered. Certain frameworks (i.e. angular) don't actually render
    // the component in the very first react render cycle, and so we can't just wait until the
    // `PureStory` component has been rendered to consider the underlying story "rendered".
    onStoryFnCalled();
    return storyResult;
  };

  return {
    inline: storyIsInline,
    id: story.id,
    height: height || (storyIsInline ? undefined : iframeHeight),
    title: storyName,
    ...(storyIsInline && {
      parameters,
      storyFn: () => prepareForInline(boundStoryFn, context.getStoryContext(story)),
    }),
  };
};

const Story: FunctionComponent<StoryProps> = (props) => {
  const context = useContext(DocsContext);
  const channel = addons.getChannel();
  const ref = useRef();
  const storyId = getStoryId(props, context);
  const story = useStory(storyId, context);

  useEffect(() => {
    let cleanup: () => void;
    if (story && ref.current) {
      const { componentId, id, title, name } = story;
      const renderContext = {
        componentId,
        title,
        kind: title,
        id,
        name,
        story: name,
        // TODO what to do when these fail?
        showMain: () => {},
        showError: () => {},
        showException: () => {},
      };
      cleanup = context.renderStoryToElement({
        story,
        renderContext,
        element: ref.current as Element,
      });
    }
    return () => cleanup && cleanup();
  }, [story]);

  if (!story) {
    return <div>Loading...</div>;
  }

  // If we are rendering a old-style inline Story via `PureStory` below, we want to emit
  // the `STORY_RENDERED` event when it renders. The modern mode below calls out to
  // `Preview.renderStoryToDom()` which itself emits the event.
  const storyProps = getStoryProps(props, story, context, () =>
    channel.emit(Events.STORY_RENDERED, storyId)
  );
  if (!storyProps) {
    return null;
  }

  if (global?.FEATURES?.modernInlineRender) {
    // We do this so React doesn't complain when we replace the span in a secondary render
    const htmlContents = `<span data-is-loading-indicator="true">loading story...</span>`;

    // FIXME: height/style/etc. lifted from PureStory
    const { height } = storyProps;
    return (
      <div id={storyBlockIdFromId(story.id)}>
        <MDXProvider components={resetComponents}>
          {height ? (
            <style>{`#story--${story.id} { min-height: ${height}; transform: translateZ(0); overflow: auto }`}</style>
          ) : null}
          <div
            ref={ref}
            data-name={story.name}
            dangerouslySetInnerHTML={{ __html: htmlContents }}
          />
        </MDXProvider>
      </div>
    );
  }

  return (
    <div id={storyBlockIdFromId(story.id)}>
      <MDXProvider components={resetComponents}>
        <PureStory {...storyProps} />
      </MDXProvider>
    </div>
  );
};

Story.defaultProps = {
  children: null,
  name: null,
};

export { Story };
