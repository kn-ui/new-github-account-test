// Disable console output in production to avoid leaking debug info
// Works with Vite (import.meta.env.PROD) and fallback to NODE_ENV
(() => {
  let isProd = false;
  try {
    // @ts-ignore - import.meta typing may vary across toolchains
    isProd = Boolean((import.meta as any)?.env?.PROD);
  } catch {
    isProd = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'production';
  }
  if (!isProd) return;
  const methods: Array<keyof Console> = ['log', 'info', 'warn', 'error', 'debug'];
  methods.forEach((m) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (console as any)[m] = () => {};
    } catch {}
  });
})();
