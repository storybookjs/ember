import {
  DecoratorFunction,
  Args,
  StoryContextForEnhancers,
  StoryId,
  StoryName,
  StoryIdentifier,
  ViewMode,
  LegacyStoryFn,
  StoryContextForLoaders,
  StoryContext,
  ComponentTitle,
  Framework,
  ComponentAnnotations,
  StoryAnnotations,
  StoryFn,
} from '@storybook/csf';

export type Path = string;
export type ModuleExports = Record<string, any>;
export type ModuleImportFn = (path: Path) => ModuleExports;

// Useful to guarantee that id exists
export type ComponentAnnotationsWithId<
  TFramework extends Framework
> = ComponentAnnotations<TFramework> & {
  id: StoryId;
};

// We don't actually allow you to override the story id in the annotation, but it is useful
// to bundle it up internally and guarantee it exists
export type StoryAnnotationsWithId<TFramework extends Framework> = StoryAnnotations<TFramework> & {
  id: StoryId;
};

export type CSFFile<TFramework extends Framework> = {
  meta: ComponentAnnotationsWithId<TFramework>;
  stories: Record<StoryId, StoryAnnotationsWithId<TFramework>>;
};

export type Story<TFramework extends Framework> = StoryContextForEnhancers<TFramework> & {
  originalStoryFn: StoryFn<TFramework>;
  undecoratedStoryFn: LegacyStoryFn<TFramework>;
  unboundStoryFn: LegacyStoryFn<TFramework>;
  applyLoaders: (context: StoryContextForLoaders<TFramework>) => Promise<StoryContext<TFramework>>;
  runPlayFunction: () => Promise<void>;
};

export declare type RenderContext<TFramework extends Framework> = StoryIdentifier & {
  showMain: () => void;
  showError: (error: { title: string; description: string }) => void;
  showException: (err: Error) => void;
  forceRemount: boolean;
  storyContext: StoryContext<TFramework>;
  storyFn: LegacyStoryFn<TFramework>;
  unboundStoryFn: LegacyStoryFn<TFramework>;
};

export interface StoriesListStory {
  name: StoryName;
  title: ComponentTitle;
  importPath: Path;
}

export interface StoriesList {
  v: number;
  stories: Record<StoryId, StoriesListStory>;
}

export type StorySpecifier = StoryId | { name: StoryName; title: ComponentTitle } | '*';

export interface SelectionSpecifier {
  storySpecifier: StorySpecifier;
  viewMode: ViewMode;
  args?: Args;
  globals?: Args;
}

export interface Selection {
  storyId: StoryId;
  viewMode: ViewMode;
}

export type DecoratorApplicator<TFramework extends Framework> = (
  storyFn: LegacyStoryFn<TFramework>,
  decorators: DecoratorFunction<TFramework>[]
) => LegacyStoryFn<TFramework>;
