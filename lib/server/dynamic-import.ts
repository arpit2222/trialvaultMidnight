/**
 * Dynamic import helper that is completely opaque to webpack.
 *
 * `new Function('return import(...)')()` prevents webpack from statically analyzing
 * the import — no matter what compilation mode Next.js uses. Node.js handles the
 * actual module loading at runtime using its native ESM loader.
 *
 * This is the only reliable way to import ESM-only packages (like @midnight-ntwrk/compact-js
 * which has no CJS dist) from Next.js App Router route handlers without webpack bundling them.
 */
export function nodeImport<T = Record<string, unknown>>(specifier: string): Promise<T> {
  // eslint-disable-next-line no-new-func
  return new Function(`return import(${JSON.stringify(specifier)})`)() as Promise<T>;
}
