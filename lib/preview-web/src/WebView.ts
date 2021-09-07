import global from 'global';
import { logger } from '@storybook/client-logger';
import AnsiToHtml from 'ansi-to-html';
import dedent from 'ts-dedent';

import { Story } from '@storybook/store';

const { document } = global;

const layoutClassMap = {
  centered: 'sb-main-centered',
  fullscreen: 'sb-main-fullscreen',
  padded: 'sb-main-padded',
} as const;
type Layout = keyof typeof layoutClassMap | 'none';

const classes = {
  MAIN: 'sb-show-main',
  NOPREVIEW: 'sb-show-nopreview',
  ERROR: 'sb-show-errordisplay',
};

const ansiConverter = new AnsiToHtml({
  escapeXML: true,
});

export class WebView {
  currentLayoutClass?: typeof layoutClassMap[keyof typeof layoutClassMap] | null;

  // Get ready to render a story, returning the element to render to
  prepareForStory(story: Story<any>) {
    this.showStory();
    this.applyLayout(story.parameters.layout);

    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;

    return this.storyRoot();
  }

  storyRoot(): Element {
    return document.getElementById('root');
  }

  prepareForDocs() {
    this.showMain();
    this.showDocs();
    this.applyLayout('fullscreen');
    return this.docsRoot();
  }

  docsRoot(): Element {
    return document.getElementById('docs-root');
  }

  applyLayout(layout: Layout = 'padded') {
    if (layout === 'none') {
      document.body.classList.remove(this.currentLayoutClass);
      this.currentLayoutClass = null;
      return;
    }

    this.checkIfLayoutExists(layout);

    const layoutClass = layoutClassMap[layout];

    document.body.classList.remove(this.currentLayoutClass);
    document.body.classList.add(layoutClass);
    this.currentLayoutClass = layoutClass;
  }

  checkIfLayoutExists(layout: keyof typeof layoutClassMap) {
    if (!layoutClassMap[layout]) {
      logger.warn(
        dedent`The desired layout: ${layout} is not a valid option.
         The possible options are: ${Object.keys(layoutClassMap).join(', ')}, none.`
      );
    }
  }

  showErrorDisplay({ message = '', stack = '' }) {
    document.getElementById('error-message').innerHTML = ansiConverter.toHtml(message);
    document.getElementById('error-stack').innerHTML = ansiConverter.toHtml(stack);

    document.body.classList.remove(classes.MAIN);
    document.body.classList.remove(classes.NOPREVIEW);

    document.body.classList.add(classes.ERROR);
  }

  showNoPreview() {
    document.body.classList.remove(classes.MAIN);
    document.body.classList.remove(classes.ERROR);

    document.body.classList.add(classes.NOPREVIEW);
  }

  showMain() {
    document.body.classList.remove(classes.NOPREVIEW);
    document.body.classList.remove(classes.ERROR);

    document.body.classList.add(classes.MAIN);
  }

  showDocs() {
    document.getElementById('root').setAttribute('hidden', 'true');
    document.getElementById('docs-root').removeAttribute('hidden');
  }

  showStory() {
    document.getElementById('docs-root').setAttribute('hidden', 'true');
    document.getElementById('root').removeAttribute('hidden');
  }
}
