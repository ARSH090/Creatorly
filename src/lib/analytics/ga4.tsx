import Script from 'next/script';

/**
 * Google Analytics 4 Integration Component
 * Add this to your app layout
 */

interface GA4Config {
  measurementId: string;
  enableDebugMode?: boolean;
  anonymizeIp?: boolean;
}

export function GA4Analytics({ measurementId, enableDebugMode = false }: GA4Config) {
  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              debug_mode: ${enableDebugMode},
              anonymize_ip: true,
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

/**
 * Analytics tracking utilities
 */

export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, eventParams);
}

export function trackPageView(pagePath: string, pageTitle: string) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackUserSignup(userId: string, method: string) {
  trackEvent('sign_up', {
    method,
    user_id: userId,
  });
}

export function trackLogin(userId: string, method: string) {
  trackEvent('login', {
    method,
    user_id: userId,
  });
}

export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string,
  items: Array<{ item_id: string; item_name: string; price: number }>
) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });
}

export function trackAddToCart(itemId: string, itemName: string, price: number) {
  trackEvent('add_to_cart', {
    item_id: itemId,
    item_name: itemName,
    price,
  });
}

export function trackRemoveFromCart(itemId: string, itemName: string, price: number) {
  trackEvent('remove_from_cart', {
    item_id: itemId,
    item_name: itemName,
    price,
  });
}

export function trackViewItem(itemId: string, itemName: string, price: number) {
  trackEvent('view_item', {
    item_id: itemId,
    item_name: itemName,
    price,
  });
}

export function trackException(description: string, fatal: boolean = false) {
  trackEvent('exception', {
    description,
    fatal,
  });
}

export function trackTiming(category: string, name: string, value: number, label?: string) {
  trackEvent('timing_complete', {
    name,
    value,
    event_category: category,
    event_label: label,
  });
}

/**
 * Custom events for Creatorly-specific actions
 */

export function trackProductCreated(productId: string, productName: string, price: number) {
  trackEvent('product_created', {
    product_id: productId,
    product_name: productName,
    price,
    timestamp: new Date().toISOString(),
  });
}

export function trackCreatorDashboardView(creatorId: string) {
  trackEvent('creator_dashboard_view', {
    creator_id: creatorId,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaymentProcessing(orderId: string, amount: number, platform: string) {
  trackEvent('payment_started', {
    order_id: orderId,
    amount,
    platform,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaymentSuccess(orderId: string, amount: number, platform: string) {
  trackEvent('payment_completed', {
    order_id: orderId,
    amount,
    platform,
    timestamp: new Date().toISOString(),
  });
}

export function trackPaymentFailed(orderId: string, reason: string) {
  trackEvent('payment_failed', {
    order_id: orderId,
    reason,
    timestamp: new Date().toISOString(),
  });
}

export function trackCouponApplied(couponCode: string, discount: number) {
  trackEvent('coupon_applied', {
    coupon_code: couponCode,
    discount,
    timestamp: new Date().toISOString(),
  });
}

export function trackRefundRequested(orderId: string, amount: number, reason: string) {
  trackEvent('refund_requested', {
    order_id: orderId,
    amount,
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global site tag (gtag) function type declaration
 */
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

export default GA4Analytics;
