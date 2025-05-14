/**
 * Utility functions for client-side code
 */

/**
 * Check if code is executing in a browser environment
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Safe access to the document object
 * Returns null in server-side rendering environments
 */
export const getDocument = (): Document | null => {
  return isBrowser ? document : null;
};

/**
 * Safe access to the window object
 * Returns null in server-side rendering environments
 */
export const getWindow = (): Window | null => {
  return isBrowser ? window : null;
};

/**
 * Execute a function only on the client side
 * @param callback Function to execute on the client
 */
export const onlyClient = (callback: () => void): void => {
  if (isBrowser) {
    callback();
  }
};
