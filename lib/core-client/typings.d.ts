declare module 'ansi-to-html';
declare module '@storybook/web-preview/dist/cjs/WebPreview.mockdata';

declare class AnsiToHtml {
  constructor(options: { escapeHtml: boolean });

  toHtml: (ansi: string) => string;
}
