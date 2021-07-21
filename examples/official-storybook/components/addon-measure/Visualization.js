import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { drawSelectedElement } from '@storybook/addon-measure/dist/cjs/box-model/visualizer';
// eslint-disable-next-line import/no-extraneous-dependencies
import { init, destroy } from '@storybook/addon-measure/dist/cjs/box-model/canvas';

export const Visualization = ({ render }) => {
  const element = useRef(null);

  useEffect(() => {
    if (element.current) {
      init();
      drawSelectedElement(element.current);
    }

    return () => {
      destroy();
    };
  }, [element]);

  return (
    <div
      style={{
        display: 'inline-block',
        padding: 64,
      }}
    >
      {render(element)}
    </div>
  );
};

Visualization.propTypes = {
  render: PropTypes.func.isRequired,
};
