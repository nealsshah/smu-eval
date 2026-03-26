interface Window {
  gtag: (
    command: string,
    targetId: string,
    config?: Record<string, string | number | boolean>
  ) => void;
}
