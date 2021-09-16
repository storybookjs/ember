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
  AnyFramework,
  ProjectAnnotations,
  ComponentAnnotations,
  StoryAnnotations,
  StoryFn,
  StrictArgTypes,
  StrictGlobalTypes,
  ComponentId,
  PartialStoryFn,
} from '@storybook/csf';

export type Path = string;
export type ModuleExports = Record<string, any>;
export type ModuleImportFn = (path: Path) => Promise<ModuleExports> | ModuleExports;

export type NormalizedProjectAnnotations<
  TFramework extends AnyFramework = AnyFramework
> = ProjectAnnotations<TFramework> & {
  argTypes?: StrictArgTypes;
  globalTypes?: StrictGlobalTypes;
};

export type NormalizedComponentAnnotations<
  TFramework extends AnyFramework = AnyFramework
> = ComponentAnnotations<TFramework> & {
  // Useful to guarantee that id exists
  id: ComponentId;
  argTypes?: StrictArgTypes;
};

export type NormalizedStoryAnnotations<TFramework extends AnyFramework = AnyFramework> = Omit<
  StoryAnnotations<TFramework>,
  'storyName' | 'story'
> & {
  // You cannot actually set id on story annotations, but we normalize it to be there for convience
  id: StoryId;
  argTypes?: StrictArgTypes;
  userStoryFn?: StoryFn<TFramework>;
};

export type CSFFile<TFramework extends AnyFramework = AnyFramework> = {
  meta: NormalizedComponentAnnotations<TFramework>;
  stories: Record<StoryId, NormalizedStoryAnnotations<TFramework>>;
};

export type Story<
  TFramework extends AnyFramework = AnyFramework
> = StoryContextForEnhancers<TFramework> & {
  originalStoryFn: StoryFn<TFramework>;
  undecoratedStoryFn: LegacyStoryFn<TFramework>;
  unboundStoryFn: LegacyStoryFn<TFramework>;
  applyLoaders: (context: StoryContextForLoaders<TFramework>) => Promise<StoryContext<TFramework>>;
  runPlayFunction: () => Promise<void>;
};

export type BoundStory<TFramework extends AnyFramework = AnyFramework> = Story<TFramework> & {
  storyFn: PartialStoryFn<TFramework>;
};

export declare type RenderContext<
  TFramework extends AnyFramework = AnyFramework
> = StoryIdentifier & {
  showMain: () => void;
  showError: (error: { title: string; description: string }) => void;
  showException: (err: Error) => void;
  forceRemount: boolean;
  storyContext: StoryContext<TFramework>;
  storyFn: PartialStoryFn<TFramework>;
  unboundStoryFn: LegacyStoryFn<TFramework>;
};

export interface StoryIndexEntry {
  name: StoryName;
  title: ComponentTitle;
  importPath: Path;
}

export interface StoryIndex {
  v: number;
  stories: Record<StoryId, StoryIndexEntry>;
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

export type DecoratorApplicator<TFramework extends AnyFramework = AnyFramework> = (
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

export type ExtractOptions = {
  includeDocsOnly?: boolean;
};
