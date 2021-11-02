enum events {
  CHANNEL_CREATED = 'channelCreated',
  // There was an error executing the config, likely an bug in the user's preview.js
  CONFIG_ERROR = 'configError',
  // When the preview boots, the first story is chosen via a selection specifier
  STORY_SPECIFIED = 'storySpecified',
  // Emitted by the preview whenever the list of stories changes (in batches)
  SET_STORIES = 'setStories',
  // Set the current story selection in the preview
  SET_CURRENT_STORY = 'setCurrentStory',
  // The current story changed due to the above
  CURRENT_STORY_WAS_SET = 'currentStoryWasSet',
  // Force the current story to re-render, without changing args
  FORCE_RE_RENDER = 'forceReRender',
  // Force the current story to re-render from scratch, with its initial args
  FORCE_REMOUNT = 'forceRemount',
  // The story has been loaded into the store, we have parameters/args/etc
  STORY_PREPARED = 'storyPrepared',
  // The next 6 events are emitted by the StoryRenderer when rendering the current story
  STORY_CHANGED = 'storyChanged',
  STORY_UNCHANGED = 'storyUnchanged',
  STORY_RENDERED = 'storyRendered',
  STORY_MISSING = 'storyMissing',
  STORY_ERRORED = 'storyErrored',
  STORY_THREW_EXCEPTION = 'storyThrewException',
  // Emitted at various times during rendering
  STORY_RENDER_PHASE_CHANGED = 'storyRenderPhaseChanged',
  // Tell the story store to update (a subset of) a stories arg values
  UPDATE_STORY_ARGS = 'updateStoryArgs',
  // The values of a stories args just changed
  STORY_ARGS_UPDATED = 'storyArgsUpdated',
  // Reset either a single arg of a story all args of a story
  RESET_STORY_ARGS = 'resetStoryArgs',
  // Emitted by the preview at startup once it knows the initial set of globals+globalTypes
  SET_GLOBALS = 'setGlobals',
  // Tell the preview to update the value of a global
  UPDATE_GLOBALS = 'updateGlobals',
  // A global was just updated
  GLOBALS_UPDATED = 'globalsUpdated',
  REGISTER_SUBSCRIPTION = 'registerSubscription',
  // Tell the manager that the user pressed a key in the preview
  PREVIEW_KEYDOWN = 'previewKeydown',
  // Used in the manager to change the story selection
  SELECT_STORY = 'selectStory',
  STORIES_COLLAPSE_ALL = 'storiesCollapseAll',
  STORIES_EXPAND_ALL = 'storiesExpandAll',
  DOCS_RENDERED = 'docsRendered',
  SHARED_STATE_CHANGED = 'sharedStateChanged',
  SHARED_STATE_SET = 'sharedStateSet',
  NAVIGATE_URL = 'navigateUrl',
  UPDATE_QUERY_PARAMS = 'updateQueryParams',
}

// Enables: `import Events from ...`
export default events;

// Enables: `import * as Events from ...` or `import { CHANNEL_CREATED } as Events from ...`
// This is the preferred method
export const {
  CHANNEL_CREATED,
  CONFIG_ERROR,
  STORY_SPECIFIED,
  SET_STORIES,
  SET_CURRENT_STORY,
  CURRENT_STORY_WAS_SET,
  FORCE_RE_RENDER,
  FORCE_REMOUNT,
  STORY_PREPARED,
  STORY_CHANGED,
  STORY_UNCHANGED,
  STORY_RENDERED,
  STORY_MISSING,
  STORY_ERRORED,
  STORY_THREW_EXCEPTION,
  STORY_RENDER_PHASE_CHANGED,
  UPDATE_STORY_ARGS,
  STORY_ARGS_UPDATED,
  RESET_STORY_ARGS,
  SET_GLOBALS,
  UPDATE_GLOBALS,
  GLOBALS_UPDATED,
  REGISTER_SUBSCRIPTION,
  PREVIEW_KEYDOWN,
  SELECT_STORY,
  STORIES_COLLAPSE_ALL,
  STORIES_EXPAND_ALL,
  DOCS_RENDERED,
  SHARED_STATE_CHANGED,
  SHARED_STATE_SET,
  NAVIGATE_URL,
  UPDATE_QUERY_PARAMS,
} = events;

// Used to break out of the current render without showing a redbox
export const IGNORED_EXCEPTION = new Error('ignoredException');
