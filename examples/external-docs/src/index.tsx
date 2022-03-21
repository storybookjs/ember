/* global document */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import StoriesPage from './StoriesPage';
import SecondStoriesPage from './SecondStoriesPage';

const Router = ({ routes }: { routes: (() => JSX.Element)[] }) => {
  const [routeNumber, setRoute] = useState(0);
  const Route = routes[routeNumber];

  console.log(routeNumber);
  return (
    <div>
      <Route />
      {/* eslint-disable-next-line react/button-has-type */}
      <button onClick={() => setRoute((routeNumber + 1) % routes.length)}>Next Route</button>
    </div>
  );
};

const App = () => <Router routes={[StoriesPage, SecondStoriesPage]} />;

ReactDOM.render(<App />, document.getElementById('root'));
