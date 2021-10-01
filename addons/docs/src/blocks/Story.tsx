import React, {
  FunctionComponent,
  ReactNode,
  ElementType,
  ComponentProps,
  useContext,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { MDXProvider } from '@mdx-js/react';
import { resetComponents, Story as PureStory } from '@storybook/components';
import { StoryId, toId, storyNameFromExport, StoryAnnotations, AnyFramework } from '@storybook/csf';
import { Story as StoryType } from '@storybook/store';
import global from 'global';

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
  context: DocsContextProps<TFramework>
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

  const boundStoryFn = () =>
    story.unboundStoryFn({
      ...context.getStoryContext(story),
      loaded: {},
    });
  return {
    inline: storyIsInline,
    id: story.id,
    height: height || (storyIsInline ? undefined : iframeHeight),
    title: storyName,
    ...(storyIsInline && {
      parameters,
      storyFn: () => prepareForInline(boundStoryFn, story),
    }),
  };
};

const Story: FunctionComponent<StoryProps> = (props) => {
  const context = useContext(DocsContext);
  const ref = useRef();
  const story = useStory(getStoryId(props, context), context);

  // Ensure we wait until this story is properly rendered in the docs context.
  // The purpose of this is to ensure that that the `DOCS_RENDERED` event isn't emitted
  // until all stories on the page have rendered.
  const { id: storyId, registerRenderingStory } = context;
  const storyRendered = useMemo(registerRenderingStory, [storyId]);
  useEffect(() => {
    if (story) storyRendered();
  }, [story]);

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
  const storyProps = getStoryProps(props, story, context);
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
