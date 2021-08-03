/* eslint-disable no-underscore-dangle */
import React, { FC, useContext, useEffect, useState, useCallback } from 'react';
import mapValues from 'lodash/mapValues';
import {
  ArgsTable as PureArgsTable,
  ArgsTableProps as PureArgsTableProps,
  ArgsTableError,
  ArgTypes,
  SortType,
  TabbedArgsTable,
} from '@storybook/components';
import { Args } from '@storybook/addons';
import { StoryStore, filterArgTypes } from '@storybook/client-api';
import type { PropDescriptor } from '@storybook/client-api';
import Events from '@storybook/core-events';

import { DocsContext, DocsContextProps } from './DocsContext';
import { Component, CURRENT_SELECTION, PRIMARY_STORY } from './types';
import { getComponentName } from './utils';
import { ArgTypesExtractor } from '../lib/docgen/types';
import { lookupStoryId } from './Story';

interface BaseProps {
  include?: PropDescriptor;
  exclude?: PropDescriptor;
  sort?: SortType;
}

type OfProps = BaseProps & {
  of: '.' | '^' | Component;
};

type ComponentsProps = BaseProps & {
  components: {
    [label: string]: Component;
  };
};

type StoryProps = BaseProps & {
  story: '.' | '^' | string;
  showComponent?: boolean;
};

type ArgsTableProps = BaseProps | OfProps | ComponentsProps | StoryProps;

const useArgs = (
  storyId: string,
  storyStore: StoryStore
): [Args, (args: Args) => void, (argNames?: string[]) => void] => {
  const story = storyStore.fromId(storyId);
  if (!story) {
    throw new Error(`Unknown story: ${storyId}`);
  }

  const { args: initialArgs } = story;
  const [args, setArgs] = useState(initialArgs);
  useEffect(() => {
    const cb = (changed: { storyId: string; args: Args }) => {
      if (changed.storyId === storyId) {
        setArgs(changed.args);
      }
    };
    storyStore._channel.on(Events.STORY_ARGS_UPDATED, cb);
    return () => storyStore._channel.off(Events.STORY_ARGS_UPDATED, cb);
  }, [storyId]);
  const updateArgs = useCallback((newArgs) => storyStore.updateStoryArgs(storyId, newArgs), [
    storyId,
  ]);
  const resetArgs = useCallback(
    (argNames?: string[]) => storyStore.resetStoryArgs(storyId, argNames),
    [storyId]
  );
  return [args, updateArgs, resetArgs];
};

export const extractComponentArgTypes = (
  component: Component,
  { id, storyById }: DocsContextProps<any>,
  include?: PropDescriptor,
  exclude?: PropDescriptor
): ArgTypes => {
  const { parameters } = storyById(id);
  const { extractArgTypes }: { extractArgTypes: ArgTypesExtractor } = parameters.docs || {};
  if (!extractArgTypes) {
    throw new Error(ArgsTableError.ARGS_UNSUPPORTED);
  }
  let argTypes = extractArgTypes(component);
  argTypes = filterArgTypes(argTypes, include, exclude);

  return argTypes;
};

const isShortcut = (value?: string) => {
  return value && [CURRENT_SELECTION, PRIMARY_STORY].includes(value);
};

export const getComponent = (
  props: ArgsTableProps = {},
  { id, storyById }: DocsContextProps<any>
): Component => {
  const { of } = props as OfProps;
  const { story } = props as StoryProps;
  const { component } = storyById(id);
  if (isShortcut(of) || isShortcut(story)) {
    return component || null;
  }
  if (!of) {
    throw new Error(ArgsTableError.NO_COMPONENT);
  }
  return of;
};

const addComponentTabs = (
  tabs: Record<string, PureArgsTableProps>,
  components: Record<string, Component>,
  context: DocsContextProps<any>,
  include?: PropDescriptor,
  exclude?: PropDescriptor,
  sort?: SortType
) => ({
  ...tabs,
  ...mapValues(components, (comp) => ({
    rows: extractComponentArgTypes(comp, context, include, exclude),
    sort,
  })),
});

export const StoryTable: FC<
  StoryProps & { component: Component; subcomponents: Record<string, Component> }
> = (props) => {
  const context = useContext(DocsContext);
  const { id: currentId, storyById, componentStories } = context;
  const {
    story: storyName,
    component,
    subcomponents,
    showComponent,
    include,
    exclude,
    sort,
  } = props;
  const { argTypes, parameters } = storyById(currentId);
  let storyArgTypes: ArgTypes;
  try {
    let storyId;
    switch (storyName) {
      case CURRENT_SELECTION: {
        storyId = currentId;
        storyArgTypes = argTypes;
        break;
      }
      case PRIMARY_STORY: {
        const primaryStory = componentStories()[0];
        storyId = primaryStory.id;
        storyArgTypes = primaryStory.argTypes;
        break;
      }
      default: {
        storyId = lookupStoryId(storyName, context);
        storyArgTypes = storyById(storyId).argTypes;
      }
    }
    storyArgTypes = filterArgTypes(storyArgTypes, include, exclude);

    const mainLabel = getComponentName(component) || 'Story';

    // TODO -- how to get the current args and channel?
    // eslint-disable-next-line prefer-const
    let [args, updateArgs, resetArgs] = [storyById(storyId).initialArgs, () => 0, () => 0];
    let tabs = { [mainLabel]: { rows: storyArgTypes, args, updateArgs, resetArgs } } as Record<
      string,
      PureArgsTableProps
    >;

    // Use the dynamically generated component tabs if there are no controls
    const storyHasArgsWithControls =
      storyArgTypes && Object.values(storyArgTypes).find((v) => !!v?.control);

    if (!storyHasArgsWithControls) {
      updateArgs = null;
      resetArgs = null;
      tabs = {};
    }

    if (component && (!storyHasArgsWithControls || showComponent)) {
      tabs = addComponentTabs(tabs, { [mainLabel]: component }, context, include, exclude);
    }

    if (subcomponents) {
      if (Array.isArray(subcomponents)) {
        throw new Error(
          `Unexpected subcomponents array. Expected an object whose keys are tab labels and whose values are components.`
        );
      }
      tabs = addComponentTabs(tabs, subcomponents, context, include, exclude);
    }
    return <TabbedArgsTable tabs={tabs} sort={sort} />;
  } catch (err) {
    return <PureArgsTable error={err.message} />;
  }
};

export const ComponentsTable: FC<ComponentsProps> = (props) => {
  const context = useContext(DocsContext);
  const { components, include, exclude, sort } = props;

  const tabs = addComponentTabs({}, components, context, include, exclude);
  return <TabbedArgsTable tabs={tabs} sort={sort} />;
};

export const ArgsTable: FC<ArgsTableProps> = (props) => {
  const context = useContext(DocsContext);
  const { id, storyById } = context;
  const {
    parameters: { controls },
    subcomponents,
  } = storyById(id);

  const { include, exclude, components, sort: sortProp } = props as ComponentsProps;
  const { story: storyName } = props as StoryProps;

  const sort = sortProp || controls?.sort;

  const main = getComponent(props, context);
  if (storyName) {
    return <StoryTable {...(props as StoryProps)} component={main} {...{ subcomponents, sort }} />;
  }

  if (!components && !subcomponents) {
    let mainProps;
    try {
      mainProps = { rows: extractComponentArgTypes(main, context, include, exclude) };
    } catch (err) {
      mainProps = { error: err.message };
    }

    return <PureArgsTable {...mainProps} sort={sort} />;
  }

  if (components) {
    return <ComponentsTable {...(props as ComponentsProps)} {...{ components, sort }} />;
  }

  const mainLabel = getComponentName(main);
  return (
    <ComponentsTable
      {...(props as ComponentsProps)}
      components={{ [mainLabel]: main, ...subcomponents }}
      sort={sort}
    />
  );
};

ArgsTable.defaultProps = {
  of: CURRENT_SELECTION,
};
