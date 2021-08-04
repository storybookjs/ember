import {
  Parameters,
  DecoratorFunction,
  LoaderFunction,
  Args,
  ArgTypes,
  ArgsStoryFn,
  StoryId,
  StoryKind,
  StoryName,
  ViewMode,
  LegacyStoryFn,
} from '@storybook/addons';

import { HooksContext } from '../hooks';

export type { StoryId, ViewMode, Parameters, Args, ArgTypes, LegacyStoryFn, ArgsStoryFn };

export type ModuleExports = Record<string, any>;
export interface StoryIdentifier {
  id: StoryId;
  kind: ComponentTitle; // deprecated
  title: ComponentTitle;
  name: StoryName;
  story: StoryName; // deprecated
}

// TODO -- these should probably have their own definition
export type Globals = Args;
export type GlobalTypes = ArgTypes;

export type StoryContextForEnhancers = StoryIdentifier & {
  parameters: Parameters;
  initialArgs: Args;
  argTypes: ArgTypes;
};

export type StoryContextUpdate = {
  args: Args;
  globals: Globals;
  hooks: HooksContext;
};

export type StoryContext = StoryContextForEnhancers & StoryContextUpdate;

export type LoadedStoryContext = StoryContext & {
  loaded: Record<string, any>;
};

export declare type RenderContextWithoutStoryContext = StoryIdentifier & {
  forceRender: boolean;
  showMain: () => void;
  showError: (error: { title: string; description: string }) => void;
  showException: (err: Error) => void;
};

export type RenderContext<StoryFnReturnType> = RenderContextWithoutStoryContext & {
  // TODO -- this is pretty surprising -- why is this here?
  unboundStoryFn: LegacyStoryFn<StoryFnReturnType>;
  storyContext: LoadedStoryContext & {
    storyFn: LegacyStoryFn<StoryFnReturnType>;
  };
};

export type ArgTypesEnhancer = (context: StoryContextForEnhancers) => ArgTypes;
export type ArgsEnhancer = (context: StoryContextForEnhancers) => Args;

export type Meta<StoryFnReturnType> = {
  decorators?: DecoratorFunction<StoryFnReturnType>[];
  parameters?: Parameters;
  args?: Args;
  argTypes?: ArgTypes;
  loaders?: LoaderFunction[];
  render?: ArgsStoryFn<StoryFnReturnType>;
  play?: () => Promise<void>; // TODO -- should this take story context
};

export type GlobalMeta<StoryFnReturnType> = Meta<StoryFnReturnType> & {
  applyDecorators?: DecoratorApplicator<StoryFnReturnType>;
  argsEnhancers?: ArgsEnhancer[];
  argTypesEnhancers?: ArgTypesEnhancer[];
  globals?: Globals;
  globalTypes?: GlobalTypes;
};

export type WebGlobalMeta<StoryFnReturnType> = GlobalMeta<StoryFnReturnType> & {
  renderToDOM?: (context: RenderContext<StoryFnReturnType>, element: Element) => Promise<void>;
};

export type ComponentTitle = StoryKind;
export type ComponentId = string;
type StoryDescriptor = string[] | RegExp;
export type ComponentMeta<StoryFnReturnType> = Meta<StoryFnReturnType> & {
  title: ComponentTitle;
  id?: ComponentId;

  // TODO - should we have a type parameter for these?
  // Also TODO -- can you override at the story level?
  component?: any;
  subcomponents?: Record<string, any>;
  includeStories?: StoryDescriptor;
  excludeStories?: StoryDescriptor;
};

export type StoryMeta<StoryFnReturnType> = Meta<StoryFnReturnType> & {
  id: StoryId;
  name: StoryName;
};

export type CSFFile<StoryFnReturnType> = {
  meta: ComponentMeta<StoryFnReturnType>;
  stories: Record<StoryId, StoryMeta<StoryFnReturnType>>;
};

export type Story<StoryFnReturnType> = StoryIdentifier & {
  component?: any;
  subcomponents?: Record<string, any>;
  parameters: Parameters;
  initialArgs: Args;
  argTypes: ArgTypes;
  applyLoaders: (context: StoryContext) => Promise<LoadedStoryContext>;
  storyFn: LegacyStoryFn<StoryFnReturnType>;
  runPlayFunction: () => Promise<void>; // TODO -- should this take story context?
  cleanup: () => void;
};

export type Path = string;

export interface StoriesListStory {
  id: StoryId;
  name: StoryName;
  kind: ComponentTitle; // TODO -- should we rename this?
  parameters: { fileName: Path };
}

export interface StoriesList {
  v: number;
  stories: Record<StoryId, StoriesListStory>;
}

export type ModuleImportFn = (path: Path) => ModuleExports;

export type Channel = any;

export type StorySpecifier = StoryId | { name: StoryName; kind: StoryKind } | '*';

export interface SelectionSpecifier {
  storySpecifier: StorySpecifier;
  viewMode: ViewMode;
  singleStory?: boolean;
  args?: Args;
  globals?: Args;
}

export interface Selection {
  storyId: StoryId;
  viewMode: ViewMode;
}

export type DecoratorApplicator<StoryFnReturnType> = (
  storyFn: LegacyStoryFn<StoryFnReturnType>,
  decorators: DecoratorFunction<StoryFnReturnType>[]
) => LegacyStoryFn<StoryFnReturnType>;

export interface DocsContextProps<StoryFnReturnType> {
  id: string;
  title: string;
  name: string;
  storyById: (id: StoryId) => Story<StoryFnReturnType>;
  componentStories: () => Story<StoryFnReturnType>[];
  renderStoryToElement: (story: Story<StoryFnReturnType>) => void;

  // TODO -- we need this for the `prepareForInline` docs approach
  bindStoryFn: (story: Story<StoryFnReturnType>) => LegacyStoryFn<StoryFnReturnType>;

  /**
   * mdxStoryNameToKey is an MDX-compiler-generated mapping of an MDX story's
   * display name to its story key for ID generation. It's used internally by the `<Story>`
   * and `Preview` doc blocks.
   */
  mdxStoryNameToKey?: Record<string, string>;
  mdxComponentMeta?: any;
}
