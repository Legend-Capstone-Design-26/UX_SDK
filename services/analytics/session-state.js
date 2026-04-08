const { inferStepFromEvent, stepIndex } = require("../../analytics/funnel");

function mergeSessionState(currentState, event) {
  const current = currentState && typeof currentState === "object" ? currentState : {};
  const nextStep = inferStepFromEvent(event);
  const currentMaxStep = typeof current.max_step === "string" ? current.max_step : "home";
  const maxStep = stepIndex(nextStep) >= stepIndex(currentMaxStep) ? nextStep : currentMaxStep;

  return {
    site_id: event.site_id || current.site_id || null,
    session_id: event.session_id || current.session_id || null,
    anon_user_id: event.anon_user_id || current.anon_user_id || null,
    started_at: typeof current.started_at === "number" ? current.started_at : (event.ts || Date.now()),
    last_ts: event.ts || Date.now(),
    last_event_name: event.event_name || current.last_event_name || null,
    last_path: event.path || current.last_path || null,
    ui_variant: event.ui_variant || current.ui_variant || null,
    event_count: (Number(current.event_count) || 0) + 1,
    page_view_count: (Number(current.page_view_count) || 0) + (event.event_name === "page_view" ? 1 : 0),
    click_count: (Number(current.click_count) || 0) + (event.event_name === "click" ? 1 : 0),
    checkout_started: Boolean(current.checkout_started) || event.event_name === "checkout_start",
    checkout_completed: Boolean(current.checkout_completed) || event.event_name === "checkout_complete",
    last_dwell_ms: typeof event.props?.dwell_ms === "number" ? event.props.dwell_ms : (current.last_dwell_ms || null),
    max_step: maxStep,
    experiments: Array.isArray(event.experiments) ? event.experiments : (Array.isArray(current.experiments) ? current.experiments : []),
  };
}

function extractVariantAssignments(event) {
  const experiments = Array.isArray(event?.experiments) ? event.experiments : [];
  return experiments
    .filter((item) => item && item.key && item.variant)
    .map((item) => ({
      siteId: event.site_id,
      anonUserId: event.anon_user_id,
      experimentKey: item.key,
      variant: item.variant,
      version: item.version || null,
    }))
    .filter((item) => item.siteId && item.anonUserId && item.experimentKey);
}

module.exports = {
  mergeSessionState,
  extractVariantAssignments,
};
