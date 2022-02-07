import React, { useState } from 'react';
import { Story, StorySkeleton, StoryError } from './Story';
import { Button } from '../Button/Button';

export default {
  title: 'Docs/Story',
  component: Story,
};

const buttonFn = () => <Button secondary>Inline story</Button>;

const buttonHookFn = () => {
  const [count, setCount] = useState(0);
  return (
    <Button secondary onClick={() => setCount(count + 1)}>
      {`count: ${count}`}
    </Button>
  );
};

export const Loading = () => <StorySkeleton />;

export const Inline = () => <Story id="id" inline storyFn={buttonFn} title="hello button" />;

export const Error = () => <Story id="id" error={StoryError.NO_STORY} />;

export const ReactHook = () => <Story id="id" inline storyFn={buttonHookFn} title="hello button" />;
