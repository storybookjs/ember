/* eslint-disable storybook/use-storybook-expect */
/* eslint-disable storybook/await-interactions */
import React, { useState } from 'react';
import { styled } from '@storybook/theming';

const BlockDiv = styled.div({
  display: 'inline-block',
  height: 400,
  width: 400,
  background: 'hotpink',
});

export default {
  title: 'Addons/Storyshots',
};

export const Block = () => {
  const [hover, setHover] = useState(false);

  return (
    <BlockDiv
      data-test-block
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && 'I am hovered'}
    </BlockDiv>
  );
};
Block.storyName = 'Block story';

Block.parameters = {
  async puppeteerTest(page) {
    const element = await page.$('[data-test-block]');
    await element.hover();
    const textContent = await element.getProperty('textContent');
    const text = await textContent.jsonValue();
    // eslint-disable-next-line jest/no-standalone-expect
    expect(text).toBe('I am hovered');
  },
};
