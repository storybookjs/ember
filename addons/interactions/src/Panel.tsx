import global from 'global';
import React from 'react';
import ReactDOM from 'react-dom';
import { useChannel, useParameter, useStorybookState } from '@storybook/api';
import {
  FORCE_REMOUNT,
  SET_CURRENT_STORY,
  STORY_RENDERED,
  STORY_THREW_EXCEPTION,
} from '@storybook/core-events';
import { AddonPanel, Link, Placeholder } from '@storybook/components';
import { EVENTS, Call, CallStates, LogItem } from '@storybook/instrumenter';
import { styled } from '@storybook/theming';

import { MatcherResult } from './components/MatcherResult';
import { MethodCall } from './components/MethodCall';
import { StatusIcon } from './components/StatusIcon/StatusIcon';
import { Subnav } from './components/Subnav/Subnav';

interface PanelProps {
  active: boolean;
}

const pendingStates = [CallStates.ACTIVE, CallStates.WAITING];
const completedStates = [CallStates.DONE, CallStates.ERROR];

const TabIcon = styled(StatusIcon)({
  marginLeft: 5,
});

const Interaction = ({
  call,
  callsById,
  onClick,
  isDisabled,
}: {
  call: Call;
  callsById: Map<Call['id'], Call>;
  onClick: React.MouseEventHandler<HTMLElement>;
  isDisabled: boolean;
}) => {
  const RowContainer = styled.div(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    background: call.state === CallStates.ERROR ? '#FFF5CF' : 'transparent', // dark: #222
    borderBottom: `1px solid ${theme.color.mediumlight}`,
    fontFamily: 'Monaco, monospace',
    fontSize: 12,
  }));

  const RowLabel = styled.button(({ theme, disabled }) => ({
    display: 'grid',
    background: 'none',
    border: 0,
    gridTemplateColumns: '15px 1fr',
    alignItems: 'center',
    minHeight: 40,
    margin: 0,
    padding: '8px 15px',
    textAlign: 'start',
    cursor: disabled || call.state === CallStates.ERROR ? 'default' : 'pointer',
    '&:hover': {
      background: call.state === CallStates.ERROR ? 'transparent' : '#F3FAFF',
    },
    '&:focus-visible': {
      outline: 0,
      boxShadow: `inset 3px 0 0 0 ${
        call.state === CallStates.ERROR ? theme.color.warning : theme.color.secondary
      }`,
      background: call.state === CallStates.ERROR ? 'transparent' : '#F3FAFF',
    },
    '& > div': {
      opacity: call.state === CallStates.WAITING ? 0.4 : 1,
    },
  }));
  const detailStyle = {
    margin: 0,
    padding: '8px 10px 8px 30px',
  };
  return (
    <RowContainer>
      <RowLabel onClick={onClick} disabled={isDisabled}>
        <StatusIcon status={call.state} />
        <div style={{ marginLeft: 5 }}>
          <MethodCall call={call} callsById={callsById} />
        </div>
      </RowLabel>
      {call.state === CallStates.ERROR &&
        (call.exception.message.startsWith('expect(') ? (
          <MatcherResult {...call.exception} />
        ) : (
          <pre style={detailStyle}>{call.exception.message}</pre>
        ))}
    </RowContainer>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
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
    [SET_CURRENT_STORY]: () => setPlaying(true),
    [FORCE_REMOUNT]: () => setPlaying(true),
    [STORY_RENDERED]: () => setPlaying(false),
    [STORY_THREW_EXCEPTION]: () => setPlaying(false),
  });

  const { storyId } = useStorybookState();
  const [fileName] = useParameter('fileName', '').split('/').slice(-1);
  const scrollToTarget = () => scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const isDebugging = log.some((item) => pendingStates.includes(item.state));
  const hasPrevious = log.some((item) => completedStates.includes(item.state));
  const hasNext = log.some((item) => item.state === CallStates.WAITING);
  const hasActive = log.some((item) => item.state === CallStates.ACTIVE);
  const hasException = log.some((item) => item.state === CallStates.ERROR);
  const isDisabled = hasActive || (isPlaying && !isDebugging);

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
