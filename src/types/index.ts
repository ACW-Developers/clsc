/** Shared cross-module types. Module-specific types live next to their module. */

export type ID = string;

/** Uniform result shape returned by service functions. */
export type ServiceResult<T> = { data: T; error: null } | { data: null; error: Error };
