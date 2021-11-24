import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import {
  Options,
  normalizeStories,
  NormalizedStoriesSpecifier,
  StorybookConfig,
} from '@storybook/core-common';
import Events from '@storybook/core-events';
import debounce from 'lodash/debounce';

import { StoryIndexGenerator } from './StoryIndexGenerator';
import { watchStorySpecifiers } from './watch-story-specifiers';
import { ServerChannel } from './get-server-channel';

export const DEBOUNCE = 100;

export async function extractStoriesJson(
  outputFile: string,
  normalizedStories: NormalizedStoriesSpecifier[],
  options: {
    configDir: string;
    workingDir: string;
    storiesV2Compatibility: boolean;
    storyStoreV7: boolean;
  }
) {
  const generator = new StoryIndexGenerator(normalizedStories, options);
  await generator.initialize();

  const index = await generator.getIndex();
  await fs.writeJson(outputFile, index);
}

export async function useStoriesJson(
  router: Router,
  serverChannel: ServerChannel,
  options: Options,
  workingDir: string = process.cwd()
) {
  const normalizedStories = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir,
  });
  const features = await options.presets.apply<StorybookConfig['features']>('features');
  const generator = new StoryIndexGenerator(normalizedStories, {
    configDir: options.configDir,
    workingDir,
    storiesV2Compatibility: !features?.breakingChangesV7 && !features?.storyStoreV7,
    storyStoreV7: features?.storyStoreV7,
  });

  // Wait until someone actually requests `stories.json` before we start generating/watching.
  // This is mainly for testing purposes.
  let started = false;
  const maybeInvalidate = debounce(
    () => serverChannel.emit(Events.STORY_INDEX_INVALIDATED),
    DEBOUNCE,
    { leading: true }
  );
  async function ensureStarted() {
    if (started) return;
    started = true;

    watchStorySpecifiers(normalizedStories, { workingDir }, (specifier, path, removed) => {
      generator.invalidate(specifier, path, removed);
      maybeInvalidate();
    });

    await generator.initialize();
  }

  router.use('/stories.json', async (req: Request, res: Response) => {
    await ensureStarted();

    try {
      const index = await generator.getIndex();
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(index));
    } catch (err) {
      res.status(500);
      res.send(err.message);
    }
  });
}
