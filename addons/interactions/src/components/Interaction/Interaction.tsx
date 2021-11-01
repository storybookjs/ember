import * as React from 'react';
import { Call, CallStates } from '@storybook/instrumenter';
import { styled, typography } from '@storybook/theming';
import { transparentize } from 'polished';

import { MatcherResult } from '../MatcherResult';
import { MethodCall } from '../MethodCall';
import { StatusIcon } from '../StatusIcon/StatusIcon';

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
  ...(call.state === CallStates.ERROR && {
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
  cursor: disabled || call.state === CallStates.ERROR ? 'default' : 'pointer',
  '&:hover': {
    background: theme.background.hoverable,
  },
  '&:focus-visible': {
    outline: 0,
    boxShadow: `inset 3px 0 0 0 ${
      call.state === CallStates.ERROR ? theme.color.warning : theme.color.secondary
    }`,
    background: call.state === CallStates.ERROR ? 'transparent' : theme.background.hoverable,
  },
  '& > div': {
    opacity: call.state === CallStates.WAITING ? 0.5 : 1,
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
  onClick,
  isDisabled,
  isDebuggingEnabled,
}: {
  call: Call;
  callsById: Map<Call['id'], Call>;
  onClick: React.MouseEventHandler<HTMLElement>;
  isDisabled: boolean;
  isDebuggingEnabled?: boolean;
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <RowContainer call={call}>
      <RowLabel
        call={call}
        onClick={onClick}
        disabled={isDebuggingEnabled ? isDisabled : true}
        onMouseEnter={() => isDebuggingEnabled && setIsHovered(true)}
        onMouseLeave={() => isDebuggingEnabled && setIsHovered(false)}
      >
        <StatusIcon status={isHovered ? CallStates.ACTIVE : call.state} />
        <MethodCallWrapper style={{ marginLeft: 6, marginBottom: 1 }}>
          <MethodCall call={call} callsById={callsById} />
        </MethodCallWrapper>
      </RowLabel>
      {call.state === CallStates.ERROR &&
        call.exception &&
        (call.exception.message.startsWith('expect(') ? (
          <MatcherResult {...call.exception} />
        ) : (
          <RowMessage>{call.exception.message}</RowMessage>
        ))}
    </RowContainer>
  );
};
