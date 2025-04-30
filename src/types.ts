/**
 * Represents a handler for a case in a switch-case structure.
 *
 * @template T - The type of the value being matched.
 * @template R - The return type of the handler function.
 * @property {T} match - A value or a function to match against the input.
 * @property {(val: T) => R} handler - A function that processes the matched value and returns a result.
 */
export type CaseHandler<T, R> =
  | { match: T; handler: (val: T) => R }
  | { match: (val: T) => boolean; handler: (val: T) => R };

/**
 * Interface for building a switch-case structure with fluent API.
 *
 * @template T - The type of the value being matched.
 * @template R - The return type of the handler functions.
 * @template Remaining - The remaining keys that can be matched.
 */
export interface SwitchCaseBuilder<
  T,
  R,
  Remaining extends string | number | symbol = never,
> {
  /**
   * Adds a case to the switch-case structure.
   *
   * @template K - The type of the key being matched.
   * @param {K} match - A value to match or a function to evaluate the match.
   * @param {R | (() => R)} handler - A result or a function that returns a result for the matched case.
   * @returns {SwitchCaseBuilder<T, R, Exclude<Remaining, K>>} - The updated builder with the new case added.
   */
  case: (<K extends Remaining>(
    match: K,
    handler: R | (() => R),
  ) => SwitchCaseBuilder<T, R, Exclude<Remaining, K>>) &
    ((
      match: (val: T) => boolean,
      handler: R | ((val: T) => R),
    ) => SwitchCaseBuilder<T, R, Remaining>);

  /**
   * Adds a default handler for unmatched cases.
   *
   * @param {(val: T) => R} handler - A function to handle unmatched cases.
   * @returns {SwitchCaseBuilder<T, R, never>} - The updated builder with the default handler added.
   */
  default: (handler: (val: T) => R) => SwitchCaseBuilder<T, R, never>;

  /**
   * Ensures all cases are handled and returns the result.
   *
   * @returns {Remaining extends never ? R : never} - The result of the matched case or an error if cases are missing.
   */
  exhaustive: () => Remaining extends never ? R : never;

  /**
   * Executes the switch-case structure and returns the result.
   *
   * @returns {R} - The result of the matched case or the default handler.
   */
  run: () => R;
}
