import { Component, getPlatform, ɵresetJitOptions } from '@angular/core';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Parameters } from '../types-6-0';

import { CanvasRenderer } from './CanvasRenderer';
import { RendererFactory } from './RendererFactory';
import { DocsRenderer } from './DocsRenderer';

jest.mock('@angular/platform-browser-dynamic');

declare const document: Document;
describe('RendererFactory', () => {
  let rendererFactory: RendererFactory;
  let rootTargetDOMNode: HTMLElement;
  let rootDocstargetDOMNode: HTMLElement;

  beforeEach(async () => {
    rendererFactory = new RendererFactory();
    document.body.innerHTML =
      '<div id="root"></div><div id="root-docs"><div id="story-in-docs"></div></div>';
    rootTargetDOMNode = global.document.getElementById('root');
    rootDocstargetDOMNode = global.document.getElementById('root-docs');
    (platformBrowserDynamic as any).mockImplementation(platformBrowserDynamicTesting);
  });

  afterEach(() => {
    jest.clearAllMocks();

    // Necessary to avoid this error "Provided value for `preserveWhitespaces` can not be changed once it has been set." :
    // Source: https://github.com/angular/angular/commit/e342ffd855ffeb8af7067b42307ffa320d82177e#diff-92b125e532cc22977b46a91f068d6d7ea81fd61b772842a4a0212f1cfd875be6R28
    ɵresetJitOptions();
  });

  describe('CanvasRenderer', () => {
    it('should get CanvasRenderer instance', async () => {
      const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      expect(render).toBeInstanceOf(CanvasRenderer);
    });

    it('should render my-story for story template', async () => {
      const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await render.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
        },
        forced: false,
        parameters: {},
        targetDOMNode: rootTargetDOMNode,
      });

      expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('🦊');
    });

    it('should render my-story for story component', async () => {
      @Component({ selector: 'foo', template: '🦊' })
      class FooComponent {}

      const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await render.render({
        storyFnAngular: {
          props: {},
        },
        forced: false,
        parameters: {},
        component: FooComponent,
        targetDOMNode: rootTargetDOMNode,
      });

      expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe(
        '<foo>🦊</foo><!--container-->'
      );
    });

    it('should handle circular reference in moduleMetadata', async () => {
      class Thing {
        token: Thing;

        constructor() {
          this.token = this;
        }
      }
      const token = new Thing();

      const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await render.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
          moduleMetadata: { providers: [{ provide: 'foo', useValue: token }] },
        },
        forced: false,
        parameters: {},
        targetDOMNode: rootTargetDOMNode,
      });

      expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('🦊');
    });

    describe('when forced=true', () => {
      beforeEach(async () => {
        // Init first render
        const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
        await render.render({
          storyFnAngular: {
            template: '{{ logo }}: {{ name }}',
            props: {
              logo: '🦊',
              name: 'Fox',
            },
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });
      });

      it('should be rendered a first time', async () => {
        expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('🦊: Fox');
      });

      it('should not be re-rendered when only props change', async () => {
        let countDestroy = 0;

        getPlatform().onDestroy(() => {
          countDestroy += 1;
        });
        // only props change
        const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
        await render.render({
          storyFnAngular: {
            props: {
              logo: '👾',
            },
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });
        expect(countDestroy).toEqual(0);

        expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('👾: Fox');
      });

      it('should be re-rendered when template change', async () => {
        const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
        await render.render({
          storyFnAngular: {
            template: '{{ beer }}',
            props: {
              beer: '🍺',
            },
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });

        expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('🍺');
      });

      it('should be re-rendered when moduleMetadata structure change', async () => {
        let countDestroy = 0;

        getPlatform().onDestroy(() => {
          countDestroy += 1;
        });

        // Only props change -> no full rendering
        const firstRender = await rendererFactory.getRendererInstance(
          'my-story',
          rootTargetDOMNode
        );
        await firstRender.render({
          storyFnAngular: {
            template: '{{ logo }}: {{ name }}',
            props: {
              logo: '🍺',
              name: 'Beer',
            },
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });
        expect(countDestroy).toEqual(0);

        // Change in the module structure -> full rendering
        const secondRender = await rendererFactory.getRendererInstance(
          'my-story',
          rootTargetDOMNode
        );
        await secondRender.render({
          storyFnAngular: {
            template: '{{ logo }}: {{ name }}',
            props: {
              logo: '🍺',
              name: 'Beer',
            },
            moduleMetadata: { providers: [{ provide: 'foo', useValue: 42 }] },
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });
        expect(countDestroy).toEqual(1);
      });
    });

    it('should properly destroy angular platform between each render', async () => {
      let countDestroy = 0;

      const firstRender = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await firstRender.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
        },
        forced: false,
        parameters: {},
        targetDOMNode: rootTargetDOMNode,
      });

      getPlatform().onDestroy(() => {
        countDestroy += 1;
      });

      const secondRender = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await secondRender.render({
        storyFnAngular: {
          template: '🐻',
          props: {},
        },
        forced: false,
        parameters: {},
        targetDOMNode: rootTargetDOMNode,
      });

      expect(countDestroy).toEqual(1);
    });
  });

  describe('DocsRenderer', () => {
    describe('when canvas render is done before', () => {
      beforeEach(async () => {
        // Init first Canvas render
        const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
        await render.render({
          storyFnAngular: {
            template: 'Canvas 🖼',
          },
          forced: true,
          parameters: {},
          targetDOMNode: rootTargetDOMNode,
        });
      });

      it('should reset root HTML', async () => {
        global.document.getElementById('root').appendChild(global.document.createElement('👾'));

        expect(global.document.getElementById('root').innerHTML).toContain('Canvas 🖼');
        const render = await rendererFactory.getRendererInstance(
          'my-story-in-docs',
          rootDocstargetDOMNode
        );
        expect(global.document.getElementById('root').innerHTML).toBe('');
      });
    });

    it('should get DocsRenderer instance', async () => {
      const render = await rendererFactory.getRendererInstance(
        'my-story-in-docs',
        rootDocstargetDOMNode
      );
      expect(render).toBeInstanceOf(DocsRenderer);
    });
  });

  describe('bootstrap module options', () => {
    async function setupComponentWithWhitespace(bootstrapModuleOptions: unknown) {
      const render = await rendererFactory.getRendererInstance('my-story', rootTargetDOMNode);
      await render.render({
        storyFnAngular: {
          template: '<div>   </div>',
          props: {},
        },
        forced: false,
        parameters: {
          bootstrapModuleOptions,
        } as Parameters,
        targetDOMNode: rootTargetDOMNode,
      });
    }

    it('should preserve whitespaces', async () => {
      await setupComponentWithWhitespace({ preserveWhitespaces: true });
      expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('<div>   </div>');
    });

    it('should remove whitespaces', async () => {
      await setupComponentWithWhitespace({ preserveWhitespaces: false });
      expect(document.body.getElementsByTagName('my-story')[0].innerHTML).toBe('<div></div>');
    });
  });
});
