import React, { FunctionComponent, ReactNode, useState } from 'react';
import { Global, styled } from '@storybook/theming';
import { Icons, IconButton, WithTooltip, TooltipLinkList } from '@storybook/components';

import { Filters } from './ColorFilters';

const iframeId = 'storybook-preview-iframe';

interface Option {
  name: string;
  percentage?: number;
}

const baseList = [
  { name: 'blurred vision', percentage: 22.9 },
  { name: 'deuteranomaly', percentage: 2.7 },
  { name: 'deuteranopia', percentage: 0.56 },
  { name: 'protanomaly', percentage: 0.66 },
  { name: 'protanopia', percentage: 0.59 },
  { name: 'tritanomaly', percentage: 0.01 },
  { name: 'tritanopia', percentage: 0.016 },
  { name: 'achromatomaly', percentage: 0.00001 },
  { name: 'achromatopsia', percentage: 0.0001 },
  { name: 'grayscale' },
] as Option[];

type Filter = Option | null;

const getFilter = (filter: Filter) => {
  if (!filter) {
    return 'none';
  }
  if (filter.name === 'blurred vision') {
    return 'blur(2px)';
  }
  if (filter.name === 'grayscale') {
    return 'grayscale(100%)';
  }
  return `url('#${filter}')`;
};

const Hidden = styled.div(() => ({
  '&, & svg': {
    position: 'absolute',
    width: 0,
    height: 0,
  },
}));

const ColorIcon = styled.span<{ filter: Filter }>(
  {
    background: 'linear-gradient(to right, #F44336, #FF9800, #FFEB3B, #8BC34A, #2196F3, #9C27B0)',
    borderRadius: '1rem',
    display: 'block',
    height: '1rem',
    width: '1rem',
  },
  ({ filter }) => ({
    filter: getFilter(filter),
  }),
  ({ theme }) => ({
    boxShadow: `${theme.appBorderColor} 0 0 0 1px inset`,
  })
);

export interface Link {
  id: string;
  title: ReactNode;
  right?: ReactNode;
  active: boolean;
  onClick: () => void;
}

const Column = styled.span({
  display: 'flex',
  flexDirection: 'column',
});

const Title = styled.span({
  textTransform: 'capitalize',
});

const Description = styled.span({
  fontSize: '0.9em',
  color: 'gray',
});

const getColorList = (active: Filter, set: (i: Filter) => void): Link[] => [
  ...(active !== null
    ? [
        {
          id: 'reset',
          title: 'Reset color filter',
          onClick: () => {
            set(null);
          },
          right: undefined,
          active: false,
        },
      ]
    : []),
  ...baseList.map((i) => {
    const description = i.percentage !== undefined ? `${i.percentage}% of users` : undefined;
    return {
      id: i.name,
      title: (
        <Column>
          <Title>{i.name}</Title>
          {description && <Description>{description}</Description>}
        </Column>
      ),
      onClick: () => {
        set(i);
      },
      right: <ColorIcon filter={i} />,
      active: active === i,
    };
  }),
];

export const VisionSimulator = () => {
  const [filter, setFilter] = useState<Filter>(null);

  return (
    <>
      {filter && (
        <Global
          styles={{
            [`#${iframeId}`]: {
              filter: getFilter(filter),
            },
          }}
        />
      )}
      <WithTooltip
        placement="top"
        trigger="click"
        tooltip={({ onHide }) => {
          const colorList = getColorList(filter, (i) => {
            setFilter(i);
            onHide();
          });
          return <TooltipLinkList links={colorList} />;
        }}
        closeOnClick
        onDoubleClick={() => setFilter(null)}
      >
        <div id="lol">
          coucou
          {/* <IconButton key="filter" active={!!filter} title="Vision simulator">
            <Icons icon="accessibility" />
          </IconButton> */}
        </div>
      </WithTooltip>
      {/* <Hidden>
        <Filters />
      </Hidden> */}
    </>
  );
};
