/* eslint-disable camelcase -- PostHog wire contract. */
import type { CaptureResult, PostHog } from 'posthog-js';

import { BUILD_REVISION } from './build-revision.generated';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u;
const REVISION = /^[a-f0-9]{40}$/u;
const EVENTS = new Set([
  'catalog_load_result',
  'catalog_search',
  'document_download_result',
  'result_clicked',
  'search_zero_results',
  'service_visit',
]);
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const hasValidSection = (input: Record<string, unknown>) =>
  input['section'] === 'diplomas' || input['section'] === 'masters';

const isAllowedString = (
  value: unknown,
  allowed: readonly string[],
): value is string => typeof value === 'string' && allowed.includes(value);

const documentDownloadDimensions = (
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  const outcome = input['outcome'];
  if (
    !hasValidSection(input) ||
    !isAllowedString(outcome, [
      'browser_handoff',
      'client_error',
      'http_error',
      'invalid_response',
      'not_found',
    ])
  )
    return null;
  const dimensions: Record<string, unknown> = {
    outcome,
    section: input['section'],
  };
  const attempt = input['search_attempt_id'];
  if (typeof attempt === 'string' && UUID.test(attempt))
    dimensions['search_attempt_id'] = attempt;
  return dimensions;
};

const catalogLoadDimensions = (
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  const outcome = input['outcome'];
  const trigger = input['trigger'];
  if (
    !hasValidSection(input) ||
    !isAllowedString(outcome, ['error', 'fresh', 'stale']) ||
    !isAllowedString(trigger, ['initial', 'retry'])
  )
    return null;
  const dimensions: Record<string, unknown> = {
    outcome,
    section: input['section'],
    trigger,
  };
  if (outcome === 'error' && typeof input['retained_data'] === 'boolean')
    dimensions['retained_data'] = input['retained_data'];
  return dimensions;
};

const rankClickDimensions = (
  input: Record<string, unknown>,
  properties: Record<string, unknown>,
): null | Record<string, unknown> => {
  if (!isCount(input['position'])) return null;
  properties['position'] = input['position'];
  return properties;
};

const searchResultDimensions = (
  event: string,
  input: Record<string, unknown>,
  properties: Record<string, unknown>,
): null | Record<string, unknown> => {
  const trigger = input['trigger'];
  if (
    event === 'catalog_search' &&
    !isAllowedString(trigger, [
      'data_refresh',
      'filter_change',
      'initial',
      'query_edit',
      'sort_change',
    ])
  )
    return null;
  if (event === 'search_zero_results' && input['result_count'] !== 0)
    return null;
  if (
    !isCount(input['result_count']) ||
    properties['search_attempt_id'] === undefined
  )
    return null;
  properties['result_count'] = input['result_count'];
  if (event === 'catalog_search') properties['trigger'] = trigger;
  return properties;
};

const searchDimensions = (
  event: string,
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  if (!hasValidSection(input)) return null;
  const properties: Record<string, unknown> = { section: input['section'] };
  const attempt = input['search_attempt_id'];
  if (typeof attempt === 'string' && UUID.test(attempt))
    properties['search_attempt_id'] = attempt;
  return event === 'result_clicked'
    ? rankClickDimensions(input, properties)
    : searchResultDimensions(event, input, properties);
};

const eventDimensions = (
  event: string,
  input: Record<string, unknown>,
): null | Record<string, unknown> => {
  if (event === 'service_visit') return {};
  if (event === 'document_download_result')
    return documentDownloadDimensions(input);
  return event === 'catalog_load_result'
    ? catalogLoadDimensions(input)
    : searchDimensions(event, input);
};

// Reconstruct both envelope and properties: SDK defaults include URLs and referrers.
export const sanitizeAnalytics = (
  event: CaptureResult | null,
): CaptureResult | null => {
  if (!event || !EVENTS.has(event.event) || !UUID.test(event.uuid)) return null;
  const input = event.properties;
  const dimensions = eventDimensions(event.event, input);
  if (!dimensions) return null;
  const properties: Record<string, unknown> = {
    ...dimensions,
    $process_person_profile: false,
    analytics_schema_version: 2,
    service: 'theses-listing',
    token: import.meta.env.VITE_POSTHOG_KEY?.trim(),
  };
  if (BUILD_REVISION?.length === 40 && REVISION.test(BUILD_REVISION))
    properties['build_revision'] = BUILD_REVISION;
  for (const key of [
    'distinct_id',
    '$device_id',
    '$session_id',
    '$window_id',
  ]) {
    const value: unknown = input[key];
    if (typeof value === 'string' && UUID.test(value)) properties[key] = value;
  }
  return {
    event: event.event,
    properties,
    timestamp:
      event.timestamp instanceof Date &&
      Number.isFinite(event.timestamp.getTime())
        ? // eslint-disable-next-line unicorn/prefer-temporal -- PostHog requires a Date timestamp.
          new Date(event.timestamp)
        : undefined,
    uuid: event.uuid,
  };
};

// posthog-js is about half of the bundle, so it is loaded in its own chunk
// after the app starts. Events captured before it arrives are queued.
const MAX_PENDING_EVENTS = 50;
const pendingEvents: Array<[string, Record<string, unknown>]> = [];
const sdk: { client: null | PostHog; loading: null | Promise<void> } = {
  client: null,
  loading: null,
};

const captureSafely = (
  posthog: PostHog,
  event: string,
  properties: Record<string, unknown>,
) => {
  try {
    posthog.capture(event, properties);
  } catch {
    // Telemetry is best-effort and must never affect app behavior.
  }
};

const startPostHog = (posthog: PostHog, key: string) => {
  posthog.init(key, {
    advanced_disable_feature_flags: true,
    advanced_disable_flags: true,
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    autocapture: false,
    before_send: sanitizeAnalytics,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_pageleave: false,
    capture_pageview: false,
    capture_performance: false,
    debug: false,
    disable_conversations: true,
    disable_external_dependency_loading: true,
    disable_product_tours: true,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    logs: { beforeSend: () => null, captureConsoleLogs: false },
    metrics: { beforeSend: () => null, network: false },
    persistence: 'memory',
    person_profiles: 'never',
    respect_dnt: true,
    save_campaign_params: false,
    save_referrer: false,
  });
  sdk.client = posthog;
  captureSafely(posthog, 'service_visit', {});
  for (const [event, properties] of pendingEvents.splice(0)) {
    captureSafely(posthog, event, properties);
  }
};

const loadPostHog = async (key: string) => {
  try {
    const { posthog } = await import('posthog-js');
    startPostHog(posthog, key);
  } catch {
    // Telemetry is best-effort; a blocked or failed chunk is ignored.
    pendingEvents.length = 0;
  }
};

export const initAnalytics = (): Promise<void> => {
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim();
  if (!key) return Promise.resolve();

  sdk.loading ??= loadPostHog(key);
  return sdk.loading;
};

export const captureAnalytics = (
  event: string,
  properties: Record<string, unknown>,
) => {
  if (!import.meta.env.VITE_POSTHOG_KEY?.trim()) return;
  if (sdk.client) {
    captureSafely(sdk.client, event, properties);
  } else if (pendingEvents.length < MAX_PENDING_EVENTS) {
    pendingEvents.push([event, properties]);
  }
};
