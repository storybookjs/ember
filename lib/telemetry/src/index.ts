import { logger } from '@storybook/client-logger';
import type { EventType, Payload, Options, TelemetryData } from './types';
import { getStorybookMetadata } from './storybook-metadata';
import { sendTelemetry } from './telemetry';
import { notify } from './notify';
import { sanitizeError } from './sanitize';

export * from './storybook-metadata';

export const telemetry = async (
  eventType: EventType,
  payload: Payload = {},
  options?: Partial<Options>
) => {
  await notify();
  const telemetryData: TelemetryData = {
    eventType,
    payload,
  };
  try {
    telemetryData.metadata = await getStorybookMetadata(options.configDir);
  } catch (error) {
    if (!telemetryData.payload.error) telemetryData.payload.error = error;
  } finally {
    const { error } = telemetryData.payload;
    if (error) {
      // make sure to anonymise possible paths from error messages
      telemetryData.payload.error = sanitizeError(error);
    }

    if (!telemetryData.payload.error || options.enableCrashReports) {
      if (process.env?.STORYBOOK_DEBUG_TELEMETRY) {
        logger.info('\n[telemetry]');
        logger.info(JSON.stringify(telemetryData, null, 2));
      } else {
        await sendTelemetry(telemetryData, options);
      }
    }
  }
};
