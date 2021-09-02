import global from 'global';
import React from 'react';
import ReactDOM from 'react-dom';
import { useChannel } from '@storybook/api';
import { AddonPanel, Button, Icons } from '@storybook/components';
import { styled } from '@storybook/theming';

import { EVENTS } from './constants';
import { Call, CallRef, CallState } from './types';
import { MatcherResult } from './components/MatcherResult';
import { MethodCall } from './components/MethodCall';
import { StatusIcon } from './components/StatusIcon/StatusIcon';

interface PanelProps {
  active: boolean;
}

global.window.__STORYBOOK_ADDON_TEST_MANAGER__ = global.window.__STORYBOOK_ADDON_TEST_MANAGER__ || {
  isDebugging: false,
  chainedCallIds: new Set<Call['id']>(),
  playUntil: undefined,
};

const sharedState = global.window.__STORYBOOK_ADDON_TEST_MANAGER__;

const Row = ({
  call,
  callsById,
  onClick,
}: {
  call: Call;
  callsById: Record<Call['id'], Call>;
  onClick: React.MouseEventHandler<HTMLElement>;
}) => {
  const RowContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    background: call.state === CallState.ERROR ? '#FFF5CF' : 'transparent',
    borderBottom: '1px solid #eee',
    fontFamily: 'Monaco, monospace',
    fontSize: 12,
  });

  const RowLabel = styled.div({
    display: 'grid',
    gridTemplateColumns: '15px 1fr',
    alignItems: 'center',
    padding: '8px 10px',
    cursor: call.state === CallState.ERROR ? 'default' : 'pointer',
    opacity: call.state === CallState.PENDING ? 0.4 : 1,
    '&:hover': {
      background: call.state === CallState.ERROR ? 'transparent' : '#F3FAFF',
    },
  });
  const detailStyle = {
    margin: 0,
    padding: '8px 10px 8px 30px',
  };
  return (
    <RowContainer>
      <RowLabel onClick={onClick}>
        <StatusIcon status={call.state} />
        <div style={{ marginLeft: 5 }}>
          <MethodCall call={call} callsById={callsById} />
        </div>
      </RowLabel>
      {call.state === CallState.ERROR &&
        (call.exception.message.startsWith('expect(') ? (
          <MatcherResult {...call.exception} />
        ) : (
          <pre style={detailStyle}>{call.exception.message}</pre>
        ))}
    </RowContainer>
  );
};

interface PanelState {
  log: Call[];
  shadowLog: Call[];
  interactions: Call[];
  isDebugging: boolean;
  callsById: Record<Call['id'], Call>;
}

const initialState: PanelState = {
  log: [],
  shadowLog: [],
  interactions: [],
  isDebugging: false,
  callsById: {},
};

const fold = (log: Call[]) => {
  const seen = new Set();
  return log.reduceRight<Call[]>((acc, call) => {
    call.args.forEach((arg) => {
      if (arg?.__callId__) {
        seen.add(arg.__callId__);
      }
    });
    call.path.forEach((node) => {
      if ((node as CallRef).__callId__) {
        seen.add((node as CallRef).__callId__);
      }
    });
    if (call.interceptable && !seen.has(call.id)) {
      acc.unshift(call);
      seen.add(call.id);
    }
    return acc;
  }, []);
};

const reducer = (
  state: PanelState,
  action: { type: string; payload?: { call?: Call; playUntil?: Call['id'] } }
) => {
  switch (action.type) {
    case 'call':
      const { call } = action.payload;
      const log = state.log.concat(call);
      const interactions = fold(
        log.reduce<Call[]>(
          (acc, call, index) => {
            acc[index] = call;
            return acc;
          },
          state.shadowLog.map((c) => ({ ...c, state: CallState.PENDING }))
        )
      );
      return {
        ...state,
        log,
        interactions,
        callsById: { ...state.callsById, [call.id]: call },
      };

    case 'start':
      sharedState.isDebugging = true;
      sharedState.playUntil = action.payload?.playUntil;
      return {
        ...state,
        log: [] as Call[],
        shadowLog: state.isDebugging ? state.shadowLog : [...state.log],
        isDebugging: true,
      };

    case 'stop':
      sharedState.isDebugging = false;
      sharedState.playUntil = undefined;
      return { ...state, isDebugging: false };

    case 'reset':
      sharedState.isDebugging = false;
      sharedState.playUntil = undefined;
      sharedState.chainedCallIds.clear();
      return initialState;
  }
};

export const Panel: React.FC<PanelProps> = (props) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const emit = useChannel({
    [EVENTS.CALL]: (call: Call) => {
      dispatch({ type: 'call', payload: { call } });
    },
    setCurrentStory: () => {
      dispatch({ type: 'reset' });
      emit(EVENTS.RESET);
    },
    storyRendered: () => {
      dispatch({ type: 'stop' });
      emit(EVENTS.RESET);
    },
  });

  const { log, interactions, callsById, isDebugging } = state;
  const hasException = interactions.some((call) => call.state === CallState.ERROR);
  const hasPrevious = interactions.some(call => call.state !== CallState.PENDING);
  const hasNext = interactions.some((call) => call.state === CallState.PENDING);
  const nextIndex = interactions.findIndex((call) => call.state === CallState.PENDING);
  const nextCall = interactions[nextIndex];
  const prevCall = interactions[nextIndex - 2] || (isDebugging ? undefined : interactions.slice(-2)[0]);

  const start = () => {
    const playUntil = log
      .slice(0, log.findIndex((call) => call.id === interactions[0].id))
      .filter((call) => call.interceptable)
      .slice(-1)[0];
    dispatch({ type: 'start', payload: { playUntil: playUntil?.id } });
    emit(EVENTS.RELOAD);
  };
  const goto = (call: Call) => {
    if (call.state === CallState.PENDING) {
      if (call !== nextCall) sharedState.playUntil = call.id;
      emit(EVENTS.NEXT);
    } else {
      dispatch({ type: 'start', payload: { playUntil: call.id } });
      emit(EVENTS.RELOAD);
    }
  };
  const next = () => goto(nextCall)
  const prev = () => prevCall ? goto(prevCall) : start()
  const stop = () => {
    dispatch({ type: 'stop' });
    emit(EVENTS.NEXT);
  };

  const tabButton = document.getElementById('tabbutton-interactions');
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

      {interactions.map((call) => (
        <Row call={call} callsById={callsById} key={call.id} onClick={() => goto(call)} />
      ))}

      <div style={{ padding: 3 }}>
        <Button outline containsIcon title="Start debugging" onClick={start}>
          <Icons icon="undo" />
        </Button>
        <Button outline containsIcon title="Step back" onClick={prev} disabled={!hasPrevious}>
          <Icons icon="arrowleftalt" />
        </Button>
        <Button outline containsIcon title="Step over" onClick={next} disabled={!hasNext}>
          <Icons icon="arrowrightalt" />
        </Button>
        <Button outline containsIcon title="Play" onClick={stop} disabled={!hasNext}>
          <Icons icon="play" />
        </Button>
      </div>
    </AddonPanel>
  );
};
