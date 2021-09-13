import { Component, ɵresetJitOptions } from '@angular/core';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Parameters } from '../types-6-0';
import { RendererService } from './RendererService';

jest.mock('@angular/platform-browser-dynamic');

declare const document: Document;
describe('RendererService', () => {
  let rendererService: RendererService;

  beforeEach(async () => {
    document.body.innerHTML = '<div id="root"></div>';
    (platformBrowserDynamic as any).mockImplementation(platformBrowserDynamicTesting);
    rendererService = new RendererService();
  });

  afterEach(() => {
    jest.clearAllMocks();

    // Necessary to avoid this error "Provided value for `preserveWhitespaces` can not be changed once it has been set." :
    // Source: https://github.com/angular/angular/commit/e342ffd855ffeb8af7067b42307ffa320d82177e#diff-92b125e532cc22977b46a91f068d6d7ea81fd61b772842a4a0212f1cfd875be6R28
    ɵresetJitOptions();
  });

  it('should initialize', () => {
    expect(rendererService).toBeDefined();
  });

  describe('render', () => {
    it('should add storybook-wrapper for story template', async () => {
      await rendererService.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
        },
        forced: false,
        parameters: {},
      });

      expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe('🦊');
    });

    it('should add storybook-wrapper for story component', async () => {
      @Component({ selector: 'foo', template: '🦊' })
      class FooComponent {}

      await rendererService.render({
        storyFnAngular: {
          props: {},
        },
        forced: false,
        component: FooComponent,
        parameters: {},
      });

      expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
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

      await rendererService.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
          moduleMetadata: { providers: [{ provide: 'foo', useValue: token }] },
        },
        forced: false,
        parameters: {},
      });

      expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe('🦊');
    });

    describe('when forced=true', () => {
      beforeEach(async () => {
        // Init first render
        await rendererService.render({
          storyFnAngular: {
            template: '{{ logo }}: {{ name }}',
            props: {
              logo: '🦊',
              name: 'Fox',
            },
          },
          forced: true,
          parameters: {},
        });
      });

      it('should be rendered a first time', async () => {
        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '🦊: Fox'
        );
      });

      it('should not be re-rendered when only props change', async () => {
        let countDestroy = 0;

        rendererService.platform.onDestroy(() => {
          countDestroy += 1;
        });
        // only props change
        await rendererService.render({
          storyFnAngular: {
            props: {
              logo: '👾',
            },
          },
          forced: true,
          parameters: {},
        });
        expect(countDestroy).toEqual(0);

        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '👾: Fox'
        );
      });

      it('should be re-rendered when template change', async () => {
        await rendererService.render({
          storyFnAngular: {
            template: '{{ beer }}',
            props: {
              beer: '🍺',
            },
          },
          forced: true,
          parameters: {},
        });

        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe('🍺');
      });

      it('should be re-rendered when moduleMetadata structure change', async () => {
        let countDestroy = 0;

        rendererService.platform.onDestroy(() => {
          countDestroy += 1;
        });

        // Only props change -> no full rendering
        await rendererService.render({
          storyFnAngular: {
            template: '{{ logo }}: {{ name }}',
            props: {
              logo: '🍺',
              name: 'Beer',
            },
          },
          forced: true,
          parameters: {},
        });
        expect(countDestroy).toEqual(0);

        // Change in the module structure -> full rendering
        await rendererService.render({
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
        });
        expect(countDestroy).toEqual(1);
      });
    });

    it('should properly destroy angular platform between each render', async () => {
      let countDestroy = 0;

      await rendererService.render({
        storyFnAngular: {
          template: '🦊',
          props: {},
        },
        forced: false,
        parameters: {},
      });

      rendererService.platform.onDestroy(() => {
        countDestroy += 1;
      });

      await rendererService.render({
        storyFnAngular: {
          template: '🐻',
          props: {},
        },
        forced: false,
        parameters: {},
      });

      expect(countDestroy).toEqual(1);
    });

    describe('bootstrap module options', () => {
      async function setupComponentWithWhitespace(bootstrapModuleOptions: unknown) {
        await rendererService.render({
          storyFnAngular: {
            template: '<div>   </div>',
            props: {},
          },
          forced: false,
          parameters: {
            bootstrapModuleOptions,
          } as Parameters,
        });
      }

      it('should preserve whitespaces', async () => {
        await setupComponentWithWhitespace({ preserveWhitespaces: true });
        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '<div>   </div>'
        );
      });

      it('should remove whitespaces', async () => {
        await setupComponentWithWhitespace({ preserveWhitespaces: false });
        expect(document.body.getElementsByTagName('storybook-wrapper')[0].innerHTML).toBe(
          '<div></div>'
        );
      });
    });
  });
});
