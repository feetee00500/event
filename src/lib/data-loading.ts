export type DataLoadResult<T> = {
  data: T;
  hasError: boolean;
};

export async function loadWithFallback<T>(loader: () => Promise<T>, fallback: T, context: string): Promise<DataLoadResult<T>> {
  try {
    return { data: await loader(), hasError: false };
  } catch (error) {
    console.error(`[${context}] data load failed`, error);
    return { data: fallback, hasError: true };
  }
}
