import React from 'react';
import { DocsProvider, Meta, Story } from './blocks';

import meta, { WithArgs, Basic } from './button.stories';
import EmojiMeta, { WithArgs as EmojiWithArgs } from './emoji-button.stories';

export default () => (
  <DocsProvider>
    <div>
      <Meta of={meta} />

      <Story of={WithArgs} />
      <Story of={Basic} />

      <Story of={EmojiWithArgs} meta={EmojiMeta} />
    </div>
  </DocsProvider>
);
