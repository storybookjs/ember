import React from 'react';

export default {
  title: 'Addons/Outline',
};

const OutlineButton = () => (
  <svg viewBox="0 0 1024 1024" width="1em" height="1em">
    <path
      stroke="#000"
      d="M180.1 714.3V844h129.6v94.8h-180c-24.2 0-44-19.5-44.4-43.7V714.3h94.8zM619.3 844v94.8H404.7v-94.8h214.6zm319.4-129.6v180c0 24.2-19.5 44-43.7 44.4H714.3v-94.8H844V714.3h94.8zm0-309.6v214.6h-94.8V404.7h94.8zm-758.6 0v214.6H85.3V404.7h94.8zm331.9 34a73.2 73.2 0 110 146.4 73.2 73.2 0 010-146.3zM894.2 85.4c24.3 0 44 19.5 44.5 43.7V309.7h-94.8V180H714.3V85.3h180zm-584.5 0v94.8H180v129.6H85.3v-180c0-24.2 19.5-44 43.7-44.4H309.7zm309.6 0v94.8H404.7V85.3h214.6z"
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
      Click the <OutlineButton /> outline button in the toolbar to toggle outlines
    </p>
  </div>
);
