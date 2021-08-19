import React from 'react';
import ReactDOM from 'react-dom';
import { useChannel } from '@storybook/api';
import { AddonPanel, Button, Icons } from '@storybook/components';
import { styled } from '@storybook/theming';
import { EVENTS } from './constants';
import global from 'global';

import { MethodCall } from './components/MethodCall'

interface PanelProps {
  active: boolean;
}

enum TestingStates {
  DONE = 'done',
  ERROR = 'error',
  PENDING = 'pending',
}

type TestState = TestingStates.DONE | TestingStates.ERROR | TestingStates.PENDING;

export interface CallRef {
  __callId__: string
};

export interface Call {
  id: string;
  path: Array<string | CallRef>;
  method: string;
  args: any[];
  state?: TestState;
  exception?: CaughtException;
}

interface CaughtException {
  callId: Call['id'];
  message: Error['message'];
  stack: Error['stack'];
  matcherResult: object;
}

global.window.__STORYBOOK_IS_DEBUGGING__ = false;
const setDebugging = (value: boolean) => {
  global.window.__STORYBOOK_IS_DEBUGGING__ = value;
};

global.window.__STORYBOOK_PLAY_UNTIL__ = undefined;
const setPlayUntil = (value: Call['id']) => {
  global.window.__STORYBOOK_PLAY_UNTIL__ = value;
};

global.window.__STORYBOOK_CHAINED_CALL_IDS__ = new Set<Call['id']>();
const addChainedCall = (callRef: CallRef) => {
  global.window.__STORYBOOK_CHAINED_CALL_IDS__.add(callRef.__callId__);
};
const clearChainedCalls = () => {
  global.window.__STORYBOOK_CHAINED_CALL_IDS__.clear();
};

const fold = (calls: Call[]) => {
  const seen = new Set();
  return calls.reduceRight<Call[]>((acc, call) => {
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
    if (!seen.has(call.id)) {
      acc.unshift(call);
      seen.add(call.id);
    }
    return acc;
  }, []);
};

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
    background: call.state === TestingStates.ERROR ? '#FFF5CF' : 'transparent',
    borderBottom: '1px solid #eee',
    fontFamily: 'Monaco, monospace',
    fontSize: 12,
  });

  const RowLabel = styled.div({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    cursor: call.state === TestingStates.ERROR ? 'default' : 'pointer',
    opacity: call.state === TestingStates.PENDING ? 0.4 : 1,
    '&:hover': {
      background: call.state === TestingStates.ERROR ? 'transparent' : '#F3FAFF',
    },
  });
  const detailStyle = {
    margin: 0,
    padding: '8px 10px 8px 27px',
  };
  return (
    <RowContainer>
      <RowLabel onClick={onClick}>
        {call.state === TestingStates.DONE && (
          <Icons
            icon="check"
            style={{
              flexShrink: 0,
              width: 12,
              height: 12,
              padding: 1,
              marginRight: 5,
              color: 'green',
            }}
          />
        )}
        {call.state === TestingStates.PENDING && (
          <Icons
            icon="circle"
            style={{
              flexShrink: 0,
              width: 12,
              height: 12,
              padding: 4,
              marginRight: 5,
              color: 'gray',
            }}
          />
        )}
        {call.state === TestingStates.ERROR && (
          <span
            style={{
              flexShrink: 0,
              width: 8,
              height: 8,
              margin: 2,
              marginRight: 7,
              background: '#FF4400',
              borderRadius: 1,
            }}
          />
        )}
        <MethodCall call={call} callsById={callsById} />
      </RowLabel>
      {call.state === TestingStates.ERROR && (
        <pre style={detailStyle}>{call.exception.message}</pre>
      )}
    </RowContainer>
  );
};

interface PanelState {
  log: Call[];
  cursor: number;
  isDebugging: boolean;
  hasException: boolean;
  hasPending: boolean;
  callsById: Record<Call['id'], Call>;
}

export const Panel: React.FC<PanelProps> = (props) => {
  const initialState: PanelState = {
    log: [],
    cursor: 0,
    isDebugging: false,
    hasException: false,
    hasPending: false,
    callsById: {},
  };
  const reducer = (
    state: PanelState,
    action: { type: string; payload?: { call?: Call; playUntil?: Call['id'] } }
  ) => {
    switch (action.type) {
      case 'call':
        const { log, cursor, callsById, isDebugging, hasException } = state;
        const { call } = action.payload;
        return {
          ...state,
          log: isDebugging
            ? [...log.slice(0, cursor), call, ...log.slice(cursor + 1)]
            : log.concat(call),
          cursor: cursor + 1,
          hasException: call.exception ? true : hasException,
          hasPending: isDebugging && !!log[cursor + 1],
          callsById: { ...callsById, [call.id]: call },
        };

      case 'start':
        setDebugging(true);
        setPlayUntil(action.payload?.playUntil);
        return { ...state, isDebugging: true, cursor: 0 };

      case 'stop':
        setDebugging(false);
        setPlayUntil(undefined);
        return { ...state, isDebugging: false };

      case 'reset':
        setDebugging(false);
        setPlayUntil(undefined);
        return initialState;
    }
  };
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const emit = useChannel({
    [EVENTS.CALL]: (call) => {
      dispatch({ type: 'call', payload: { call } });
      call.path.filter((ref: CallRef) => ref?.__callId__).forEach(addChainedCall);
    },
    storyRendered: () => {
      dispatch({ type: 'stop' });
    },
    setCurrentStory: () => {
      dispatch({ type: 'reset' });
    },
  });

  const start = (playUntil?: Call['id']) => {
    dispatch({ type: 'start', payload: { playUntil } });
    emit(EVENTS.RELOAD);
  };
  const stop = () => {
    dispatch({ type: 'stop' });
    emit(EVENTS.NEXT);
  };
  const next = () => {
    setPlayUntil(undefined);
    emit(EVENTS.NEXT);
  };

  const { log, callsById, isDebugging, hasException, hasPending } = state;

  const folded = fold(log);
  console.log(log, folded);
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

      {folded.map((call) => (
        <Row call={call} callsById={callsById} key={call.id} onClick={() => start(call.id)} />
      ))}

      <div style={{ padding: 3 }}>
        <Button outline containsIcon title="Start debugging" onClick={() => start()}>
          <Icons icon="undo" />
        </Button>
        <Button outline containsIcon title="Step over" onClick={next} disabled={!hasPending}>
          <Icons icon="arrowrightalt" />
        </Button>
        <Button outline containsIcon title="Play" onClick={stop} disabled={!hasPending}>
          <Icons icon="play" />
        </Button>
      </div>
    </AddonPanel>
  );
};
