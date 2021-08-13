import React from "react";
import { useChannel } from "@storybook/api";
import { AddonPanel, Button, Icons } from "@storybook/components";
import { EVENTS } from "./constants";
import global from 'global'

interface PanelProps {
  active: boolean;
}

enum TestingStates {
  DONE = 'done',
  NEXT = 'next',
  PENDING = 'pending',
};

type TestState = TestingStates.DONE | TestingStates.NEXT | TestingStates.PENDING;
interface Call {
  id: string;
  key: string;
  args: any[];
  intercepted?: boolean;
  state?: TestState;
}

const setDebugging = (value: boolean) => (global.window.__STORYBOOK_DEBUGGING__ = !!value);
const isDebugging = () => !!global.window.__STORYBOOK_DEBUGGING__;

const fold = (calls: Call[]) => {
  const callsById = calls.reduce<Record<Call["id"], Call>>((acc, call) => {
    acc[call.id] = call;
    return acc;
  }, {});

  const seen = new Set();
  return calls.reduceRight<Call[]>((acc, call) => {
    if (seen.has(call.id)) return acc;
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

const Call = ({ call, nested }: { call: Call, nested?: boolean }) => {
  const params = call.args
    .map((arg) => {
      if (arg?.id && arg?.key && arg?.args)
        return <Call key={call.id} call={arg} nested />;
      const color = ({ string: 'forestgreen', number: '#FC521F' })[typeof arg as string] || '#FFAE00'
      try {
        return <span key={arg} style={{ color }}>{JSON.stringify(arg)}</span>;
      } catch (e) {
        return <span key={arg} style={{ color }}>{String(arg)}</span>;
      }
    })
    .flatMap((elem, index, array) =>
      index === array.length - 1 ? [elem] : [elem, <span key={index}>,&nbsp;</span>]
    );
  const style = {
    display: nested ? "inline-block" : "flex",
    alignItems: "center",
    padding: nested ? "none" : "8px 10px",
    background: call.state === TestingStates.NEXT ? "#FFF5CF" : "transparent",
    borderBottom: nested ? "none" : "1px solid #eee",
    opacity: call.state === TestingStates.PENDING && !nested ? 0.4 : 1,
    fontFamily: 'Monaco, monospace',
    fontSize: 12
  };
  return (
    <div style={style}>
      {!nested && call.state === TestingStates.DONE && <Icons icon="check" style={{ flexShrink: 0, width: 12, height: 12, padding: 1, marginRight: 5, color: 'green'}} />}
      {!nested && call.state === TestingStates.NEXT && <Icons icon="stop" style={{ flexShrink: 0, width: 12, height: 12, marginRight: 5, color: 'red'}} />}
      {!nested && call.state === TestingStates.PENDING && <Icons icon="circle" style={{ flexShrink: 0, width: 12, height: 12, padding: 4, marginRight: 5, color: 'gray'}} />}
      {call.key.split('.').flatMap((elem, index, array) =>
        index === array.length - 1
          ? [<span key={index} style={{color: "#4776D6"}}>{elem}</span>]
          : [
            <span key={index} style={{color: '#444'}}>{elem}</span>,
            <span key={'dot' + index} style={{color: '#444'}}>.</span>
          ]
      )}({params})
    </div>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
  const calls = React.useRef([])
  const [log, setLog] = React.useState([] as Call[]);
  const [lastLog, setLastLog] = React.useState([] as Call[]);

  const emit = useChannel({
    [EVENTS.CALL]: (call) => {
      calls.current = [...calls.current, call]
      setLog(calls.current)
    },
    storyChanged: () => {
      setDebugging(false)
      calls.current = []
      setLog([])
      setLastLog([])
    },
    storyRendered: () => {
      setDebugging(false)
      setLastLog(calls.current)
      calls.current = []
    },
  });

  const startDebugger = () => {
    setDebugging(true)
    calls.current = []
    emit(EVENTS.RELOAD);
  }

  const stepOver = () => {
    emit(EVENTS.NEXT);
  };

  const mapped: Call[] = log.reduce((acc, call, index) => {
    acc[index] = { ...call, state: TestingStates.DONE };
    return acc
  }, lastLog.map(call => ({ ...call, state: TestingStates.PENDING })))
  if (isDebugging()) mapped[log.length - 1].state = TestingStates.NEXT
  
  return (
    <AddonPanel {...props}>
      {fold(mapped).map((call) => <Call call={call} key={call.id} />)}

      <div style={{ padding: 3 }}>
        <Button outline containsIcon title="Start debugging" onClick={startDebugger}>
          <Icons icon="undo" />
        </Button>
        <Button outline containsIcon title="Step over" onClick={stepOver} disabled={!isDebugging()}>
          <Icons icon="arrowrightalt" />
        </Button>
      </div>
    </AddonPanel>
  );
};
