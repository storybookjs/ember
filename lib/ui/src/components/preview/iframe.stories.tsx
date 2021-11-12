import React, { CSSProperties } from 'react';

import { IFrame } from './iframe';

export default {
  component: IFrame,
  title: 'UI/Iframe',
};

const style: CSSProperties = {
  maxWidth: '700px',
  height: '500px',
  border: '2px solid hotpink',
  position: 'relative',
};

export const WorkingStory = () => (
  <IFrame
    active
    id="iframe"
    title="Missing"
    src="/iframe.html?id=ui-panel--default"
    allowFullScreen
    style={style}
    scale={1.0}
  />
);
WorkingStory.parameters = {
  chromatic: { disable: true },
};

export const MissingStory = () => (
  <IFrame
    active
    id="iframe"
    title="Missing"
    src="/iframe.html?id=missing"
    allowFullScreen
    style={style}
    scale={1.0}
  />
);

export const preparingStory = () => (
  <IFrame
    active
    id="iframe"
    title="Preparing Story"
    src="/iframe.html?__SPECIAL_TEST_PARAMETER__=preparing-story"
    allowFullScreen
    style={style}
    scale={1.0}
  />
);

export const preparingDocs = () => (
  <IFrame
    active
    id="iframe"
    title="Preparing Docs"
    src="/iframe.html?__SPECIAL_TEST_PARAMETER__=preparing-docs"
    allowFullScreen
    style={style}
    scale={1.0}
  />
);
