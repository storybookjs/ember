/* eslint-disable no-plusplus */
import fetch from 'isomorphic-unfetch';

import { sendTelemetry } from './telemetry';

jest.mock('isomorphic-unfetch');

const fetchMock = fetch as jest.Mock;

beforeEach(() => {
  fetchMock.mockResolvedValue({ status: 200 });
});

it('makes a fetch request with name and data', async () => {
  fetchMock.mockClear();
  await sendTelemetry({ eventType: 'start', payload: { foo: 'bar' } });

  expect(fetch).toHaveBeenCalledTimes(1);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body).toMatchObject({
    eventType: 'start',
    payload: { foo: 'bar' },
  });
});

it('retries if fetch fails with a 503', async () => {
  fetchMock.mockClear().mockResolvedValueOnce({ status: 503 });
  await sendTelemetry(
    {
      eventType: 'start',
      payload: { foo: 'bar' },
    },
    { retryDelay: 0 }
  );

  expect(fetch).toHaveBeenCalledTimes(2);
});

it('gives up if fetch repeatedly fails', async () => {
  fetchMock.mockClear().mockResolvedValue({ status: 503 });
  await sendTelemetry(
    {
      eventType: 'start',
      payload: { foo: 'bar' },
    },
    { retryDelay: 0 }
  );

  expect(fetch).toHaveBeenCalledTimes(4);
});

it('await all pending telemetry when passing in immediate = true', async () => {
  let numberOfResolvedTasks = 0;

  // when we call sendTelemetry with immediate = true
  // all pending tasks will be awaited
  // to test this we add a few telemetry tasks that will be in the 'queue'
  // we do NOT await these tasks!
  sendTelemetry({
    eventType: 'init',
    payload: { foo: 'bar' },
  }).then(() => {
    numberOfResolvedTasks++;
  });
  sendTelemetry({
    eventType: 'start',
    payload: { foo: 'bar' },
  }).then(() => {
    numberOfResolvedTasks++;
  });

  // here we await
  await sendTelemetry(
    {
      eventType: 'error-dev',
      payload: { foo: 'bar' },
    },
    { retryDelay: 0, immediate: true }
  ).then(() => {
    numberOfResolvedTasks++;
  });

  expect(fetch).toHaveBeenCalledTimes(3);
  expect(numberOfResolvedTasks).toBe(3);
});
