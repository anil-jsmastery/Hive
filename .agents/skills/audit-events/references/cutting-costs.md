> AI agents: this is one page from PostHog's docs. Full index of Markdown docs for LLMs: https://posthog.com/llms.txt

# Cutting product analytics costs

Canonical URL: https://posthog.com/docs/product-analytics/cutting-costs

> **Cloud region:** This page uses US Cloud hosts. For an EU Cloud project, use `https://eu.i.posthog.com` instead of `https://us.i.posthog.com` (ingestion host).

## On this page

- [Creating a billable usage dashboard](#creating-a-billable-usage-dashboard)
- [Use anonymous events](#use-anonymous-events)
- [Configure autocapture](#configure-autocapture)
- [Only call identify() once per session](#only-call-identify-once-per-session)
- [Only call group() once per session](#only-call-group-once-per-session)
- [Disable pageview or pageleave events](#disable-pageview-or-pageleave-events)

We aim to be significantly cheaper than our competitors. In addition to our [pay-as-you-go pricing](https://posthog.com/pricing.md), below are tips to reduce your product analytics costs:

## Creating a billable usage dashboard

Want to know exactly what's driving your bill? Create a dashboard with the [PostHog billable usage template](https://posthog.com/templates/posthog-billable-usage.md) to break down and analyze your usage across different events, SDK libraries, and products.

![PostHog billable usage dashboard](https://res.cloudinary.com/dmukukwp6/image/upload/posthog_billable_usage_b2b494d4bb.png)

This dashboard turns your billing usage into a live, interactive report — so you can create insights, spot spikes, and optimize how you're spending.

## Use anonymous events

PostHog captures two types of events: [**anonymous** and **identified**](https://posthog.com/docs/data/anonymous-vs-identified-events.md). Under our current [pricing](https://posthog.com/pricing.md), anonymous events can be up to 4x cheaper than identified ones (due to the cost of processing them), so it's recommended you only capture identified events when needed.

See our docs on [anonymous vs identified events](https://posthog.com/docs/data/anonymous-vs-identified-events.md) for more information on the differences between them and how to capture them.

## Configure autocapture

[Autocapture](https://posthog.com/docs/product-analytics/autocapture.md) is a powerful feature that captures many events automatically. It can also capture more than you need. To reduce which events are captured, you can [set an allow or ignore list](https://posthog.com/docs/product-analytics/autocapture.md#reducing-events-with-an-allow-and-ignorelist).

Alternatively, you can [disable autocapture](https://posthog.com/docs/product-analytics/autocapture.md#disabling-autocapture) completely.

## Only call `identify()` once per session

It's only necessary to [identify](https://posthog.com/docs/product-analytics/identify.md) a user once per session, and you don't need to add your own checks to prevent duplicate calls. If the user is already identified, calling `identify()` again with the same distinct ID doesn't capture another `$identify` event. Instead, it captures a `$set` event only when the person properties you pass have changed.

## Only call `group()` once per session

In client-side SDKs, it's only necessary to call [`group()`](https://posthog.com/docs/product-analytics/group-analytics.md) once per session. Prevent calling it multiple times to send fewer events and reduce costs.

To see where duplicate `$groupidentify` events are being generated, you can use the following SQL:

```
SELECT properties.$lib AS lib, count() AS groupidentify_event_count
FROM events
WHERE event = '$groupidentify'
  AND $session_id IN (
    SELECT $session_id
    FROM events
    WHERE event = '$groupidentify'
      ```
SELECT properties.$lib AS lib, count() AS groupidentify_event_count
FROM events
WHERE event = '$groupidentify'
  AND $session_id IN (
    SELECT $session_id
    FROM events
    WHERE event = '$groupidentify'
      AND timestamp &gt;= now() - INTERVAL 30 DAY
      AND timestamp &lt; now()
    GROUP BY $session_id
    HAVING count() &gt; 1
  )
GROUP BY lib
ORDER BY groupidentify_event_count DESC
    GROUP BY $session_id
    HAVING count() > 1
  )
  AND timestamp >= now() - INTERVAL 30 DAY
  AND timestamp < now()
GROUP BY lib
ORDER BY groupidentify_event_count DESC
```

## Disable pageview or pageleave events

PostHog automatically captures pageviews and pageleaves. This is great for analytics, but it may capture more events than you need. An alternative is disabling these events and capturing them manually for the pages you need instead.

To disable automatically capturing these events, set `capture_pageview` and `capture_pageleave` to `false` in the configuration options when initializing PostHog:

```javascript
posthog.init('<ph_project_token>', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    capture_pageview: false,
    capture_pageleave: false,
  })
```

To manually capture these events, call `posthog.capture('$pageview')` and `posthog.capture('$pageleave')`.

> **Note:** Disabling pageview and pageleave events may prevent other PostHog features from working, like [bounce rate](/docs/data/events.md#how-events-power-posthog).
