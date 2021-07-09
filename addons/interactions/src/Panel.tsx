import React from "react";
import { useAddonState, useChannel } from "@storybook/api";
import { AddonPanel } from "@storybook/components";
import { ADDON_ID, EVENTS } from "./constants";
interface PanelProps {
  active: boolean;
}

const print = (call) => {
  console.log(call)
  const params = call.args.map((arg) => {
    if (arg?.id && arg?.key && arg?.args) {
      call.printed = true;
      return print(arg);
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
  const calls = React.useRef([])
  const [log, setLog] = React.useState([])
  
  useChannel({
    [EVENTS.CALL]: (call) => {
      calls.current = [call, ...calls.current]
    },
    storyRendered: () => {
      const log = []
      for (const call of calls.current) {
        if (!call.referenced) log.unshift([call.id, print(call)]);
      }
      setLog(log)
      calls.current = []
    }
  });

  return (
    <AddonPanel {...props}>
      <ul>
        {log.map(([id, line]) => (
          <li key={id}>{line})</li>
        ))}
      </ul>
    </AddonPanel>
  );
};
