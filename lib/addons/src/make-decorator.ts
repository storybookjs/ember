import { Framework, LegacyStoryFn, StoryContext } from '@storybook/csf';

import { StoryWrapper } from './types';

type MakeDecoratorResult = (...args: any) => any;

interface MakeDecoratorOptions<TFramework extends Framework> {
  name: string;
  parameterName: string;
  skipIfNoParametersOrOptions?: boolean;
  wrapper: StoryWrapper<TFramework>;
}

export const makeDecorator = <TFramework extends Framework>({
  name,
  parameterName,
  wrapper,
  skipIfNoParametersOrOptions = false,
}: MakeDecoratorOptions<TFramework>): MakeDecoratorResult => {
  const decorator: any = (options: object) => (
    storyFn: LegacyStoryFn<TFramework>,
    context: StoryContext<TFramework>
  ) => {
    const parameters = context.parameters && context.parameters[parameterName];

    if (parameters && parameters.disable) {
      return storyFn(context);
    }

    if (skipIfNoParametersOrOptions && !options && !parameters) {
      return storyFn(context);
    }

    return wrapper(storyFn, context, {
      options,
      parameters,
    });
  };

  return (...args: any) => {
    // Used without options as .addDecorator(decorator)
    if (typeof args[0] === 'function') {
      return decorator()(...args);
    }

    return (...innerArgs: any): any => {
      // Used as [.]addDecorator(decorator(options))
      if (innerArgs.length > 1) {
        // Used as [.]addDecorator(decorator(option1, option2))
        if (args.length > 1) {
          return decorator(args)(...innerArgs);
        }
        return decorator(...args)(...innerArgs);
      }

      throw new Error(
        `Passing stories directly into ${name}() is not allowed,
        instead use addDecorator(${name}) and pass options with the '${parameterName}' parameter`
      );
    };
  };
};
