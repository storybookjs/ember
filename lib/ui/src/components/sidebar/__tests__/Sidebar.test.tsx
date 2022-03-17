import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ensure, themes } from '@storybook/theming';

import type { Story, StoriesHash } from '@storybook/api';
import type { Theme } from '@storybook/theming';
import { Sidebar } from '../Sidebar';

global.DOCS_MODE = false;

const factory = (props) => {
  const theme: Theme = ensure(themes.light);

  return render(
    <ThemeProvider theme={theme}>
      <Sidebar storiesConfigured menu={[]} stories={{}} viewMode="docs" {...props} />
    </ThemeProvider>
  );
};

const generateStories: StoriesHash = ({ kind, refId }) => {
  const [root, storyName] = kind.split('/');
  const rootId = root.toLowerCase().replace(/\s+/g, '-');
  const hypenatedstoryName = storyName.toLowerCase().replace(/\s+/g, '-');
  const storyId = `${rootId}-${hypenatedstoryName}`;
  const pageId = `${rootId}-${hypenatedstoryName}--page`;

  const storyBase = [
    {
      id: rootId,
      name: root,
      children: [storyId],
      startCollapsed: false,
    },
    {
      id: storyId,
      name: storyName,
      children: [pageId],
      isComponent: true,
      parent: rootId,
    },
    {
      id: pageId,
      name: 'Page',
      story: 'Page',
      kind,
      componentId: storyId,
      parent: storyId,
      title: kind,
    },
  ];

  return storyBase.reduce((accumulator: StoriesHash, current: any, index: number) => {
    const { id, name } = current;
    const isRoot = index === 0;

    const story: Story = {
      ...current,
      depth: index,
      isRoot,
      isLeaf: name === 'Page',
      refId,
    };

    if (!isRoot) {
      story.parameters = {};
      story.parameters.docsOnly = true;
    }

    accumulator[id] = story;

    return accumulator;
  }, {});
};

describe('Sidebar', () => {
  test("should not render an extra nested 'Page'", async () => {
    const refId = 'next';
    const kind = 'Getting Started/Install';
    const refStories = generateStories({ refId, kind });
    const internalStories = generateStories({ kind: 'Welcome/Example' });
    const lastStoryId = Object.keys(refStories)[Object.keys(refStories).length - 1];

    const refs = {
      [refId]: {
        stories: refStories,
        id: refId,
        ready: true,
        title: refId,
      },
    };

    factory({
      refs,
      lastStoryId,
      refId,
      stories: internalStories,
    });

    fireEvent.click(screen.getByText('Install'));
    fireEvent.click(screen.getByText('Example'));

    const pageItems = await screen.queryAllByText('Page');

    expect(pageItems).toHaveLength(0);
  });
});
