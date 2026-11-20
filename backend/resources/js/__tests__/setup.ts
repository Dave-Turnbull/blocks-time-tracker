import '@testing-library/jest-dom';

// jsdom has no ResizeObserver; components only need it to exist.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
