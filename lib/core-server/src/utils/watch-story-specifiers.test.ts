import { normalizeStoriesEntry } from '@storybook/core-common';
import Watchpack from 'watchpack';

import { watchStorySpecifiers } from './watch-story-specifiers';

jest.mock('watchpack');

describe('watchStorySpecifiers', () => {
  const options = {
    configDir: '/path/to/project/.storybook',
    workingDir: '/path/to/project',
  };

  let close: () => void;
  afterEach(() => close?.());

  it('watches basic globs', async () => {
    const specifier = normalizeStoriesEntry('../src/**/*.stories.@(ts|js)', options);

    const onInvalidate = jest.fn();
    close = watchStorySpecifiers([specifier], onInvalidate);

    expect(Watchpack).toHaveBeenCalledTimes(1);
    const watcher = Watchpack.mock.instances[0];
    expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src'] });

    expect(watcher.on).toHaveBeenCalledTimes(2);
    const onChange = watcher.on.mock.calls[0][1];
    const onRemove = watcher.on.mock.calls[1][1];

    // File changed, matching
    onInvalidate.mockClear();
    onChange('src/button/Button.stories.ts', 1234);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.ts`, false);

    // File changed, NOT matching
    onInvalidate.mockClear();
    onChange('src/button/Button.ts', 1234);
    expect(onInvalidate).not.toHaveBeenCalled();

    // File removed, matching
    onInvalidate.mockClear();
    onRemove('src/button/Button.stories.ts');
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.ts`, true);

    // File removed, NOT matching
    onInvalidate.mockClear();
    onRemove('src/button/Button.ts');
    expect(onInvalidate).not.toHaveBeenCalled();

    // File moved out, matching
    onInvalidate.mockClear();
    onChange('src/button/Button.stories.ts', null);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.ts`, true);

    // File renamed, matching
    onInvalidate.mockClear();
    onChange('src/button/Button.stories.ts', null);
    onChange('src/button/Button-2.stories.ts', 1234);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.ts`, true);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button-2.stories.ts`, false);
  });

  it('watches single file globs', async () => {
    const specifier = normalizeStoriesEntry('../src/button/Button.stories.mdx', options);

    const onInvalidate = jest.fn();
    close = watchStorySpecifiers([specifier], onInvalidate);

    expect(Watchpack).toHaveBeenCalledTimes(1);
    const watcher = Watchpack.mock.instances[0];
    expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src/button'] });

    expect(watcher.on).toHaveBeenCalledTimes(2);
    const onChange = watcher.on.mock.calls[0][1];
    const onRemove = watcher.on.mock.calls[1][1];

    // File changed, matching
    onInvalidate.mockClear();
    onChange('src/button/Button.stories.mdx', 1234);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.mdx`, false);

    // File changed, NOT matching
    onInvalidate.mockClear();
    onChange('src/button/Button.mdx', 1234);
    expect(onInvalidate).not.toHaveBeenCalled();

    // File removed, matching
    onInvalidate.mockClear();
    onRemove('src/button/Button.stories.mdx');
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.mdx`, true);

    // File removed, NOT matching
    onInvalidate.mockClear();
    onRemove('src/button/Button.mdx');
    expect(onInvalidate).not.toHaveBeenCalled();

    // File moved out, matching
    onInvalidate.mockClear();
    onChange('src/button/Button.stories.mdx', null);
    expect(onInvalidate).toHaveBeenCalledWith(specifier, `./src/button/Button.stories.mdx`, true);
  });

  it('multiplexes between two specifiers on the same directory', () => {
    const globSpecifier = normalizeStoriesEntry('../src/**/*.stories.@(ts|js)', options);
    const fileSpecifier = normalizeStoriesEntry('../src/button/Button.stories.mdx', options);

    const onInvalidate = jest.fn();
    close = watchStorySpecifiers([globSpecifier, fileSpecifier], onInvalidate);

    expect(Watchpack).toHaveBeenCalledTimes(1);
    const watcher = Watchpack.mock.instances[0];
    expect(watcher.watch).toHaveBeenCalledWith({ directories: ['./src', './src/button'] });

    expect(watcher.on).toHaveBeenCalledTimes(2);
    const onChange = watcher.on.mock.calls[0][1];

    onInvalidate.mockClear();
    onChange('src/button/Button.stories.ts', 1234);
    expect(onInvalidate).toHaveBeenCalledWith(
      globSpecifier,
      `./src/button/Button.stories.ts`,
      false
    );

    onInvalidate.mockClear();
    onChange('src/button/Button.stories.mdx', 1234);
    expect(onInvalidate).toHaveBeenCalledWith(
      fileSpecifier,
      `./src/button/Button.stories.mdx`,
      false
    );
  });
});
