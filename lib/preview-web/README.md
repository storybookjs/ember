# Preview (Web)

This is the main API for the (web) version of the Storybook Preview.

The preview's job is:

1. Read and update the URL (via the URL Store)

2. Listen to instructions on the channel and emit events as things occur.

3. Render the current selection to the web view in either story or docs mode.

## V7 Store vs Legacy (V6)

The story store is designed to load stories 'on demand', and will operate in this fashion if the `storyStoreV7` feature is enabled.

However, for back-compat reasons, in v6 mode, we need to load all stories, synchronously on bootup, emitting the `SET_STORIES` event.

In V7 mode we do not emit that event, instead preferring the `STORY_PREPARED` event.
