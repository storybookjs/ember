import React from 'react';

export default {
  title: 'Addons/Measure/Grid',
};

const MeasureButton = () => (
  <svg viewBox="0 0 1024 1024" width="1em" height="1em">
    <path
      stroke="#000"
      d="M83 110c-22 0-40 18-40 40v176a40 40 0 0080 0v-49h778v49a40 40 0 0080 0V150a40 40 0 10-80 0v49H123v-49c0-22-18-40-40-40zm40 458v266h778V568h-63v115a40 40 0 11-80 0V568h-63v46a40 40 0 11-80 0v-46h-63v115a40 40 0 11-80 0V568h-63v46a40 40 0 11-80 0v-46h-63v115a40 40 0 11-80 0V568h-63zm103-80h691c36 0 64 28 64 64v298c0 36-28 64-64 64H107c-36 0-64-28-64-64V552c0-36 28-64 64-64h119z"
    />
  </svg>
);

export const Basic = () => (
  <div>
    <div
      style={{
        display: 'grid',
        gridGap: 10,
        gridTemplateColumns: 'repeat(6, 100px)',
        gridTemplateRows: '100px 100px 100px',
        gridAutoFlow: 'column',
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((id) => (
        <div
          key={id}
          style={{
            backgroundColor: id % 2 === 0 ? '#444' : '#ccc',
            color: id % 2 === 0 ? '#fff' : '#000',
            borderRadius: 5,
            padding: 20,
            fontSize: '150%',
          }}
        >
          {id}
        </div>
      ))}
    </div>
    <p>
      Click the <MeasureButton /> measure button in the toolbar to enable the addon
    </p>
  </div>
);
