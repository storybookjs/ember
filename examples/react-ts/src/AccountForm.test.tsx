import React from 'react';
import { render, screen } from '@testing-library/react';

import { composeStories, composeStory } from '@storybook/react';

import * as stories from './AccountForm.stories';

const { Standard } = composeStories(stories);

test('renders form', async () => {
  await render(<Standard />);
});

test('fills input from play function', async () => {
  // @ts-ignore
  const StandardEmailFilled = composeStory(stories.StandardEmailFilled, stories.default);
  const { container } = await render(<StandardEmailFilled />);

  // @ts-ignore
  await StandardEmailFilled.play({ canvasElement: container });

  const emailInput = screen.getByTestId('email') as HTMLInputElement;
  expect(emailInput.value).toBe('michael@chromatic.com');
});
