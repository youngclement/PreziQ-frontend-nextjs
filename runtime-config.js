/**
 * Runtime configuration for Next.js
 * This file contains configuration options that affect how Next.js behaves at runtime
 */
module.exports = {
    // Disable server-side rendering for pages with browser-only APIs
    unstable_runtimeJS: true,
    // Enable fully dynamic rendering for all pages
    // This prevents "document is not defined" errors during build
    unstable_JsPreload: false,
    // Skip static generation to avoid document/window errors
    unstable_skipMiddlewareUrlNormalize: true,
    // Disable static optimization
    optimizeCss: false,
}; 