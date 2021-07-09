import React from "react";
import { useChannel } from "@storybook/api";
import { AddonPanel } from "@storybook/components";
import { EVENTS } from "./constants";
interface PanelProps {
  active: boolean;
}

interface Call {
  id: string;
  key: string;
  args: any[];
  printed?: true;
}

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
      return callsById[arg.__callId__];
    });
    acc.unshift(call);
    seen.add(call.id);
    return acc;
  }, []);
};

const Call = ({ call }: { call: Call }) => {
  const params = call.args.map((arg) => {
    if (arg?.id && arg?.key && arg?.args)
      return <Call key={call.id} call={arg} />;
    try {
      return <span key={arg}>{JSON.stringify(arg)}</span>;
    } catch (e) {
      return <span key={arg}>{String(arg)}</span>;
    }
  }).flatMap((elem, index, array) => index === array.length -1 ? [elem] : [elem, <span>, </span>])
  const style = {
    display: "inline-block",
    padding: "1px 3px",
    margin: "1px 2px",
    background: "#1111",
    border: "1px solid #3333",
    borderRadius: 3,
  };
  return (
    <span style={style}>
      {call.key}({params})
    </span>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
  const calls = React.useRef([] as Call[]);
  const [log, setLog] = React.useState([]);

  useChannel({
    [EVENTS.CALL]: (call) => {
      calls.current.push(call);
    },
    storyRendered: () => {
      const log = fold(calls.current);
      calls.current = [];
      setLog(log);
    },
  });

  return (
    <AddonPanel {...props}>
      {log.map((call) => (
        <div key={call.id} style={{ margin: 3 }}>
          <Call call={call} />
        </div>
      ))}
    </AddonPanel>
  );
};
