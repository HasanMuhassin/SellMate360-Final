// Note: Supabase query builders are thenables but not typed as Promises.
// This helper intentionally accepts `unknown` and normalizes via Promise.resolve.
export function withTimeout<T>(
  promiseLike: unknown,
  ms: number,
  label = 'Operation'
): Promise<T> {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  const promise = Promise.resolve(promiseLike as any) as Promise<T>;

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  });
}
