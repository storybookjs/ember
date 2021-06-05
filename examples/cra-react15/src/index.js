import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import global from 'global';
import App from './App';

const { document } = global;

ReactDOM.render(<App />, document.getElementById('root'));
