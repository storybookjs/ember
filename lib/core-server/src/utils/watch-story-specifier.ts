import Watchpack from 'watchpack';
import { toRequireContext, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { Path } from '@storybook/store';

// TODO -- deal with non "specified" specifiers
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
  console.log(specifiers.map((ns) => ns.specifier.directory));
  wp.watch({
    directories: specifiers.map((ns) => ns.specifier.directory),
  });

  function onChangeOrRemove(path: Path, removed: boolean) {
    console.log('onChangeOrRemove', path, removed);
    const specifier = specifiers.find((ns) => {
      const { path: base, regex } = toRequireContext(ns.glob);
      console.log(
        base,
        regex,
        !!path.startsWith(base.replace(/^\.\//, '')),
        !!path.match(new RegExp(regex))
      );
      return path.startsWith(base.replace(/^\.\//, '')) && path.match(new RegExp(regex));
    });
    if (specifier) {
      onInvalidate(specifier, path, removed);
    }
  }

  wp.on('change', (path: Path, mtime: Date, explanation: string) => {
    console.log('change', explanation);
    onChangeOrRemove(path, false);
  });
  wp.on('remove', (path: Path, explanation: string) => {
    console.log('remove', explanation);
    onChangeOrRemove(path, true);
  });
}
