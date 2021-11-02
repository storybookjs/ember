import { addons, mockChannel, StoryContext } from '@storybook/addons';

import { Component } from '@angular/core';
import { moduleMetadata } from './decorators';
import { addDecorator, storiesOf, clearDecorators, getStorybook, configure } from '.';

const defaultContext: StoryContext = {
  componentId: 'unspecified',
  kind: 'unspecified',
  title: 'unspecified',
  id: 'unspecified',
  name: 'unspecified',
  story: 'unspecified',
  parameters: {},
  initialArgs: {},
  args: {},
  argTypes: {},
  globals: {},
  hooks: {},
  loaded: {},
  originalStoryFn: jest.fn(),
  viewMode: 'story',
  abortSignal: undefined,
  canvasElement: undefined,
};

class MockModule {}
class MockModuleTwo {}
class MockService {}
@Component({})
class MockComponent {}

describe('moduleMetadata', () => {
  it('should add metadata to a story without it', () => {
    const result = moduleMetadata({
      imports: [MockModule],
      providers: [MockService],
    })(
      () => ({
        component: MockComponent,
      }),
      defaultContext
    );

    expect(result).toEqual({
      component: MockComponent,
      moduleMetadata: {
        declarations: [],
        entryComponents: [],
        imports: [MockModule],
        schemas: [],
        providers: [MockService],
      },
    });
  });

  it('should combine with individual metadata on a story', () => {
    const result = moduleMetadata({
      imports: [MockModule],
    })(
      () => ({
        component: MockComponent,
        moduleMetadata: {
          imports: [MockModuleTwo],
          providers: [MockService],
        },
      }),
      defaultContext
    );

    expect(result).toEqual({
      component: MockComponent,
      moduleMetadata: {
        declarations: [],
        entryComponents: [],
        imports: [MockModule, MockModuleTwo],
        schemas: [],
        providers: [MockService],
      },
    });
  });

  it('should return the original metadata if passed null', () => {
    const result = moduleMetadata(null)(
      () => ({
        component: MockComponent,
        moduleMetadata: {
          providers: [MockService],
        },
      }),
      defaultContext
    );

    expect(result).toEqual({
      component: MockComponent,
      moduleMetadata: {
        declarations: [],
        entryComponents: [],
        imports: [],
        schemas: [],
        providers: [MockService],
      },
    });
  });

  it('should work when added globally', () => {
    const metadata = {
      declarations: [MockComponent],
      providers: [MockService],
      entryComponents: [MockComponent],
      imports: [MockModule],
    };

    addons.setChannel(mockChannel());

    configure(() => {
      addDecorator(moduleMetadata(metadata));
      storiesOf('Test', module).add('Default', () => ({
        component: MockComponent,
      }));
    }, {} as NodeModule);

    const [storybook] = getStorybook();

    expect(storybook.stories[0].render({}).moduleMetadata).toEqual({
      declarations: [MockComponent],
      providers: [MockService],
      entryComponents: [MockComponent],
      imports: [MockModule],
      schemas: [],
    });

    clearDecorators();
  });
});
