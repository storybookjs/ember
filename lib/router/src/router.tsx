import global from 'global';
import React, { ReactNode, useCallback } from 'react';

import * as R from 'react-router-dom';
import { ToggleVisibility } from './visibility';
import { queryFromString, parsePath, getMatch, StoryData } from './utils';

const { document } = global;

interface Other extends StoryData {
  path: string;
  singleStory?: boolean;
}

export type RouterData = {
  location: Partial<Location>;
  navigate: ReturnType<typeof useNavigate>;
} & Other;

export type RenderData = Pick<RouterData, 'location'> & Other;

interface MatchingData {
  match: null | { path: string };
}

interface LocationProps {
  children: (renderData: RenderData) => ReactNode;
}
interface MatchProps {
  path: string;
  startsWith: boolean;
  children: (matchingData: MatchingData) => ReactNode;
}
interface RouteProps {
  path: string;
  startsWith?: boolean;
  hideOnly?: boolean;
  children: ReactNode;
}

export interface LinkProps {
  to: string;
  children: ReactNode;
}

const getBase = () => `${document.location.pathname}?`;

export type NavigateOptions = ReturnType<typeof R.useNavigate> & { plain?: boolean };

// const queryNavigate: NavigateFn = (to: string | number, options?: NavigateOptions<{}>) =>
//   typeof to === 'number' ? navigate(to) : navigate(`${getBase()}path=${to}`, options);

export const useNavigate = () => {
  const navigate = R.useNavigate();

  return useCallback((to: string | number, { plain, ...options } = {} as NavigateOptions) => {
    if (typeof to === 'string' && to.startsWith('#')) {
      document.location.hash = to;
      return undefined;
    }
    if (typeof to === 'string') {
      const target = plain ? to : `?path=${to}`;
      return navigate(target, options);
    }
    if (typeof to === 'number') {
      return navigate(to);
    }

    return undefined;
  }, []);
};

// A component that will navigate to a new location/path when clicked
export const Link = ({ to, children, ...rest }: LinkProps) => (
  <R.Link to={`${getBase()}path=${to}`} {...rest}>
    {children}
  </R.Link>
);
Link.displayName = 'QueryLink';

// A render-prop component where children is called with a location
// and will be called whenever it changes when it changes
export const Location = ({ children }: LocationProps) => {
  const location = R.useLocation();
  const { path, singleStory } = queryFromString(location.search);
  const { viewMode, storyId, refId } = parsePath(path);

  return (
    <>
      {children({
        path,
        location,
        viewMode,
        storyId,
        refId,
        singleStory: singleStory === 'true',
      })}
    </>
  );
};
Location.displayName = 'QueryLocation';

// A render-prop component for rendering when a certain path is hit.
// It's immensely similar to `Location` but it receives an addition data property: `match`.
// match has a truthy value when the path is hit.
export const Match = ({ children, path: targetPath, startsWith = false }: MatchProps) => (
  <Location>
    {({ path: urlPath, ...rest }) =>
      children({
        match: getMatch(urlPath, targetPath, startsWith),
        ...rest,
      })
    }
  </Location>
);
Match.displayName = 'QueryMatch';

// A component to conditionally render children based on matching a target path
export const Route = ({ path, children, startsWith = false, hideOnly = false }: RouteProps) => (
  <Match path={path} startsWith={startsWith}>
    {({ match }) => {
      if (hideOnly) {
        return <ToggleVisibility hidden={!match}>{children}</ToggleVisibility>;
      }
      return match ? children : null;
    }}
  </Match>
);
Route.displayName = 'Route';

export const LocationProvider: typeof R.BrowserRouter = (...args) => R.BrowserRouter(...args);
export const BaseLocationProvider: typeof R.Router = (...args) => R.Router(...args);
