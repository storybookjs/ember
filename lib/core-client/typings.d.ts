declare module 'ansi-to-html';
declare class AnsiToHtml {
  constructor(options: { escapeHtml: boolean });

  toHtml: (ansi: string) => string;
}

// FIXME refactor in progress
declare module '@storybook/client-api/dist/esm/new/StoryStore';
declare type StoryStore<T> = any;
