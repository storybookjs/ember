import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, ensure, themes } from '@storybook/theming';

import type { Story, StoriesHash, Refs } from '@storybook/api';
import type { Theme } from '@storybook/theming';
import type { RenderResult } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { SidebarProps } from '../Sidebar';

global.DOCS_MODE = false;

const PAGE_NAME = 'Page';

const factory = (props: Partial<SidebarProps>): RenderResult => {
  const theme: Theme = ensure(themes.light);

  return render(
    <ThemeProvider theme={theme}>
      <Sidebar storiesConfigured menu={[]} stories={{}} refs={{}} {...props} />
    </ThemeProvider>
  );
};

const generateStories = ({ kind, refId }: { kind: string; refId?: string }): StoriesHash => {
  const [root, storyName]: [string, string] = kind.split('/') as any;
  const rootId: string = root.toLowerCase().replace(/\s+/g, '-');
  const hypenatedstoryName: string = storyName.toLowerCase().replace(/\s+/g, '-');
  const storyId = `${rootId}-${hypenatedstoryName}`;
  const pageId = `${rootId}-${hypenatedstoryName}--page`;

  const storyBase: Partial<Story>[] = [
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
      name: PAGE_NAME,
      story: PAGE_NAME,
      kind,
      componentId: storyId,
      parent: storyId,
      title: kind,
    },
  ];

  return storyBase.reduce(
    (accumulator: StoriesHash, current: Partial<Story>, index: number): StoriesHash => {
      const { id, name } = current;
      const isRoot: boolean = index === 0;

      const story: Story = {
        ...current,
        depth: index,
        isRoot,
        isLeaf: name === PAGE_NAME,
        refId,
      };

      if (!isRoot) {
        story.parameters = {};
        story.parameters.docsOnly = true;
      }

      accumulator[id] = story;

      return accumulator;
    },
    {}
  );
};

describe('Sidebar', () => {
  test("should not render an extra nested 'Page'", async () => {
    const refId = 'next';
    const kind = 'Getting Started/Install';
    const refStories: StoriesHash = generateStories({ refId, kind });
    const internalStories: StoriesHash = generateStories({ kind: 'Welcome/Example' });

    const refs: Refs = {
      [refId]: {
        stories: refStories,
        id: refId,
        ready: true,
        title: refId,
      },
    };

    factory({
      refs,
      refId,
      stories: internalStories,
    });

    fireEvent.click(screen.getByText('Install'));
    fireEvent.click(screen.getByText('Example'));

    const pageItems: HTMLElement[] = await screen.queryAllByText('Page');

    expect(pageItems).toHaveLength(0);
  });
});
