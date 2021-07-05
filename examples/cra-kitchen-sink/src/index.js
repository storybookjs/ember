import React from 'react';
import ReactDOM from 'react-dom';
import global from 'global';

import App from './App';
import './index.css';

const { document } = global;

ReactDOM.render(<App />, document.getElementById('root'));
