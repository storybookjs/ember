/* eslint-disable storybook/default-exports */
// @TODO: can we delete this file? doesn't seem to make sense.
import React from 'react';

import BaseButton from '../components/BaseButton';

export const Story1 = () => <BaseButton label="Story 1" />;
Story1.storyName = 'story 1';

export const Story2 = () => <BaseButton label="Story 2" />;
Story2.storyName = 'story 2';
