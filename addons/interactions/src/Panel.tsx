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
  skipped?: boolean;
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

const Call = ({ call }: { call: Call }) => {
  const params = call.args
    .map((arg) => {
      if (arg?.id && arg?.key && arg?.args)
        return <Call key={call.id} call={arg} />;
      try {
        return <span key={arg}>{JSON.stringify(arg)}</span>;
      } catch (e) {
        return <span key={arg}>{String(arg)}</span>;
      }
    })
    .flatMap((elem, index, array) =>
      index === array.length - 1 ? [elem] : [elem, <span key={index}>, </span>]
    );
  const style = {
    display: "inline-block",
    padding: "1px 3px",
    margin: "1px 2px",
    background: "#1111",
    border: "1px solid #3333",
    borderRadius: 3,
    opacity: call.skipped ? 0.4 : 1,
  };
  return (
    <span style={style}>
      {call.key}({params})
    </span>
  );
};

export const Panel: React.FC<PanelProps> = (props) => {
  const [calls, setCalls] = React.useState([] as Call[]);

  const emit = useChannel({
    [EVENTS.CALL]: (call) => {
      setCalls((calls) => calls.concat(call));
    },
    storyChanged: () => {
      setCalls([]);
    },
  });

  const log = fold(calls);
  const next = () => {
    emit(EVENTS.NEXT);
    setCalls((calls) => {
      const index = calls.findIndex((call) => call.skipped);
      return [
        ...calls.slice(0, index),
        { ...calls[index], skipped: false },
        ...calls.slice(index + 1),
      ];
    });
  };

  return (
    <AddonPanel {...props}>
      <div style={{ padding: 5 }}>
        {log.map((call) => (
          <div key={call.id} style={{ padding: 3 }}>
            <Call call={call} />
          </div>
        ))}
        <div style={{ padding: 3 }}>
          <Button outline containsIcon title="Next" onClick={next} disabled={!log.some((call) => call.skipped)}>
            <Icons icon="proceed" />
          </Button>
        </div>
      </div>
    </AddonPanel>
  );
};
