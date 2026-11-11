// Google Tag Manager (GTM-KSSS83QZ), Google Analytics 4 & Google Consent Mode v2 Engine

export const GTM_CONTAINER_ID =
  process.env.NEXT_PUBLIC_GTM_ID || "GTM-KSSS83QZ";
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: string;
}

export const DEFAULT_CONSENT: CookieConsentState = {
  necessary: true,
  analytics: false,
  advertising: false,
  timestamp: new Date().toISOString(),
};

// Update Google Consent Mode v2
export const updateGoogleConsent = (consent: CookieConsentState) => {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: consent.advertising ? "granted" : "denied",
      ad_user_data: consent.advertising ? "granted" : "denied",
      ad_personalization: consent.advertising ? "granted" : "denied",
    });
  }
};

// Track Page Views
export const pageview = (url: string) => {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "page_view",
    page_path: url,
  });
  if (typeof w.gtag === "function" && GA_MEASUREMENT_ID) {
    w.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track Custom Event (supports both GTM dataLayer & gtag)
export const trackEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: action,
    event_category: category,
    event_label: label,
    value: value,
  });
  if (typeof w.gtag === "function") {
    w.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
