import global from 'global';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { useChannel, useParameter, useStorybookState } from '@storybook/api';
import { STORY_RENDER_PHASE_CHANGED } from '@storybook/core-events';
import { AddonPanel, Link, Placeholder } from '@storybook/components';
import { EVENTS, Call, CallStates, LogItem } from '@storybook/instrumenter';
import { styled } from '@storybook/theming';

import { StatusIcon } from './components/StatusIcon/StatusIcon';
import { Subnav } from './components/Subnav/Subnav';
import { Interaction } from './components/Interaction/Interaction';

const { FEATURES } = global;

interface AddonPanelProps {
  active: boolean;
}

interface InteractionsPanelProps {
  active: boolean;
  interactions: (Call & { state?: CallStates })[];
  isDisabled?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
  fileName?: string;
  hasException?: boolean;
  isPlaying?: boolean;
  calls: Map<string, any>;
  endRef?: React.Ref<HTMLDivElement>;
  isDebuggingEnabled?: boolean;
  onStart?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEnd?: () => void;
  onScrollToEnd?: () => void;
  onInteractionClick?: (callId: string) => void;
}

const pendingStates = [CallStates.ACTIVE, CallStates.WAITING];
const completedStates = [CallStates.DONE, CallStates.ERROR];

const TabIcon = styled(StatusIcon)({
  marginLeft: 5,
});

const TabStatus = ({ children }: { children: React.ReactChild }) => {
  const container = global.document.getElementById('tabbutton-interactions');
  return container && ReactDOM.createPortal(children, container);
};

export const AddonPanelPure: React.FC<InteractionsPanelProps> = React.memo(
  ({
    interactions,
    isDisabled,
    hasPrevious,
    hasNext,
    fileName,
    hasException,
    isPlaying,
    onStart,
    onPrevious,
    onNext,
    onEnd,
    onScrollToEnd,
    calls,
    onInteractionClick,
    endRef,
    isDebuggingEnabled,
    ...panelProps
  }) => (
    <AddonPanel {...panelProps}>
      {isDebuggingEnabled && interactions.length > 0 && (
        <Subnav
          isDisabled={isDisabled}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          storyFileName={fileName}
          status={
            // eslint-disable-next-line no-nested-ternary
            isPlaying ? CallStates.ACTIVE : hasException ? CallStates.ERROR : CallStates.DONE
          }
          onStart={onStart}
          onPrevious={onPrevious}
          onNext={onNext}
          onEnd={onEnd}
          onScrollToEnd={onScrollToEnd}
        />
      )}
      {interactions.map((call) => (
        <Interaction
          key={call.id}
          call={call}
          callsById={calls}
          isDebuggingEnabled={isDebuggingEnabled}
          isDisabled={isDisabled}
          onClick={() => onInteractionClick(call.id)}
        />
      ))}
      <div ref={endRef} />
      {!isPlaying && interactions.length === 0 && (
        <Placeholder>
          No interactions found
          <Link
            href="https://github.com/storybookjs/storybook/blob/next/addons/interactions/README.md"
            target="_blank"
            withArrow
          >
            Learn how to add interactions to your story
          </Link>
        </Placeholder>
      )}
    </AddonPanel>
  )
);

export const Panel: React.FC<AddonPanelProps> = (props) => {
  const [isLocked, setLock] = React.useState(false);
  const [isPlaying, setPlaying] = React.useState(true);
  const [scrollTarget, setScrollTarget] = React.useState<HTMLElement>();

  const calls = React.useRef<Map<Call['id'], Omit<Call, 'state'>>>(new Map());
  const setCall = ({ state, ...call }: Call) => calls.current.set(call.id, call);

  const [log, setLog] = React.useState<LogItem[]>([]);
  const interactions = log.map(({ callId, state }) => ({ ...calls.current.get(callId), state }));

  const endRef = React.useRef();
  React.useEffect(() => {
    const observer = new global.window.IntersectionObserver(
      ([end]: any) => setScrollTarget(end.isIntersecting ? undefined : end.target),
      { root: global.window.document.querySelector('#panel-tab-content') }
    );
    if (endRef.current) observer.observe(endRef.current);
    return () => observer.disconnect();
  }, []);

  const emit = useChannel({
    [EVENTS.CALL]: setCall,
    [EVENTS.SYNC]: setLog,
    [EVENTS.LOCK]: setLock,
    [STORY_RENDER_PHASE_CHANGED]: ({ newPhase }) => {
      setLock(false);
      setPlaying(newPhase === 'playing');
    },
  });

  const { storyId } = useStorybookState();
  const storyFilePath = useParameter('fileName', '');
  const [fileName] = storyFilePath.toString().split('/').slice(-1);
  const scrollToTarget = () => scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const isDebuggingEnabled = FEATURES.interactionsDebugger === true;

  const showStatus = log.length > 0 && !isPlaying;
  const isDebugging = log.some((item) => pendingStates.includes(item.state));
  const hasPrevious = log.some((item) => completedStates.includes(item.state));
  const hasNext = log.some((item) => item.state === CallStates.WAITING);
  const hasActive = log.some((item) => item.state === CallStates.ACTIVE);
  const hasException = log.some((item) => item.state === CallStates.ERROR);
  const isDisabled = isDebuggingEnabled
    ? hasActive || isLocked || (isPlaying && !isDebugging)
    : true;

  const onStart = React.useCallback(() => emit(EVENTS.START, { storyId }), [storyId]);
  const onPrevious = React.useCallback(() => emit(EVENTS.BACK, { storyId }), [storyId]);
  const onNext = React.useCallback(() => emit(EVENTS.NEXT, { storyId }), [storyId]);
  const onEnd = React.useCallback(() => emit(EVENTS.END, { storyId }), [storyId]);
  const onInteractionClick = React.useCallback(
    (callId: string) => emit(EVENTS.GOTO, { storyId, callId }),
    [storyId]
  );

  return (
    <React.Fragment key="interactions">
      <TabStatus>
        {showStatus &&
          (hasException ? <TabIcon status={CallStates.ERROR} /> : ` (${interactions.length})`)}
      </TabStatus>
      <AddonPanelPure
        interactions={interactions}
        isDisabled={isDisabled}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        fileName={fileName}
        hasException={hasException}
        isPlaying={isPlaying}
        calls={calls.current}
        endRef={endRef}
        isDebuggingEnabled={isDebuggingEnabled}
        onStart={onStart}
        onPrevious={onPrevious}
        onNext={onNext}
        onEnd={onEnd}
        onInteractionClick={onInteractionClick}
        onScrollToEnd={scrollTarget && scrollToTarget}
        {...props}
      />
    </React.Fragment>
  );
};
