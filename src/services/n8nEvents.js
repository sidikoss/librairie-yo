const N8N_EVENTS_ENDPOINT = "/api/n8n-event";

function withBrowserMetadata(payload) {
  if (typeof window === "undefined") {
    return payload;
  }

  return {
    ...payload,
    siteUrl: window.location.origin,
    page: window.location.pathname,
    userAgent: window.navigator?.userAgent || "",
  };
}

async function postN8nEvent(event, data) {
  const body = withBrowserMetadata({
    event,
    data,
    sentAt: Date.now(),
    source: "librairie-yo-gui",
  });

  try {
    const response = await fetch(N8N_EVENTS_ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.warn(
        `[n8n-events] ${event} failed (${response.status})`,
        details || "",
      );
    }
  } catch (error) {
    console.warn(`[n8n-events] ${event} failed`, error);
  }
}

export function notifyOrderCreated(payload) {
  return postN8nEvent("order.created", payload);
}

export function notifyOrderStatusChanged(payload) {
  return postN8nEvent("order.status_changed", payload);
}

