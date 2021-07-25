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
} from '@storybook/addons';

export type { StoryId };

export type ModuleExports = Record<string, any>;

export type Meta<StoryFnReturnType> = {
  decorators?: DecoratorFunction<StoryFnReturnType>[];
  parameters?: Parameters;
  args?: Args;
  argTypes?: ArgTypes;
  loaders?: LoaderFunction[];
};

export type GlobalMeta<StoryFnReturnType> = Meta<StoryFnReturnType>;

export type ComponentTitle = StoryKind;
export type ComponentMeta<StoryFnReturnType> = Meta<StoryFnReturnType> & {
  title: ComponentTitle;

  // component,
  // subcomponents,
};

export type StoryMeta<StoryFnReturnType> = Meta<StoryFnReturnType> & {
  render: ArgsStoryFn<StoryFnReturnType>;
};

export type CSFFile<StoryFnReturnType> = {
  metadata: ComponentMeta<StoryFnReturnType>;
} & Record<StoryId, StoryMeta<StoryFnReturnType>>;

export type Path = string;

// TODO -- these types probably need to live in a common spot w/ where stories.json is generated
export interface StoriesMetadataStory {
  id: StoryId;
  name: StoryName;
  parameters: { fileName: Path };
}

export interface StoriesMetadata {
  v: number;
  stories: Record<StoryId, StoriesMetadataStory>;
}

export type ModuleImporter = (path: Path) => ModuleExports;

export type StoryContext = {
  id: StoryId;
  parameters: Parameters;
  args: Args;
  argTypes: ArgTypes;
  globals: Args;
};

export type Channel = any;

export type Globals = Args;
