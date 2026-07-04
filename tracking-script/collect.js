/**
 * Analytics Tracking Script
 * Auto-injected with siteId and API base URL by the server.
 * Embed on a customer site via:
 *   <script src="https://yourapp.com/tracker.js?siteId=YOUR_SITE_ID"></script>
 */
(function () {
  'use strict';

  var SITE_ID = '__SITE_ID__';
  var API_BASE = '__API_BASE__';
  var HEARTBEAT_INTERVAL_MS = 20000;
  var VISITOR_KEY = '_an_visitor_id';
  var SESSION_KEY = '_an_session_id';
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000;

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      // localStorage unavailable (privacy mode, etc) - fall back to in-memory per-pageload id
      return uuid();
    }
  }

  function getOrCreateSessionId() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      var now = Date.now();

      if (raw) {
        var parsed = JSON.parse(raw);
        if (now - parsed.lastActivity < SESSION_TIMEOUT_MS) {
          parsed.lastActivity = now;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
          return parsed.id;
        }
      }

      var newId = uuid();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: newId, lastActivity: now }));
      return newId;
    } catch (e) {
      return uuid();
    }
  }

  var visitorId = getOrCreateVisitorId();

  function send(endpoint, payload) {
    var url = API_BASE + '/api/collect/' + endpoint;
    var body = JSON.stringify(payload);

    // Prefer sendBeacon for reliability on page unload; fall back to fetch
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  }

  function trackPageView() {
    var sessionId = getOrCreateSessionId();
    send('pageview', {
      siteId: SITE_ID,
      visitorId: visitorId,
      sessionId: sessionId,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || '',
    });
  }

  function trackEvent(eventName, metadata) {
    var sessionId = getOrCreateSessionId();
    send('event', {
      siteId: SITE_ID,
      visitorId: visitorId,
      sessionId: sessionId,
      eventName: eventName,
      metadata: metadata || {},
      path: window.location.pathname,
    });
  }

  function sendHeartbeat() {
    if (document.visibilityState !== 'visible') return;
    var sessionId = getOrCreateSessionId();
    send('heartbeat', {
      siteId: SITE_ID,
      visitorId: visitorId,
      sessionId: sessionId,
      path: window.location.pathname,
    });
  }

  // Auto-track clicks on elements with [data-analytics-event] attribute
  // Usage: <button data-analytics-event="signup_clicked" data-analytics-meta='{"plan":"pro"}'>Sign up</button>
  function bindAutoEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-analytics-event]');
      if (!el) return;

      var eventName = el.getAttribute('data-analytics-event');
      var metaAttr = el.getAttribute('data-analytics-meta');
      var metadata = {};

      if (metaAttr) {
        try {
          metadata = JSON.parse(metaAttr);
        } catch (e) {}
      }

      trackEvent(eventName, metadata);
    });

    // Auto-track form submissions on forms with [data-analytics-form]
    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-analytics-form]');
      if (!form) return;
      trackEvent(form.getAttribute('data-analytics-form') || 'form_submit', {
        formId: form.id || null,
      });
    });
  }

  // Support SPA route changes (React Router, Vue Router, etc.) by watching
  // for pushState/popState/replaceState calls.
  function patchHistoryForSpa() {
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    function onRouteChange() {
      trackPageView();
    }

    history.pushState = function () {
      originalPushState.apply(this, arguments);
      onRouteChange();
    };
    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      onRouteChange();
    };
    window.addEventListener('popstate', onRouteChange);
  }

  // Public API exposed on window so customer sites can fire custom events manually:
  //   window.Analytics.track('button_click', { id: 'cta-1' })
  window.Analytics = {
    track: trackEvent,
  };

  // Init
  trackPageView();
  bindAutoEvents();
  patchHistoryForSpa();
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
})();
