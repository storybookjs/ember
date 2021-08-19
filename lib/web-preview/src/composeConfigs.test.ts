import { composeConfigs } from './composeConfigs';

describe('composeConfigs', () => {
  it('sets default (empty) values for fields', () => {
    expect(composeConfigs([])).toEqual({
      parameters: {},
      decorators: [],
      args: {},
      argsEnhancers: [],
      argTypes: {},
      argTypesEnhancers: [],
      globals: {},
      globalTypes: {},
      loaders: [],
    });
  });

  it('composes parameters', () => {
    expect(
      composeConfigs([
        {
          parameters: { obj: { a: '1', b: '1' } },
        },
        {
          parameters: { obj: { a: '2', c: '2' } },
        },
      ])
    ).toEqual({
      parameters: { obj: { a: '2', b: '1', c: '2' } },
      decorators: [],
      args: {},
      argsEnhancers: [],
      argTypes: {},
      argTypesEnhancers: [],
      globals: {},
      globalTypes: {},
      loaders: [],
    });
  });

  it('overrides object fields by key', () => {
    expect(
      composeConfigs([
        {
          args: { x: '1', y: '1', obj: { a: '1', b: '1' } },
          argTypes: { x: '1', y: '1', obj: { a: '1', b: '1' } },
          globals: { x: '1', y: '1', obj: { a: '1', b: '1' } },
          globalTypes: { x: '1', y: '1', obj: { a: '1', b: '1' } },
        },
        {
          args: { x: '2', z: '2', obj: { a: '2', c: '2' } },
          argTypes: { x: '2', z: '2', obj: { a: '2', c: '2' } },
          globals: { x: '2', z: '2', obj: { a: '2', c: '2' } },
          globalTypes: { x: '2', z: '2', obj: { a: '2', c: '2' } },
        },
      ])
    ).toEqual({
      parameters: {},
      decorators: [],
      args: { x: '2', y: '1', z: '2', obj: { a: '2', c: '2' } },
      argsEnhancers: [],
      argTypes: { x: '2', y: '1', z: '2', obj: { a: '2', c: '2' } },
      argTypesEnhancers: [],
      globals: { x: '2', y: '1', z: '2', obj: { a: '2', c: '2' } },
      globalTypes: { x: '2', y: '1', z: '2', obj: { a: '2', c: '2' } },
      loaders: [],
    });
  });

  it('concats array fields', () => {
    expect(
      composeConfigs([
        {
          decorators: ['1', '2'],
          argsEnhancers: ['1', '2'],
          argTypesEnhancers: ['1', '2'],
          loaders: ['1', '2'],
        },
        {
          decorators: ['3', '4'],
          argsEnhancers: ['3', '4'],
          argTypesEnhancers: ['3', '4'],
          loaders: ['3', '4'],
        },
      ])
    ).toEqual({
      parameters: {},
      decorators: ['1', '2', '3', '4'],
      args: {},
      argsEnhancers: ['1', '2', '3', '4'],
      argTypes: {},
      argTypesEnhancers: ['1', '2', '3', '4'],
      globals: {},
      globalTypes: {},
      loaders: ['1', '2', '3', '4'],
    });
  });

  it('concats argTypesEnhancers in two passes', () => {
    expect(
      composeConfigs([
        { argTypesEnhancers: [{ a: '1' }, { a: '2', secondPass: true }] },
        { argTypesEnhancers: [{ a: '3' }, { a: '4', secondPass: true }] },
      ])
    ).toEqual({
      parameters: {},
      decorators: [],
      args: {},
      argsEnhancers: [],
      argTypes: {},
      argTypesEnhancers: [
        { a: '1' },
        { a: '3' },
        { a: '2', secondPass: true },
        { a: '4', secondPass: true },
      ],
      globals: {},
      globalTypes: {},
      loaders: [],
    });
  });

  it('concats chooses scalar fields', () => {
    expect(
      composeConfigs([
        {
          play: 'play-1',
          render: 'render-1',
          renderToDOM: 'renderToDOM-1',
          applyDecorators: 'applyDecorators-1',
        },
        {
          play: 'play-2',
          render: 'render-2',
          renderToDOM: 'renderToDOM-2',
          applyDecorators: 'applyDecorators-2',
        },
      ])
    ).toEqual({
      parameters: {},
      decorators: [],
      args: {},
      argsEnhancers: [],
      argTypes: {},
      argTypesEnhancers: [],
      globals: {},
      globalTypes: {},
      loaders: [],
      play: 'play-1',
      render: 'render-1',
      renderToDOM: 'renderToDOM-1',
      applyDecorators: 'applyDecorators-1',
    });
  });
});
