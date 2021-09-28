import { Router, Request, Response } from 'express';
import fs from 'fs-extra';
import EventEmitter from 'events';
import { Options, normalizeStories, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { StoryIndexGenerator } from './StoryIndexGenerator';
import { watchStorySpecifiers } from './watch-story-specifiers';
import { useEventsAsSSE } from './use-events-as-sse';

const INVALIDATE = 'INVALIDATE';

export async function extractStoriesJson(
  outputFile: string,
  normalizedStories: NormalizedStoriesSpecifier[],
  configDir: string
) {
  const generator = new StoryIndexGenerator(normalizedStories, configDir);
  await generator.initialize();

  const index = await generator.getIndex();
  await fs.writeJson(outputFile, index);
}

export async function useStoriesJson(router: Router, options: Options) {
  const normalizedStories = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });
  const generator = new StoryIndexGenerator(normalizedStories, options.configDir);
  await generator.initialize();

  const invalidationEmitter = new EventEmitter();
  watchStorySpecifiers(normalizedStories, (specifier, path, removed) => {
    generator.invalidate(specifier, path, removed);
    invalidationEmitter.emit(INVALIDATE);
  });

  const eventsAsSSE = useEventsAsSSE(invalidationEmitter, [INVALIDATE]);

  router.use('/stories.json', async (req: Request, res: Response) => {
    if (eventsAsSSE(req, res)) return;

    try {
      const index = await generator.getIndex();
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(index));
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}
