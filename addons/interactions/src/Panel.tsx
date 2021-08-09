import React from "react";
import { useChannel } from "@storybook/api";
import { AddonPanel, Button, Icons } from "@storybook/components";
import { EVENTS } from "./constants";

interface PanelProps {
  active: boolean;
}

interface Call {
  id: string;
  key: string;
  args: any[];
  intercepted?: boolean;
}

const fold = (calls: Call[]) => {
  const callsById = calls.reduce<Record<Call["id"], Call>>((acc, call) => {
    acc[call.id] = call;
    return acc;
  }, {});

  const seen = new Set();
  return calls.reduceRight<Call[]>((acc, call) => {
    // if (seen.has(call.id)) return acc;
    call.args = call.args.map((arg) => {
      if (!arg?.__callId__) return arg;
      seen.add(arg.__callId__);
      return callsById[arg.__callId__];
    });
    acc.unshift(call);
    seen.add(call.id);
    return acc;
  }, []);
};

const Call = ({ call, state, nested }: { call: Call, state: "done" | "next" | "pending", nested?: boolean }) => {
  const params = call.args
    .map((arg) => {
      if (arg?.id && arg?.key && arg?.args)
        return <Call key={call.id} call={arg} state="done" nested />;
      try {
        return <span key={arg}>{JSON.stringify(arg)}</span>;
      } catch (e) {
        return <span key={arg}>{String(arg)}</span>;
      }
    })
    .flatMap((elem, index, array) =>
      index === array.length - 1 ? [elem] : [elem, <span key={index}>,&nbsp;</span>]
    );
  const style = {
    display: nested ? "inline-block" : "flex",
    alignItems: "center",
    padding: nested ? "none" : "5px 10px",
    background: state === "next" ? "#FFF5CF" : "transparent",
    borderBottom: nested ? "none" : "1px solid #eee",
    opacity: state === "pending" && !nested ? 0.4 : 1,
  };
  return (
    <div style={style}>
      {!nested && state === "done" && <Icons icon="check" style={{width: 12, height: 12, padding: 1, marginRight: 5, color: 'green'}} />}
      {!nested && state === "next" && <Icons icon="stop" style={{width: 12, height: 12, marginRight: 5, color: 'red'}} />}
      {!nested && state === "pending" && <Icons icon="circle" style={{width: 12, height: 12, padding: 4, marginRight: 5, color: 'gray'}} />}
      {call.key}({params})
    </div>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
  const calls = React.useRef([]);
  const [log, setLog] = React.useState([] as Call[]);
  const [debugIndex, setDebugIndex] = React.useState(-1)

  const emit = useChannel({
    [EVENTS.CALL]: (call) => {
      if (window.__debugging__) return
      calls.current.push(call);
    },
    storyChanged: () => {
      window.__debugging__ = false
      setDebugIndex(-1)
    },
    storyRendered: () => {
      if (!window.__debugging__) {
        setLog(calls.current);
        calls.current = []
      }
      setDebugIndex(-1)
      window.__debugging__ = false
    },
  });

  const startDebugger = () => {
    window.__debugging__ = true
    setDebugIndex(log.findIndex(call => call.intercepted))
    emit(EVENTS.RELOAD);
  }

  const stepOver = () => {
    emit(EVENTS.NEXT);
    setDebugIndex(log.findIndex((call, index) => call.intercepted && index > debugIndex))
  };

  const [done, next, pending] = fold(log).reduce((acc, call, index) => {
    if (index < debugIndex || debugIndex === -1) acc[0].push(call)
    else if (index === debugIndex) acc[1] = call
    else if (index > debugIndex) acc[2].push(call)
    return acc
  }, [[], null, []])
  
  return (
    <AddonPanel {...props}>
      {done.filter(call => call.intercepted).map((call) => <Call call={call} state="done" key={call.id} />)}
      {next && <Call call={next} state="next" key={next.id} />}
      {pending.filter(call => call.intercepted).map((call) => <Call call={call} state="pending" key={call.id} />)}

      <div style={{ padding: 3 }}>
        <Button outline containsIcon title="Start debugging" onClick={startDebugger}>
          <Icons icon="undo" />
        </Button>
        <Button outline containsIcon title="Step over" onClick={stepOver} disabled={!next}>
          <Icons icon="arrowrightalt" />
        </Button>
      </div>
    </AddonPanel>
  );
};
