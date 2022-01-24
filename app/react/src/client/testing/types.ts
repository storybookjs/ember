import type {
  StoryFn as OriginalStoryFn,
  StoryObj,
  Meta,
  Args,
  StoryContext,
  ReactFramework,
} from '../preview/types-6-0';

export type StoryFile = { default: Meta<Args>; __esModule?: boolean; __namedExportsOrder?: any };

export type TestingStoryPlayContext<T = Args> = Partial<StoryContext<ReactFramework, T>> &
  Pick<StoryContext, 'canvasElement'>;

export type TestingStoryPlayFn<TArgs = Args> = (
  context: TestingStoryPlayContext<TArgs>
) => Promise<void> | void;

export type StoryFn<TArgs = Args> = OriginalStoryFn<TArgs> & { play: TestingStoryPlayFn<TArgs> };

export type TestingStory<T = Args> = StoryFn<T> | StoryObj<T>;

/**
 * T represents the whole ES module of a stories file. K of T means named exports (basically the Story type)
 * 1. pick the keys K of T that have properties that are Story<AnyProps>
 * 2. infer the actual prop type for each Story
 * 3. reconstruct Story with Partial. Story<Props> -> Story<Partial<Props>>
 */
export type StoriesWithPartialProps<TModule> = {
  // @TODO once we can use Typescript 4.0 do this to exclude nonStory exports:
  // replace [K in keyof TModule] with [K in keyof TModule as TModule[K] extends TestingStory<any> ? K : never]
  [K in keyof TModule]: TModule[K] extends TestingStory<infer TProps>
    ? StoryFn<Partial<TProps>>
    : unknown;
};
