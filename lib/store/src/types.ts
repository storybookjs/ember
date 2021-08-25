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
  GlobalAnnotations,
  ComponentAnnotations,
  StoryAnnotations,
  StoryFn,
  StrictArgTypes,
  StrictGlobalTypes,
} from '@storybook/csf';

export type Path = string;
export type ModuleExports = Record<string, any>;
export type ModuleImportFn = (path: Path) => ModuleExports;

export type NormalizedGlobalAnnotations<
  TFramework extends Framework
> = GlobalAnnotations<TFramework> & {
  argTypes: StrictArgTypes;
  globalTypes: StrictGlobalTypes;
};

export type NormalizedComponentAnnotations<
  TFramework extends Framework
> = ComponentAnnotations<TFramework> & {
  // Useful to guarantee that id exists
  id: StoryId;
  argTypes: StrictArgTypes;
};

export type NormalizedStoryAnnotations<TFramework extends Framework> = Omit<
  StoryAnnotations<TFramework>,
  'storyName' | 'story'
> & {
  // You cannot actually set id on story annotations, but we normalize it to be there for convience
  id: StoryId;
  argTypes: StrictArgTypes;
};

export type CSFFile<TFramework extends Framework> = {
  meta: NormalizedComponentAnnotations<TFramework>;
  stories: Record<StoryId, NormalizedStoryAnnotations<TFramework>>;
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

export interface NormalizedStoriesEntrySpecifier {
  directory: string;
  titlePrefix?: string;
}
export interface NormalizedStoriesEntry {
  glob?: string;
  specifier?: NormalizedStoriesEntrySpecifier;
}
