import React, { Fragment, FunctionComponent, MouseEvent } from 'react';
import { styled } from '@storybook/theming';

import { FlexBar } from '../bar/bar';
import { Icons } from '../icon/icon';
import { IconButton, IconButtonSkeleton } from '../bar/button';

import { getStoryHref } from '../utils/getStoryHref';

interface ZoomProps {
  zoom: (val: number) => void;
  resetZoom: () => void;
}

interface EjectProps {
  storyId?: string;
  baseUrl?: string;
}

interface BarProps {
  border?: boolean;
}

interface LoadingProps {
  isLoading?: boolean;
}

export type ToolbarProps = BarProps & ZoomProps & EjectProps & LoadingProps;

const Zoom: FunctionComponent<ZoomProps> = ({ zoom, resetZoom }) => (
  <>
    <IconButton
      key="zoomin"
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        zoom(0.8);
      }}
      title="Zoom in"
    >
      <Icons icon="zoom" />
    </IconButton>
    <IconButton
      key="zoomout"
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        zoom(1.25);
      }}
      title="Zoom out"
    >
      <Icons icon="zoomout" />
    </IconButton>
    <IconButton
      key="zoomreset"
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        resetZoom();
      }}
      title="Reset zoom"
    >
      <Icons icon="zoomreset" />
    </IconButton>
  </>
);

const Eject: FunctionComponent<EjectProps> = ({ baseUrl, storyId }) => (
  <IconButton
    key="opener"
    href={getStoryHref(baseUrl, storyId)}
    target="_blank"
    title="Open canvas in new tab"
  >
    <Icons icon="share" />
  </IconButton>
);

const Bar = styled(FlexBar)({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  transition: 'transform .2s linear',
});

export const Toolbar: FunctionComponent<ToolbarProps> = ({
  isLoading,
  storyId,
  baseUrl,
  zoom,
  resetZoom,
  ...rest
}) => (
  <Bar {...rest}>
    <Fragment key="left">
      {isLoading ? (
        [1, 2, 3].map((key) => <IconButtonSkeleton key={key} />)
      ) : (
        <Zoom {...{ zoom, resetZoom }} />
      )}
    </Fragment>
    <Fragment key="right">
      {storyId && (isLoading ? <IconButtonSkeleton /> : <Eject {...{ storyId, baseUrl }} />)}
    </Fragment>
  </Bar>
);
