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

const print = (call: Call, callsById: Record<Call["id"], Call>): string => {
  call.printed = true;
  const params = call.args.map((arg) => {
    if (arg?.__callId__ && callsById[arg.__callId__]) {
      return print(callsById[arg.__callId__], callsById);
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  });
  return `${call.key}(${params.join(", ")})`;
};

export const Panel: React.FC<PanelProps> = (props) => {
  const calls = React.useRef([] as Call[]);
  const callsById = React.useRef({} as Record<Call["id"], Call>);
  const [log, setLog] = React.useState([]);

  useChannel({
    [EVENTS.CALL]: (call) => {
      calls.current.push(call);
      callsById.current[call.id] = call;
    },
    storyRendered: () => {
      const log = calls.current.reduceRight((acc, call) => {
        if (call.printed) return acc;
        acc.unshift([call.id, print(call, callsById.current)]);
        return acc;
      }, []);
      calls.current = [];
      callsById.current = {};
      setLog(log);
    },
  });

  return (
    <AddonPanel {...props}>
      <ul>
        {log.map(([id, line]) => (
          <li key={id}>{line}</li>
        ))}
      </ul>
    </AddonPanel>
  );
};
