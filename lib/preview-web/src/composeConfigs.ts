import { AnyFramework } from '@storybook/csf';
import { combineParameters, ModuleExports } from '@storybook/store';
import { WebProjectAnnotations } from './types';

function getField(moduleExportList: ModuleExports[], field: string): any[] {
  return moduleExportList.map((xs) => xs[field]).filter(Boolean);
}

function getArrayField(moduleExportList: ModuleExports[], field: string): any[] {
  return getField(moduleExportList, field).reduce((a, b) => [...a, ...b], []);
}

function getObjectField(moduleExportList: ModuleExports[], field: string): Record<string, any> {
  return Object.assign({}, ...getField(moduleExportList, field));
}

function getSingletonField(moduleExportList: ModuleExports[], field: string): any {
  return getField(moduleExportList, field)[0];
}

export function composeConfigs<TFramework extends AnyFramework>(
  moduleExportList: ModuleExports[]
): WebProjectAnnotations<TFramework> {
  const allArgTypeEnhancers = getArrayField(moduleExportList, 'argTypesEnhancers');

  return {
    parameters: combineParameters(...getField(moduleExportList, 'parameters')),
    decorators: getArrayField(moduleExportList, 'decorators'),
    args: getObjectField(moduleExportList, 'args'),
    argsEnhancers: getArrayField(moduleExportList, 'argsEnhancers'),
    argTypes: getObjectField(moduleExportList, 'argTypes'),
    argTypesEnhancers: [
      ...allArgTypeEnhancers.filter((e) => !e.secondPass),
      ...allArgTypeEnhancers.filter((e) => e.secondPass),
    ],
    globals: getObjectField(moduleExportList, 'globals'),
    globalTypes: getObjectField(moduleExportList, 'globalTypes'),
    loaders: getArrayField(moduleExportList, 'loaders'),
    render: getSingletonField(moduleExportList, 'render'),
    play: getSingletonField(moduleExportList, 'play'),
    renderToDOM: getSingletonField(moduleExportList, 'renderToDOM'),
    applyDecorators: getSingletonField(moduleExportList, 'applyDecorators'),
  };
}
