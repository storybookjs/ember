import {
  DecoratorFunction,
  Framework,
  LegacyStoryFn,
  LoaderFunction,
  Parameters,
  StoryContext,
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

// TODO -- these constraints?
// export interface Parameters {
//   fileName?: string;
//   options?: OptionsParameter;
//   /** The layout property defines basic styles added to the preview body where the story is rendered. If you pass 'none', no styles are applied. */
//   layout?: 'centered' | 'fullscreen' | 'padded' | 'none';
//   docsOnly?: boolean;
//   [key: string]: any;
// }

// export type Comparator<T> = ((a: T, b: T) => boolean) | ((a: T, b: T) => number);
// export type StorySortMethod = 'configure' | 'alphabetical';
// export interface StorySortObjectParameter {
//   method?: StorySortMethod;
//   order?: any[];
//   locales?: string;
//   includeNames?: boolean;
// }
// // The `any` here is the story store's `StoreItem` record. Ideally we should probably only
// // pass a defined subset of that full data, but we pass it all so far :shrug:
// export type StorySortComparator = Comparator<[StoryId, any, Parameters, Parameters]>;
// export type StorySortParameter = StorySortComparator | StorySortObjectParameter;

export interface OptionsParameter extends Object {
  // storySort?: StorySortParameter;
  theme?: {
    base: string;
    brandTitle?: string;
  };
  [key: string]: any;
}

export interface WrapperSettings {
  options: OptionsParameter;
  parameters: {
    [key: string]: any;
  };
}

export type StoryWrapper<TFramework extends Framework> = (
  getStory: LegacyStoryFn<TFramework>,
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
}

type LoadFn = () => any;
type RequireContext = any; // FIXME
export type Loadable = RequireContext | [RequireContext] | LoadFn;
