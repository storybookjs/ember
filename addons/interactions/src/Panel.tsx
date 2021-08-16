import React from 'react';
import ReactDOM from 'react-dom';
import { useChannel } from '@storybook/api';
import { AddonPanel, Button, Icons } from '@storybook/components';
import { styled } from '@storybook/theming';
import { EVENTS } from './constants';
import global from 'global';

interface PanelProps {
  active: boolean;
}

enum TestingStates {
  DONE = 'done',
  ERROR = 'error',
  PENDING = 'pending',
}

type TestState = TestingStates.DONE | TestingStates.ERROR | TestingStates.PENDING;

type CallRef = { __callId__: string };

interface Call {
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

global.window.__CHAINED_CALL_IDS__ = [];
const addChainedCall = (callRef: CallRef) =>
  global.window.__CHAINED_CALL_IDS__.push(callRef.__callId__);
const setDebugging = (value: boolean) => (global.window.__IS_DEBUGGING__ = !!value);
const isDebugging = () => !!global.window.__IS_DEBUGGING__;
const setPlayUntil = (value: string) => (global.window.__PLAY_UNTIL__ = value);

const stringify = (value: any) => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
};

const fold = (calls: Call[], callsById: Record<Call['id'], Call>) => {
  const seen = new Set();
  return calls.reduceRight<Call[]>((acc, call) => {
    if (seen.has(call.id)) return acc;
    call.path.forEach((node) => {
      if ((node as CallRef).__callId__) seen.add((node as CallRef).__callId__);
    });
    call.args = call.args.map((arg) => {
      if (!arg?.__callId__) return arg;
      seen.add(arg.__callId__);
      return callsById[arg.__callId__] || arg;
    });
    acc.unshift(call);
    seen.add(call.id);
    return acc;
  }, []);
};

const MethodCall = ({ call, callsById }: { call: Call; callsById: Record<Call['id'], Call> }) => {
  const path = call.path.flatMap((elem, index) => {
    const callId = (elem as CallRef).__callId__;
    return [
      callId ? (
        <MethodCall call={callsById[callId]} callsById={callsById} key={index} />
      ) : (
        <span key={index}>{elem}</span>
      ),
      <span key={'dot' + index}>.</span>,
    ];
  });

  const args = call.args.flatMap((arg, index, array) => {
    const nodes = [];
    if (arg?.id && arg?.method && arg?.args) {
      nodes.push(<MethodCall key={call.id} call={arg} callsById={callsById} />);
    } else {
      const color =
        { string: 'forestgreen', boolean: '#FC521F', number: '#FC521F' }[typeof arg as string] ||
        '#FFAE00';
      nodes.push(
        <span key={arg} style={{ color }}>
          {stringify(arg)}
        </span>
      );
    }
    if (index < array.length - 1) {
      nodes.push(<span key={index}>,&nbsp;</span>);
    }
    return nodes;
  });

  return (
    <>
      <span>{path}</span>
      <span style={{ color: '#4776D6' }}>{call.method}</span>
      <span>({args})</span>
    </>
  );
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
    cursor: 'pointer',
    opacity: call.state === TestingStates.PENDING ? 0.4 : 1,
    '&:hover': {
      background: '#F3FAFF',
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

export const Panel: React.FC<PanelProps> = (props) => {
  const calls = React.useRef([]);
  const callsById = React.useRef({} as Record<Call['id'], Call>);
  const [log, setLog] = React.useState([] as Call[]);
  const [lastLog, setLastLog] = React.useState([] as Call[]);
  const [caughtExceptions, setCaughtExceptions] = React.useState(
    {} as Record<Call['id'], CaughtException>
  );

  const emit = useChannel({
    [EVENTS.CALL]: (call) => {
      call.path.filter((ref: CallRef) => ref?.__callId__).forEach(addChainedCall);
      calls.current = [...calls.current, call];
      callsById.current[call.id] = call;
      setLog(calls.current);
    },
    [EVENTS.EXCEPTION]: (ex) => {
      setCaughtExceptions((exceptions) => ({ ...exceptions, [ex.callId]: ex }));
    },
    storyChanged: () => {
      setPlayUntil(undefined);
      setDebugging(false);
      setCaughtExceptions({});
      calls.current = [];
      callsById.current = {};
      setLog([]);
      setLastLog([]);
    },
    storyRendered: () => {
      setPlayUntil(undefined);
      setDebugging(false);
      setLastLog([...calls.current]);
      calls.current = [];
    },
  });

  const startDebugger = () => {
    setPlayUntil(undefined);
    setDebugging(true);
    calls.current = [];
    emit(EVENTS.RELOAD);
  };

  const stepOver = () => {
    setPlayUntil(undefined);
    emit(EVENTS.NEXT);
  };

  const playUntil = (callId: string) => {
    setDebugging(true);
    setPlayUntil(callId);
    calls.current = [];
    emit(EVENTS.RELOAD);
  };

  const play = () => {
    setPlayUntil(undefined);
    setDebugging(false);
    emit(EVENTS.NEXT);
  };

  const combined = log.reduce(
    (acc, call, index) => {
      acc[index] = caughtExceptions[call.id]
        ? { ...call, state: TestingStates.ERROR, exception: caughtExceptions[call.id] }
        : { ...call, state: TestingStates.DONE };
      return acc;
    },
    lastLog.map((call) => ({ ...call, state: TestingStates.PENDING }))
  );

  const folded = fold(combined, callsById.current);
  const tabButton = document.getElementById('tabbutton-interactions');
  const hasException = Object.keys(caughtExceptions).length > 0;
  const showStatus = hasException || isDebugging();
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
        <Row
          call={call}
          callsById={callsById.current}
          key={call.id}
          onClick={() => playUntil(call.id)}
        />
      ))}

      <div style={{ padding: 3 }}>
        <Button outline containsIcon title="Start debugging" onClick={startDebugger}>
          <Icons icon="undo" />
        </Button>
        <Button outline containsIcon title="Step over" onClick={stepOver} disabled={!isDebugging()}>
          <Icons icon="arrowrightalt" />
        </Button>
        <Button outline containsIcon title="Play" onClick={play} disabled={!isDebugging()}>
          <Icons icon="play" />
        </Button>
      </div>
    </AddonPanel>
  );
};
