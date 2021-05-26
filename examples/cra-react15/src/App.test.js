import React from 'react';
import ReactDOM from 'react-dom';
import global from 'global';
import App from './App';

const { document } = global;

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
