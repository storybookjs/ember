import global from 'global';
import React, { ReactNode, useCallback } from 'react';

import {
  Link,
  BrowserRouter,
  useNavigate,
  useLocation,
  NavigateOptions,
  Router,
} from 'react-router-dom';
import { ToggleVisibility } from './visibility';
import { queryFromString, parsePath, getMatch, StoryData } from './utils';

const { document } = global;

interface Other extends StoryData {
  path: string;
  singleStory?: boolean;
}

export type RouterData = {
  location: Partial<Location>;
  navigate: ReturnType<typeof useQueryNavigate>;
} & Other;

export type RenderData = Pick<RouterData, 'location'> & Other;

interface MatchingData {
  match: null | { path: string };
}

interface QueryLocationProps {
  children: (renderData: RenderData) => ReactNode;
}
interface QueryMatchProps {
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

export interface QueryLinkProps {
  to: string;
  children: ReactNode;
}

const getBase = () => `${document.location.pathname}?`;

type ExpandedNavigateOptions = NavigateOptions & { plain?: boolean };

// const queryNavigate: NavigateFn = (to: string | number, options?: NavigateOptions<{}>) =>
//   typeof to === 'number' ? navigate(to) : navigate(`${getBase()}path=${to}`, options);

const useQueryNavigate = () => {
  const navigate = useNavigate();

  return useCallback((to: string | number, options?: ExpandedNavigateOptions) => {
    if (typeof to === 'string' && to.startsWith('#')) {
      document.location.hash = to;
      return undefined;
    }
    if (typeof to === 'string') {
      const target = options?.plain ? to : `?path=${to}`;
      return navigate(target, options);
    }
    if (typeof to === 'number') {
      return navigate(to);
    }

    return undefined;
  }, []);
};

// A component that will navigate to a new location/path when clicked
const QueryLink = ({ to, children, ...rest }: QueryLinkProps) => (
  <Link to={`${getBase()}path=${to}`} {...rest}>
    {children}
  </Link>
);
QueryLink.displayName = 'QueryLink';

// A render-prop component where children is called with a location
// and will be called whenever it changes when it changes
const QueryLocation = ({ children }: QueryLocationProps) => {
  const location = useLocation();
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
QueryLocation.displayName = 'QueryLocation';

// A render-prop component for rendering when a certain path is hit.
// It's immensely similar to `Location` but it receives an addition data property: `match`.
// match has a truthy value when the path is hit.
const QueryMatch = ({ children, path: targetPath, startsWith = false }: QueryMatchProps) => (
  <QueryLocation>
    {({ path: urlPath, ...rest }) =>
      children({
        match: getMatch(urlPath, targetPath, startsWith),
        ...rest,
      })
    }
  </QueryLocation>
);
QueryMatch.displayName = 'QueryMatch';

// A component to conditionally render children based on matching a target path
const Route = ({ path, children, startsWith = false, hideOnly = false }: RouteProps) => (
  <QueryMatch path={path} startsWith={startsWith}>
    {({ match }) => {
      if (hideOnly) {
        return <ToggleVisibility hidden={!match}>{children}</ToggleVisibility>;
      }
      return match ? children : null;
    }}
  </QueryMatch>
);
Route.displayName = 'Route';

export { QueryLink as Link };
export { QueryMatch as Match };
export { QueryLocation as Location };
export { Route };
export { useQueryNavigate as useNavigate };
export { BrowserRouter as LocationProvider };
export { Router as BaseLocationProvider };
export { useNavigate as usePlainNavigate };

// eslint-disable-next-line no-undef
export type { ExpandedNavigateOptions as NavigateOptions };
