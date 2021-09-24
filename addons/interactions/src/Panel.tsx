import global from 'global';
import React from 'react';
import ReactDOM from 'react-dom';
import { useChannel, useParameter, useStorybookState } from '@storybook/api';
import { FORCE_REMOUNT, SET_CURRENT_STORY, STORY_RENDERED } from '@storybook/core-events';
import { AddonPanel, Icons, Link, Placeholder } from '@storybook/components';
import { styled } from '@storybook/theming';

import { Call, CallStates, LogItem } from './types';
import { MatcherResult } from './components/MatcherResult';
import { MethodCall } from './components/MethodCall';
import { StatusIcon } from './components/StatusIcon/StatusIcon';
import { Subnav } from './components/Subnav/Subnav';
import { EVENTS } from './lib/instrumenter';

interface PanelProps {
  active: boolean;
}

const pendingStates = [CallStates.ACTIVE, CallStates.WAITING];
const completedStates = [CallStates.DONE, CallStates.ERROR];

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
  const [isRendered, setRendered] = React.useState(false);

  const calls = React.useRef<Map<Call['id'], Omit<Call, 'state'>>>(new Map());
  const setCall = ({ state, ...call }: Call) => calls.current.set(call.id, call);

  const [log, setLog] = React.useState<LogItem[]>([]);
  const interactions = log.map(({ callId, state }) => ({ ...calls.current.get(callId), state }));

  const emit = useChannel({
    [EVENTS.CALL]: setCall,
    [EVENTS.SYNC]: setLog,
    [SET_CURRENT_STORY]: () => setRendered(false),
    [FORCE_REMOUNT]: () => setRendered(false),
    [STORY_RENDERED]: () => setRendered(true),
  });

  const { storyId } = useStorybookState();
  const [fileName] = useParameter('fileName', '').split('/').slice(-1);

  const isDebugging = log.some((item) => pendingStates.includes(item.state));
  const hasPrevious = log.some((item) => completedStates.includes(item.state));
  const hasNext = log.some((item) => item.state === CallStates.WAITING);
  const hasActive = log.some((item) => item.state === CallStates.ACTIVE);
  const hasException = log.some((item) => item.state === CallStates.ERROR);
  const isDisabled = hasActive || (!isDebugging && !isRendered);

  const tabButton = global.document.getElementById('tabbutton-interactions');
  const showStatus = hasException || isDebugging;
  const statusIcon = hasException ? (
    <span
      style={{ width: 8, height: 8, margin: 2, marginLeft: 7, background: '#F40', borderRadius: 1 }}
    />
  ) : (
    <Icons icon="play" style={{ width: 12, height: 12, marginLeft: 5, color: 'currentcolor' }} />
  );

  return (
    <AddonPanel {...props}>
      {tabButton && showStatus && ReactDOM.createPortal(statusIcon, tabButton)}
      {interactions.length > 0 && (
        <Subnav
          isDisabled={isDisabled}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          storyFileName={fileName}
          status={hasException ? CallStates.ERROR : CallStates.DONE}
          onStart={() => emit(EVENTS.START, { storyId })}
          onPrevious={() => emit(EVENTS.BACK, { storyId })}
          onNext={() => emit(EVENTS.NEXT, { storyId })}
          onEnd={() => emit(EVENTS.END, { storyId })}
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
      {isRendered && interactions.length === 0 && (
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
