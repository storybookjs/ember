import type {
  AnyFramework,
  AnnotatedStoryFn,
  StoryAnnotations,
  ComponentAnnotations,
  Args,
  StoryContext,
} from '@storybook/csf';

export type CSFExports<TFramework extends AnyFramework = AnyFramework> = {
  default: ComponentAnnotations<TFramework, Args>;
  __esModule?: boolean;
  __namedExportsOrder?: string[];
};

export type TestingStoryPlayContext = Partial<StoryContext> & Pick<StoryContext, 'canvasElement'>;

export type TestingStoryPlayFn = (context: TestingStoryPlayContext) => Promise<void> | void;

export type StoryFn<TFramework extends AnyFramework = AnyFramework, TArgs = Args> =
  AnnotatedStoryFn<TFramework, TArgs> & { play: TestingStoryPlayFn };

export type TestingStory<TFramework extends AnyFramework = AnyFramework, TArgs = Args> =
  | StoryFn<TFramework, TArgs>
  | StoryAnnotations<TFramework, TArgs>;
