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
import { toId, storyNameFromExport } from '@storybook/csf';
import { Args, BaseAnnotations } from '@storybook/addons';
import { Story as StoryType } from '@storybook/client-api/dist/ts3.9/new/types';
import global from 'global';
import { CURRENT_SELECTION } from './types';

import { DocsContext, DocsContextProps } from './DocsContext';

export const storyBlockIdFromId = (storyId: string) => `story--${storyId}`;

type PureStoryProps = ComponentProps<typeof PureStory>;

type CommonProps = BaseAnnotations<Args, any> & {
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
  { mdxStoryNameToKey, mdxComponentMeta }: DocsContextProps<any>
) =>
  toId(
    mdxComponentMeta.id || mdxComponentMeta.title,
    storyNameFromExport(mdxStoryNameToKey[storyName])
  );

// TODO -- this can be async
export const getStory = (props: StoryProps, context: DocsContextProps<any>): StoryType<any> => {
  const { id } = props as StoryRefProps;
  const { name } = props as StoryDefProps;
  const inputId = id === CURRENT_SELECTION ? context.id : id;
  const previewId = inputId || lookupStoryId(name, context);
  return context.storyById(previewId);
};

export const getStoryProps = (
  { height, inline }: StoryProps,
  story: StoryType<any>,
  context: DocsContextProps<any>
): PureStoryProps => {
  const defaultIframeHeight = 100;

  if (!story) {
    return {
      id: story.id,
      inline: false,
      height: height || defaultIframeHeight.toString(),
      title: undefined,
    };
  }

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

  const boundStoryFn = () => story.storyFn(context.getStoryContext(story));
  return {
    parameters,
    inline: storyIsInline,
    id: story.id,
    storyFn: prepareForInline ? () => prepareForInline(boundStoryFn, story) : boundStoryFn,
    height: height || (storyIsInline ? undefined : iframeHeight),
    title: storyName,
  };
};

const Story: FunctionComponent<StoryProps> = (props) => {
  const context = useContext(DocsContext);
  const ref = useRef();
  const story = getStory(props, context);
  const { id, title, name } = story;
  const renderContext = {
    id,
    title,
    kind: title,
    name,
    story: name,
    // TODO -- shouldn't this be true sometimes? How to react to arg changes
    forceRender: false,
    // TODO what to do when these fail?
    showMain: () => {},
    showError: () => {},
    showException: () => {},
  };
  useEffect(() => {
    if (story && ref.current) {
      context.renderStoryToElement({ story, renderContext, element: ref.current as Element });
    }
    return () => story?.cleanup();
  }, [story]);

  if (global?.FEATURES.modernInlineRender) {
    return (
      <div ref={ref} data-name={story.name}>
        <span data-is-loading-indicator="true">loading story...</span>
      </div>
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
