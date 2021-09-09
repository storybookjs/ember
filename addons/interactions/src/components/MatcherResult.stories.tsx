import React from 'react';
import dedent from 'ts-dedent';
import { MatcherResult } from './MatcherResult';

export default {
  title: 'Addons/Interactions/MatcherResult',
  component: MatcherResult,
  decorators: [
    (Story: any) => (
      <span style={{ fontFamily: 'Monaco, monospace', fontSize: 12 }}>
        <Story />
      </span>
    ),
  ],
};

export const Expected = {
  args: {
    message: dedent`
      expect(jest.fn()).lastCalledWith(...expected)

      Expected: {"email": "michael@chromatic.com", "password": "testpasswordthatwontfail"}
      
      Number of calls: 0
    `,
  },
};

export const ExpectedReceived = {
  args: {
    message: dedent`
      expect(jest.fn()).toHaveBeenCalledWith(...expected)

      Expected: called with 0 arguments
      Received: {"email": "michael@chromatic.com", "password": "testpasswordthatwontfail"}

      Number of calls: 1 
    `,
  },
};

export const ExpectedNumberOfCalls = {
  args: {
    message: dedent`
      expect(jest.fn()).toHaveBeenCalledTimes(expected)

      Expected number of calls: 1
      Received number of calls: 0
    `,
  },
};

export const Diff = {
  args: {
    message: dedent`
      expect(jest.fn()).toHaveBeenCalledWith(...expected)

      - Expected
      + Received
      
        Object {
      -   "email": "michael@chromatic.com",
      +   "email": "michael@chromaui.com",
          "password": "testpasswordthatwontfail",
        },
      
      Number of calls: 1
    `,
  },
};
