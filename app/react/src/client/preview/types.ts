import { ReactElement } from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
export type { RenderContext } from '@storybook/store';
export type { StoryContext } from '@storybook/csf';

export interface ShowErrorArgs {
  title: string;
  description: string;
}

export type StoryFnReactReturnType = ReactElement<unknown>;

export interface IStorybookStory {
  name: string;
  render: () => any;
}

export interface IStorybookSection {
  kind: string;
  stories: IStorybookStory[];
}
