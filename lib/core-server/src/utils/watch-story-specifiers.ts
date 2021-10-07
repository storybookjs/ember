import Watchpack from 'watchpack';
import { NormalizedStoriesSpecifier } from '@storybook/core-common';
import { Path } from '@storybook/store';

export function watchStorySpecifiers(
  specifiers: NormalizedStoriesSpecifier[],
  onInvalidate: (specifier: NormalizedStoriesSpecifier, path: Path, removed: boolean) => void
) {
  // See https://www.npmjs.com/package/watchpack for full options.
  // If you want less traffic, consider using aggregation with some interval
  const wp = new Watchpack({
    // poll: true, // Slow!!! Enable only in special cases
    followSymlinks: false,
    ignored: ['**/.git', 'node_modules'],
  });
  wp.watch({
    directories: specifiers.map((ns) => ns.directory),
  });

  function onChangeOrRemove(watchpackPath: Path, removed: boolean) {
    // Watchpack passes paths either with no leading './' - e.g. `src/Foo.stories.js`,
    // or with a leading `../` (etc), e.g. `../src/Foo.stories.js`.
    // We want to deal in importPaths relative to the working dir, or absolute paths.
    const importPath = watchpackPath.startsWith('.') ? watchpackPath : `./${watchpackPath}`;

    const specifier = specifiers.find((ns) => ns.importPathMatcher.exec(importPath));
    if (specifier) {
      onInvalidate(specifier, importPath, removed);
    }
  }

  wp.on('change', (path: Path, mtime: Date, explanation: string) => {
    // When a file is renamed (including being moved out of the watched dir)
    // we see first an event with explanation=rename and no mtime for the old name.
    // then an event with explanation=rename with an mtime for the new name.
    // In theory we could try and track both events together and move the exports
    // but that seems dangerous (what if the contents changed?) and frankly not worth it
    // (at this stage at least)
    const removed = !mtime;
    onChangeOrRemove(path, removed);
  });
  wp.on('remove', (path: Path, explanation: string) => {
    onChangeOrRemove(path, true);
  });

  return () => wp.close();
}
