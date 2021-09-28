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
    // When a file is renamed (including being moved out of the watched dir)
    // we see first an event with explanation=rename and no mtime for the old name.
    // then an event with explanation=rename with an mtime for the new name.
    // In theory we could try and track both events together and move the exports
    // but that seems dangerous (what if the contents changed?) and frankly not worth it
    // (at this stage at least)
    const removed = !mtime;
    console.log('change', path, removed, explanation);
    onChangeOrRemove(path, removed);
  });
  wp.on('remove', (path: Path, explanation: string) => {
    console.log('remove', path, explanation);
    onChangeOrRemove(path, true);
  });
}
