import * as React from 'react';
import { Call, CallStates, ControlStates } from '@storybook/instrumenter';
import { styled, typography } from '@storybook/theming';
import { transparentize } from 'polished';

import { MatcherResult } from '../MatcherResult';
import { MethodCall } from '../MethodCall';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import { Controls } from '../../Panel';

const MethodCallWrapper = styled.div(() => ({
  fontFamily: typography.fonts.mono,
  fontSize: typography.size.s1,
}));

const RowContainer = styled('div', { shouldForwardProp: (prop) => !['call'].includes(prop) })<{
  call: Call;
}>(({ theme, call }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderBottom: `1px solid ${theme.appBorderColor}`,
  fontFamily: typography.fonts.base,
  fontSize: 13,
  ...(call.status === CallStates.ERROR && {
    backgroundColor:
      theme.base === 'dark' ? transparentize(0.93, theme.color.negative) : theme.background.warning,
  }),
}));

const RowLabel = styled('button', { shouldForwardProp: (prop) => !['call'].includes(prop) })<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { call: Call }
>(({ theme, disabled, call }) => ({
  display: 'grid',
  background: 'none',
  border: 0,
  gridTemplateColumns: '15px 1fr',
  alignItems: 'center',
  minHeight: 40,
  margin: 0,
  padding: '8px 15px',
  textAlign: 'start',
  cursor: disabled || call.status === CallStates.ERROR ? 'default' : 'pointer',
  '&:hover': disabled ? {} : { background: theme.background.hoverable },
  '&:focus-visible': {
    outline: 0,
    boxShadow: `inset 3px 0 0 0 ${
      call.status === CallStates.ERROR ? theme.color.warning : theme.color.secondary
    }`,
    background: call.status === CallStates.ERROR ? 'transparent' : theme.background.hoverable,
  },
  '& > div': {
    opacity: call.status === CallStates.WAITING ? 0.5 : 1,
  },
}));

const RowMessage = styled('pre')({
  margin: 0,
  padding: '8px 10px 8px 30px',
  fontSize: typography.size.s1,
});

export const Interaction = ({
  call,
  callsById,
  controls,
  controlStates,
}: {
  call: Call;
  callsById: Map<Call['id'], Call>;
  controls: Controls;
  controlStates: ControlStates;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <RowContainer call={call}>
      <RowLabel
        call={call}
        onClick={() => controls.goto(call.id)}
        disabled={!controlStates.goto}
        onMouseEnter={() => controlStates.goto && setIsHovered(true)}
        onMouseLeave={() => controlStates.goto && setIsHovered(false)}
      >
        <StatusIcon status={isHovered ? CallStates.ACTIVE : call.status} />
        <MethodCallWrapper style={{ marginLeft: 6, marginBottom: 1 }}>
          <MethodCall call={call} callsById={callsById} />
        </MethodCallWrapper>
      </RowLabel>
      {call.status === CallStates.ERROR &&
        call.exception &&
        (call.exception.message.startsWith('expect(') ? (
          <MatcherResult {...call.exception} />
        ) : (
          <RowMessage>{call.exception.message}</RowMessage>
        ))}
    </RowContainer>
  );
};
