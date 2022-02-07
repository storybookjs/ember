import global from 'global';
import { logger } from '@storybook/client-logger';
import AnsiToHtml from 'ansi-to-html';
import dedent from 'ts-dedent';
import qs from 'qs';

import { Story } from '@storybook/store';

const { document } = global;

const layoutClassMap = {
  centered: 'sb-main-centered',
  fullscreen: 'sb-main-fullscreen',
  padded: 'sb-main-padded',
} as const;
type Layout = keyof typeof layoutClassMap | 'none';

enum Mode {
  'MAIN' = 'MAIN',
  'NOPREVIEW' = 'NOPREVIEW',
  'PREPARING_STORY' = 'PREPARING_STORY',
  'PREPARING_DOCS' = 'PREPARING_DOCS',
  'ERROR' = 'ERROR',
}
const classes: Record<Mode, string> = {
  PREPARING_STORY: 'sb-show-preparing-story',
  PREPARING_DOCS: 'sb-show-preparing-docs',
  MAIN: 'sb-show-main',
  NOPREVIEW: 'sb-show-nopreview',
  ERROR: 'sb-show-errordisplay',
};

const ansiConverter = new AnsiToHtml({
  escapeXML: true,
});

export class WebView {
  currentLayoutClass?: typeof layoutClassMap[keyof typeof layoutClassMap] | null;

  testing = false;

  constructor() {
    // Special code for testing situations
    const { __SPECIAL_TEST_PARAMETER__ } = qs.parse(document.location.search, {
      ignoreQueryPrefix: true,
    });
    switch (__SPECIAL_TEST_PARAMETER__) {
      case 'preparing-story': {
        this.showPreparingStory();
        this.testing = true;
        break;
      }
      case 'preparing-docs': {
        this.showPreparingDocs();
        this.testing = true;
        break;
      }
      default: // pass;
    }
  }

  // Get ready to render a story, returning the element to render to
  prepareForStory(story: Story<any>) {
    this.showStory();
    this.applyLayout(story.parameters.layout);

    document.documentElement.scrollTop = 0;
    document.documentElement.scrollLeft = 0;

    return this.storyRoot();
  }

  storyRoot(): HTMLElement {
    return document.getElementById('root');
  }

  prepareForDocs() {
    this.showMain();
    this.showDocs();
    this.applyLayout('fullscreen');
    return this.docsRoot();
  }

  docsRoot(): HTMLElement {
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

  showMode(mode: Mode) {
    Object.keys(Mode).forEach((otherMode) => {
      if (otherMode === mode) {
        document.body.classList.add(classes[otherMode]);
      } else {
        document.body.classList.remove(classes[otherMode as Mode]);
      }
    });
  }

  showErrorDisplay({ message = '', stack = '' }) {
    let header = message;
    let detail = stack;
    const parts = message.split('\n');
    if (parts.length > 1) {
      [header] = parts;
      detail = parts.slice(1).join('\n');
    }

    document.getElementById('error-message').innerHTML = ansiConverter.toHtml(header);
    document.getElementById('error-stack').innerHTML = ansiConverter.toHtml(detail);

    this.showMode(Mode.ERROR);
  }

  showNoPreview() {
    if (this.testing) return;

    this.showMode(Mode.NOPREVIEW);

    // In storyshots this can get called and these two can be null
    this.storyRoot()?.setAttribute('hidden', 'true');
    this.docsRoot()?.setAttribute('hidden', 'true');
  }

  showPreparingStory() {
    this.showMode(Mode.PREPARING_STORY);
  }

  showPreparingDocs() {
    this.showMode(Mode.PREPARING_DOCS);
  }

  showMain() {
    this.showMode(Mode.MAIN);
  }

  showDocs() {
    this.storyRoot().setAttribute('hidden', 'true');
    this.docsRoot().removeAttribute('hidden');
  }

  showStory() {
    this.docsRoot().setAttribute('hidden', 'true');
    this.storyRoot().removeAttribute('hidden');
  }
}
