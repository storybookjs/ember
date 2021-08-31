import {
  Framework,
  InputType,
  Parameters,
  StoryContext as StoryContextForFramework,
  LegacyStoryFn as LegacyStoryFnForFramework,
  PartialStoryFn as PartialStoryFnForFramework,
  ArgsStoryFn as ArgsStoryFnForFramework,
  StoryFn as StoryFnForFramework,
  DecoratorFunction as DecoratorFunctionForFramework,
  LoaderFunction as LoaderFunctionForFramework,
  StoryId,
  StoryKind,
  StoryName,
  Args,
} from '@storybook/csf';

import { Addon } from './index';

// NOTE: The types exported from this file are simplified versions of the types exported
// by @storybook/csf, with the simpler form retained for backwards compatibility.
// We will likely start exporting the more complex <StoryFnReturnType> based types in 7.0

export type {
  StoryId,
  StoryKind,
  StoryName,
  StoryIdentifier,
  ViewMode,
  Parameters,
  Args,
} from '@storybook/csf';

export type ArgTypes<TArgs = Args> = {
  [key in keyof Partial<TArgs>]: InputType;
};

export type StoryContext = StoryContextForFramework<Framework>;
export type StoryContextUpdate = Partial<StoryContext>;

type ReturnTypeFramework<ReturnType> = { component: any; storyResult: ReturnType };
export type PartialStoryFn<ReturnType = unknown> = PartialStoryFnForFramework<
  ReturnTypeFramework<ReturnType>
>;
export type LegacyStoryFn<ReturnType = unknown> = LegacyStoryFnForFramework<
  ReturnTypeFramework<ReturnType>
>;
export type ArgsStoryFn<ReturnType = unknown> = ArgsStoryFnForFramework<
  ReturnTypeFramework<ReturnType>
>;
export type StoryFn<ReturnType = unknown> = StoryFnForFramework<ReturnTypeFramework<ReturnType>>;

export type DecoratorFunction<StoryFnReturnType = unknown> = DecoratorFunctionForFramework<
  ReturnTypeFramework<StoryFnReturnType>
>;
export type LoaderFunction = LoaderFunctionForFramework<ReturnTypeFramework<unknown>>;

export enum types {
  TAB = 'tab',
  PANEL = 'panel',
  TOOL = 'tool',
  TOOLEXTRA = 'toolextra',
  PREVIEW = 'preview',
  NOTES_ELEMENT = 'notes-element',
}

export type Types = types | string;

export function isSupportedType(type: Types): boolean {
  return !!Object.values(types).find((typeVal) => typeVal === type);
}

export interface WrapperSettings {
  options: object;
  parameters: {
    [key: string]: any;
  };
}

export type StoryWrapper = (
  storyFn: LegacyStoryFn,
  context: StoryContext,
  settings: WrapperSettings
) => any;

export type MakeDecoratorResult = (...args: any) => any;

export interface AddStoryArgs<StoryFnReturnType = unknown> {
  id: StoryId;
  kind: StoryKind;
  name: StoryName;
  storyFn: StoryFn<StoryFnReturnType>;
  parameters: Parameters;
}

export interface ClientApiAddon<StoryFnReturnType = unknown> extends Addon {
  apply: (a: StoryApi<StoryFnReturnType>, b: any[]) => any;
}
export interface ClientApiAddons<StoryFnReturnType> {
  [key: string]: ClientApiAddon<StoryFnReturnType>;
}

// Old types for getStorybook()
export interface IStorybookStory {
  name: string;
  render: () => any;
}

export interface IStorybookSection {
  kind: string;
  stories: IStorybookStory[];
}

export type ClientApiReturnFn<StoryFnReturnType = unknown> = (
  ...args: any[]
) => StoryApi<StoryFnReturnType>;

export interface StoryApi<StoryFnReturnType = unknown> {
  kind: StoryKind;
  add: (
    storyName: StoryName,
    storyFn: StoryFn<StoryFnReturnType>,
    parameters?: Parameters
  ) => StoryApi<StoryFnReturnType>;
  addDecorator: (decorator: DecoratorFunction<StoryFnReturnType>) => StoryApi<StoryFnReturnType>;
  addLoader: (decorator: LoaderFunction) => StoryApi<StoryFnReturnType>;
  addParameters: (parameters: Parameters) => StoryApi<StoryFnReturnType>;
  [k: string]: string | ClientApiReturnFn<StoryFnReturnType>;
}

export interface ClientStoryApi<StoryFnReturnType = unknown> {
  storiesOf(kind: StoryKind, module: NodeModule): StoryApi<StoryFnReturnType>;
  addDecorator(decorator: DecoratorFunction<StoryFnReturnType>): StoryApi<StoryFnReturnType>;
  addParameters(parameter: Parameters): StoryApi<StoryFnReturnType>;
}

type LoadFn = () => any;
type RequireContext = any; // FIXME
export type Loadable = RequireContext | [RequireContext] | LoadFn;
