import {
  DecoratorFunction,
  Framework,
  LegacyStoryFn,
  LoaderFunction,
  Parameters,
  StoryContext,
  StoryContextForEnhancers,
  StoryFn,
  StoryId,
  StoryKind,
  StoryName,
} from '@storybook/csf';

import { Addon } from './index';

export type {
  Framework,
  StoryId,
  StoryKind,
  StoryName,
  ViewMode,
  Parameters,
  Args,
  ArgTypes,
  StoryContextUpdate,
  StoryContext,
  PartialStoryFn,
  LegacyStoryFn,
  ArgsStoryFn,
  StoryFn,
  DecoratorFunction,
  LoaderFunction,
} from '@storybook/csf';

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

export type StoryWrapper<TFramework extends Framework> = (
  storyFn: LegacyStoryFn<TFramework>,
  context: StoryContext<TFramework>,
  settings: WrapperSettings
) => any;

export type MakeDecoratorResult = (...args: any) => any;

export interface AddStoryArgs<TFramework extends Framework> {
  id: StoryId;
  kind: StoryKind;
  name: StoryName;
  storyFn: StoryFn<TFramework>;
  parameters: Parameters;
}

export interface ClientApiAddon<TFramework extends Framework> extends Addon {
  apply: (a: StoryApi<TFramework>, b: any[]) => any;
}
export interface ClientApiAddons<TFramework extends Framework> {
  [key: string]: ClientApiAddon<TFramework>;
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

export type ClientApiReturnFn<TFramework extends Framework> = (
  ...args: any[]
) => StoryApi<TFramework>;

export interface StoryApi<TFramework extends Framework> {
  kind: StoryKind;
  add: (
    storyName: StoryName,
    storyFn: StoryFn<TFramework>,
    parameters?: Parameters
  ) => StoryApi<TFramework>;
  addDecorator: (decorator: DecoratorFunction<TFramework>) => StoryApi<TFramework>;
  addLoader: (decorator: LoaderFunction<TFramework>) => StoryApi<TFramework>;
  addParameters: (parameters: Parameters) => StoryApi<TFramework>;
  [k: string]: string | ClientApiReturnFn<TFramework>;
}

export interface ClientStoryApi<TFramework extends Framework> {
  storiesOf(kind: StoryKind, module: NodeModule): StoryApi<TFramework>;
  addDecorator(decorator: DecoratorFunction<TFramework>): StoryApi<TFramework>;
  addParameters(parameter: Parameters): StoryApi<TFramework>;
  getStorybook(): IStorybookSection[];
  // TODO -- should be Story from store?
  raw: () => StoryContextForEnhancers<TFramework>[];
}

type LoadFn = () => any;
type RequireContext = any; // FIXME
export type Loadable = RequireContext | [RequireContext] | LoadFn;
