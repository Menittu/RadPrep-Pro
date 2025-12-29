
export {};

declare global {
  // The AIStudio type is pre-configured in the environment; aligning the window property type to avoid declaration mismatch.
  interface Window {
    aistudio?: AIStudio;
  }
}
