import global from 'global';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { useChannel, useParameter, useStorybookState } from '@storybook/api';
import { STORY_RENDER_PHASE_CHANGED } from '@storybook/core-events';
import { AddonPanel, Link, Placeholder } from '@storybook/components';
import { EVENTS, Call, CallStates, LogItem } from '@storybook/instrumenter';
import { styled, typography } from '@storybook/theming';

import { transparentize } from 'polished';
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

const MethodCallWrapper = styled.div(({ theme }) => ({
  fontFamily: typography.fonts.mono,
  fontSize: typography.size.s1,
}));

const RowContainer = styled('div', { shouldForwardProp: (prop) => !['call'].includes(prop) })<{
  call: Call;
}>(({ theme, call }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderBottom: `1px solid ${theme.appBorderColor}`,
  fontFamily: typography.fonts.base,
  fontSize: 13,
  ...(call.state === CallStates.ERROR && {
    backgroundColor:
      theme.base === 'dark' ? transparentize(0.93, theme.color.negative) : theme.background.warning,
  }),
}));

const RowLabel = styled('button', { shouldForwardProp: (prop) => !['call'].includes(prop) })<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { call: Call }
>(({ theme, disabled, call }) => ({
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
    background: theme.base === 'dark' ? transparentize(0.9, theme.color.secondary) : '#F3FAFF',
  },
  '&:focus-visible': {
    outline: 0,
    boxShadow: `inset 3px 0 0 0 ${
      call.state === CallStates.ERROR ? theme.color.warning : theme.color.secondary
    }`,
    background: call.state === CallStates.ERROR ? 'transparent' : '#F3FAFF',
  },
  '& > div': {
    opacity: call.state === CallStates.WAITING ? 0.5 : 1,
  },
}));

const RowMessage = styled('pre')({
  margin: 0,
  padding: '8px 10px 8px 30px',
  fontSize: typography.size.s1,
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
  return (
    <RowContainer call={call}>
      <RowLabel call={call} onClick={onClick} disabled={isDisabled}>
        <StatusIcon status={call.state} />
        <MethodCallWrapper style={{ marginLeft: 6, marginBottom: 1 }}>
          <MethodCall call={call} callsById={callsById} />
        </MethodCallWrapper>
      </RowLabel>
      {call.state === CallStates.ERROR &&
        call.exception &&
        (call.exception.message.startsWith('expect(') ? (
          <MatcherResult {...call.exception} />
        ) : (
          <RowMessage>{call.exception.message}</RowMessage>
        ))}
    </RowContainer>
  );
};

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
