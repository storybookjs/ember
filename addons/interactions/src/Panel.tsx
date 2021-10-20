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

interface PanelProps {
  active: boolean;
}

const pendingStates = [CallStates.ACTIVE, CallStates.WAITING];
const completedStates = [CallStates.DONE, CallStates.ERROR];

const TabIcon = styled(StatusIcon)({
  marginLeft: 5,
});

export const Panel: React.FC<PanelProps> = (props) => {
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
  const [fileName] = useParameter('fileName', '').split('/').slice(-1);
  const scrollToTarget = () => scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const isDebugging = log.some((item) => pendingStates.includes(item.state));
  const hasPrevious = log.some((item) => completedStates.includes(item.state));
  const hasNext = log.some((item) => item.state === CallStates.WAITING);
  const hasActive = log.some((item) => item.state === CallStates.ACTIVE);
  const hasException = log.some((item) => item.state === CallStates.ERROR);
  const isDisabled = hasActive || isLocked || (isPlaying && !isDebugging);

  const tabButton = global.document.getElementById('tabbutton-interactions');
  const tabStatus = hasException ? CallStates.ERROR : CallStates.ACTIVE;
  const showTabIcon = isDebugging || (!isPlaying && hasException);

  return (
    <AddonPanel {...props}>
      {tabButton && showTabIcon && ReactDOM.createPortal(<TabIcon status={tabStatus} />, tabButton)}
      {interactions.length > 0 && (
        <Subnav
          isDisabled={isDisabled}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          storyFileName={fileName}
          // eslint-disable-next-line no-nested-ternary
          status={isPlaying ? CallStates.ACTIVE : hasException ? CallStates.ERROR : CallStates.DONE}
          onStart={() => emit(EVENTS.START, { storyId })}
          onPrevious={() => emit(EVENTS.BACK, { storyId })}
          onNext={() => emit(EVENTS.NEXT, { storyId })}
          onEnd={() => emit(EVENTS.END, { storyId })}
          onScrollToEnd={scrollTarget && scrollToTarget}
        />
      )}
      {interactions.map((call) => (
        <Interaction
          key={call.id}
          call={call}
          callsById={calls.current}
          onClick={() => emit(EVENTS.GOTO, { storyId, callId: call.id })}
          isDisabled={isDisabled}
        />
      ))}
      <div ref={endRef} />
      {!isPlaying && interactions.length === 0 && (
        <Placeholder>
          No interactions found
          <Link
            href="https://storybook.js.org/docs/react/essentials/interactions"
            target="_blank"
            withArrow
          >
            Learn how to add interactions to your story
          </Link>
        </Placeholder>
      )}
    </AddonPanel>
  );
};
