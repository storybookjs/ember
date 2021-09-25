import fs from 'fs-extra';
import EventEmitter from 'events';
import { Options, normalizeStories, NormalizedStoriesSpecifier } from '@storybook/core-common';
import { StoryIndexGenerator } from './StoryIndexGenerator';
import { watchStorySpecifiers } from './watch-story-specifier';

const eventName = 'INVALIDATE';

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

export async function useStoriesJson(router: any, options: Options) {
  const normalizedStories = normalizeStories(await options.presets.apply('stories'), {
    configDir: options.configDir,
    workingDir: process.cwd(),
  });
  const generator = new StoryIndexGenerator(normalizedStories, options.configDir);
  await generator.initialize();

  const invalidationEmitter = new EventEmitter();
  watchStorySpecifiers(normalizedStories, (specifier, path, removed) => {
    generator.invalidate(specifier, path, removed);
    console.log('emitting');
    invalidationEmitter.emit(eventName);
  });

  router.use('/stories.json', async (req: any, res: any) => {
    if (req.headers.accept === 'text/event-stream') {
      let closed = false;
      const watcher = () => {
        if (closed || res.writableEnded) return;
        res.write(`event:INVALIDATE\ndata:DATA\n\n`);
        res.flush();
      };
      const close = () => {
        invalidationEmitter.off(eventName, watcher);
        closed = true;
        res.end();
      };
      res.on('close', close);

      if (closed || res.writableEnded) return;
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      invalidationEmitter.on(eventName, watcher);
      return;
    }

    try {
      const index = await generator.getIndex();
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(index));
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}
