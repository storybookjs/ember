import React from 'react';

import { parsePath, createPath } from 'history';
import { Provider as ManagerProvider, Combo, Consumer } from '@storybook/api';
import { Location, BaseLocationProvider } from '@storybook/router';

import { ThemeProvider, ensure as ensureTheme, themes } from '@storybook/theming';

import { DecoratorFn } from '@storybook/react';
import { Preview } from './preview';

import { PrettyFakeProvider } from '../../FakeProvider';
import { previewProps } from './preview.mockdata';

const provider = new PrettyFakeProvider();
const staticNavigator = {
  createHref(to) {
    return typeof to === 'string' ? to : createPath(to);
  },

  push() {},

  replace() {},

  go() {},

  back() {},

  forward() {},
};

export default {
  title: 'UI/Preview',
  component: Preview,
  decorators: [
    ((StoryFn, c) => {
      const locationProp = parsePath('/?path=/story/story--id');

      const location = {
        pathname: locationProp.pathname || '/',
        search: locationProp.search || '',
        hash: locationProp.hash || '',
        state: null,
        key: 'default',
      };

      return (
        <BaseLocationProvider
          key="location.provider"
          basename={undefined}
          location={location}
          navigator={staticNavigator}
          static
        >
          <Location key="location.consumer">
            {(locationData) => (
              <ManagerProvider
                key="manager"
                provider={provider}
                {...locationData}
                docsMode={false}
                path="/story/story--id"
                storyId="story--id"
                navigate={() => {}}
              >
                <ThemeProvider key="theme.provider" theme={ensureTheme(themes.light)}>
                  <StoryFn {...c} />
                </ThemeProvider>
              </ManagerProvider>
            )}
          </Location>
        </BaseLocationProvider>
      );
    }) as DecoratorFn,
  ],
};

export const NoTabs = () => (
  <Consumer>
    {({ api }: Combo) => {
      return (
        <Preview
          {...previewProps}
          api={{ ...api, getElements: () => ({}) }}
          story={{ parameters: { previewTabs: { canvas: { hidden: true } } } }}
        />
      );
    }}
  </Consumer>
);

export const HideFullscreen = () => (
  <Consumer>
    {({ api }: Combo) => {
      return (
        <Preview
          {...previewProps}
          api={{ ...api, getElements: () => ({}) }}
          story={{ parameters: { toolbar: { fullscreen: { hidden: true } } } }}
        />
      );
    }}
  </Consumer>
);

export const HideAllDefaultTools = () => (
  <Consumer>
    {({ api }: Combo) => {
      return (
        <Preview
          {...previewProps}
          api={{ ...api, getElements: () => ({}) }}
          story={{
            parameters: {
              toolbar: {
                title: { hidden: true },
                zoom: { hidden: true },
                eject: { hidden: true },
                copy: { hidden: true },
                fullscreen: { hidden: true },
              },
            },
          }}
        />
      );
    }}
  </Consumer>
);

export const WithCanvasTab = () => (
  <Consumer>
    {({ api }: Combo) => {
      return <Preview {...previewProps} api={{ ...api, getElements: () => ({}) }} />;
    }}
  </Consumer>
);

export const WithTabs = () => <Preview {...previewProps} />;
