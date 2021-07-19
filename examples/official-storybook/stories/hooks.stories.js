import React, { useContext, createContext } from 'react';
import { useEffect, useRef, useState } from '@storybook/client-api';

const Consumer = () => {
  // testing hooks in the component itself,
  // rendering JSX for the component without decorators
  // per https://github.com/storybookjs/storybook/pull/14652/
  const value = useContext(DummyContext);
  return <div>value: {value}</div>;
};

export default {
  title: 'Core/Hooks',
  component: Consumer,
};

export const Checkbox = () => {
  const [on, setOn] = useState(false);
  return (
    <label>
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      On
    </label>
  );
};

export const Input = () => {
  const [text, setText] = useState('foo');
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
};

export const Effect = () => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current != null) {
      ref.current.style.backgroundColor = 'yellow';
    }
  });

  return (
    <button type="button" ref={ref}>
      I should be yellow
    </button>
  );
};

export const ReactHookCheckbox = () => {
  const [on, setOn] = React.useState(false);
  return (
    <label>
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      On
    </label>
  );
};

const DummyContext = createContext({});

export const Context = (args) => {
  // testing hooks in the story
  const storyContext = useContext(DummyContext);
  return <Consumer />;
};

Context.decorators = [
  (Story) => (
    <DummyContext.Provider value="hello">
      <Story />
    </DummyContext.Provider>
  ),
];
