import React, { Fragment, FunctionComponent, useMemo, useEffect, useState } from 'react';
import { Button } from '@storybook/components';
import { Global, CSSObject, styled } from '@storybook/theming';
import { IFrame } from './iframe';
import { FramesRendererProps } from './utils/types';
import { stringifyQueryParams } from './utils/stringifyQueryParams';

const getActive = (refId: FramesRendererProps['refId']) => {
  if (refId) {
    return `storybook-ref-${refId}`;
  }

  return 'storybook-preview-iframe';
};

const SkipToContentLink = styled(Button)`
  display: none;
  @media (min-width: 600px) {
    display: block;
    position: absolute;
    top: 10px;
    right: 15px;
    padding: 10px 15px;
    font-size: ${(props) => props.theme.typography.size.s1};
    transform: translateY(-100px);
    &:focus {
      transform: translateY(0);
      z-index: 1;
    }
  }
`;

export const FramesRenderer: FunctionComponent<FramesRendererProps> = ({
  refs,
  story,
  scale,
  viewMode = 'story',
  refId,
  queryParams = {},
  baseUrl,
  storyId = '*',
}) => {
  const version = refs[refId]?.version;
  const stringifiedQueryParams = stringifyQueryParams({
    ...queryParams,
    ...(version && { version }),
  });
  const active = getActive(refId);

  const styles = useMemo<CSSObject>(() => {
    return {
      '[data-is-storybook="false"]': {
        visibility: 'hidden',
      },
      '[data-is-storybook="true"]': {
        visibility: 'visible',
      },
    };
  }, []);

  const [frames, setFrames] = useState<Record<string, string>>({
    'storybook-preview-iframe': `${baseUrl}?id=${storyId}&viewMode=${viewMode}${stringifiedQueryParams}`,
  });

  useEffect(() => {
    const newFrames = Object.values(refs)
      .filter((r) => {
        if (r.error) {
          return false;
        }
        if (r.type === 'auto-inject') {
          return true;
        }
        if (story && r.id === story.refId) {
          return true;
        }

        return false;
      })
      .reduce((acc, r) => {
        return {
          ...acc,
          [`storybook-ref-${r.id}`]: `${r.url}/iframe.html?id=${storyId}&viewMode=${viewMode}&refId=${r.id}${stringifiedQueryParams}`,
        };
      }, frames);

    setFrames(newFrames);
  }, [storyId, story, refs]);

  return (
    <Fragment>
      <Global styles={styles} />
      {Object.entries(frames).map(([id, src]) => (
        <Fragment key={id}>
          <SkipToContentLink secondary isLink tabIndex={0} href={`#${storyId}`}>
            Skip to sidebar
          </SkipToContentLink>
          <IFrame
            active={id === active}
            key={refs[id] ? refs[id].url : id}
            id={id}
            title={id}
            src={src}
            allowFullScreen
            scale={scale}
          />
        </Fragment>
      ))}
    </Fragment>
  );
};
