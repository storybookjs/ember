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
import { resetComponents, Story as PureStory } from '@storybook/components';
import { StoryId, toId, storyNameFromExport, StoryAnnotations, AnyFramework } from '@storybook/csf';
import { Story as StoryType } from '@storybook/store';
import global from 'global';

import { CURRENT_SELECTION } from './types';
import { DocsContext, DocsContextProps } from './DocsContext';
import { useStory } from './useStory';

export const storyBlockIdFromId = (storyId: string) => `story--${storyId}`;

type PureStoryProps = ComponentProps<typeof PureStory>;

type Annotations = Pick<
  StoryAnnotations,
  'decorators' | 'parameters' | 'args' | 'argTypes' | 'loaders'
>;
type CommonProps = Annotations & {
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

  if (!story) {
    return <div>Loading...</div>;
  }

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
  useEffect(() => {
    let cleanup: () => void;
    if (story && ref.current) {
      cleanup = context.renderStoryToElement({
        story,
        renderContext,
        element: ref.current as Element,
      });
    }
    return () => cleanup && cleanup();
  }, [story]);

  if (global?.FEATURES.modernInlineRender) {
    // We do this so React doesn't complain when we replace the span in a secondary render
    const htmlContents = `<span data-is-loading-indicator="true">loading story...</span>`;
    return (
      <div ref={ref} data-name={story.name} dangerouslySetInnerHTML={{ __html: htmlContents }} />
    );
  }

  const storyProps = getStoryProps(props, story, context);
  if (!storyProps) {
    return null;
  }
  return (
    <div id={storyBlockIdFromId(storyProps.id)}>
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
