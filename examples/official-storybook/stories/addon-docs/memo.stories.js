import React from 'react';
import { MemoButton } from '../../components/MemoButton';

export default {
  title: 'Addons/Docs/Memo',
  component: MemoButton,
  parameters: {
    chromatic: { disable: true },
    docs: { source: { type: 'dynamic' } },
  },
};

export const DisplaysCorrectly = () => <MemoButton label="Hello memo World" />;
DisplaysCorrectly.storyName = 'Displays components with memo correctly';
