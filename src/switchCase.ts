import { type CaseHandler, type SwitchCaseBuilder } from "./types";
import { isCyclic, logCyclicError } from "./utils";
//Chainable discriminated union builder overload
import type { DiscriminatedUnionSwitchCaseBuilder } from "./types";
// Switch-case for literal types (object-based)
export function switchCase<T extends string | number | symbol, R>(
  value: T,
  cases: { [K in T]: R | (() => R) },
  defaultHandler?: (val: T) => R,
): R;

// Switch-case for discriminated unions (object-based)
export function switchCase<
  T,
  K extends keyof T,
  V extends T[K] & (string | number),
  R,
>(
  value: T,
  discriminator: K,
  cases: { [P in V]: R | ((val: T & { [Q in K]: P }) => R) },
  defaultHandler?: (val: T) => R,
): R;

// Switch-case for complex types with predicates (object-based)
export function switchCase<T, R>(
  value: T,
  cases: Record<string, CaseHandler<T, R>>,
  defaultHandler?: (val: T) => R,
): R;

// Switch-case for boolean conditions (array-based)
export function switchCase<T, R>(
  value: T,
  cases: Array<{ match: (val: T) => boolean; handler: R | ((val: T) => R) }>,
  defaultHandler?: (val: T) => R,
): R;

// Switch-case for chainable syntax
export function switchCase<T extends string | number | symbol, R>(
  value: T,
): SwitchCaseBuilder<T, R, T>;

export function switchCase<T, R>(value: T): SwitchCaseBuilder<T, R, never>;

//
export function switchCase<T, K extends keyof T, R>(
  value: T,
  discriminator: K,
): DiscriminatedUnionSwitchCaseBuilder<
  T,
  K,
  R,
  T[K] & (string | number | symbol)
>;

// Implementation
export function switchCase<T, K extends keyof T, R>(
  value: T,
  discriminatorOrCases?:
    | K
    | Record<string, any>
    | Array<{ match: (val: T) => boolean; handler: R | ((val: T) => R) }>,
  casesOrDefault?: Record<string, any> | ((val: T) => R),
  defaultHandler?: (val: T) => R,
):
  | R
  | SwitchCaseBuilder<T, R, any>
  | DiscriminatedUnionSwitchCaseBuilder<T, K, R, any> {
  // Chainable syntax
  if (discriminatorOrCases === undefined) {
    const cases: Array<{ match: any; handler: R | ((val: T) => R) }> = [];
    let defaultFn: ((val: T) => R) | undefined;

    const builder: SwitchCaseBuilder<T, R, any> = {
      case(match: any, handler: R | ((val: T) => R)) {
        cases.push({ match, handler });
        return this;
      },
      default(handler: (val: T) => R) {
        defaultFn = handler;
        return this as SwitchCaseBuilder<T, R, never>;
      },
      exhaustive() {
        return this.run() as any;
      },
      run() {
        for (const { match, handler } of cases) {
          const isMatch =
            typeof match === "function" ? match(value) : match === value;
          if (isMatch) {
            return typeof handler === "function"
              ? (handler as (val: T) => R)(value)
              : handler;
          }
        }
        if (defaultFn) {
          return defaultFn(value);
        }
        throw new Error(`No matching case for value: ${JSON.stringify(value)}`);
      },
    };

    return builder;
  }

  // Chainable discriminated union builder
  if (
    typeof discriminatorOrCases === "string" ||
    typeof discriminatorOrCases === "number" ||
    typeof discriminatorOrCases === "symbol"
  ) {
    // If casesOrDefault is provided, treat as direct discriminated union call
    if (casesOrDefault !== undefined) {
      const discriminator = discriminatorOrCases as K;
      const cases = casesOrDefault as Record<string, R | ((val: T) => R)>;
      const discriminatorValue = String(value[discriminator]);
      const handlerOrValue = cases[discriminatorValue];

      if (handlerOrValue !== undefined) {
        const result =
          typeof handlerOrValue === "function"
            ? (handlerOrValue as (val: T) => R)(value)
            : handlerOrValue;
        if (isCyclic(result))
          logCyclicError(casesOrDefault, ["root"], "Cycle detected");
        return result;
      }

      if (defaultHandler) {
        const result = defaultHandler(value);
        if (isCyclic(result))
          logCyclicError(casesOrDefault, ["root"], "Cycle detected");
        return result;
      }

      throw new Error(
        `No matching case for ${String(discriminator)}: ${discriminatorValue}`,
      );
    }

    // Otherwise, return the chainable builder
    const discriminator = discriminatorOrCases as K;
    type DiscriminatorValue = T[K] & (string | number | symbol);

    function createDiscriminatedUnionBuilder<
      TFull,
      KFull extends keyof TFull,
      RFull,
      RemainingFull extends string | number | symbol,
    >(
      value: TFull,
      discriminator: KFull,
    ): DiscriminatedUnionSwitchCaseBuilder<TFull, KFull, RFull, RemainingFull> {
      const handlers = new Map<DiscriminatorValue, (val: any) => RFull>();
      let defaultFn: ((val: TFull) => RFull) | undefined;

      function caseFn<V extends RemainingFull>(
        valueKey: V,
        handler: (val: import("./types").VariantOf<TFull, KFull, V>) => RFull,
      ) {
        handlers.set(
          valueKey as DiscriminatorValue,
          handler as (val: any) => RFull,
        );
        return builder as any;
      }

      function defaultFnSetter(handler: (val: TFull) => RFull) {
        defaultFn = handler;
        return builder as any;
      }

      function run() {
        const discriminatorValue = value[discriminator] as DiscriminatorValue;
        if (handlers.has(discriminatorValue)) {
          return handlers.get(discriminatorValue)!(value);
        }
        if (defaultFn) {
          return defaultFn(value);
        }
        throw new Error(
          `No matching case for ${String(discriminator)}: ${String(discriminatorValue)}`,
        );
      }

      const builder = {
        case: caseFn,
        default: defaultFnSetter,
        run,
      };

      return builder as DiscriminatedUnionSwitchCaseBuilder<
        TFull,
        KFull,
        RFull,
        RemainingFull
      >;
    }

    return createDiscriminatedUnionBuilder<
      T,
      K,
      R,
      T[K] & (string | number | symbol)
    >(value, discriminator);
  }

  // Boolean condition case (array-based)
  if (Array.isArray(discriminatorOrCases)) {
    if (isCyclic(discriminatorOrCases)) {
      logCyclicError(discriminatorOrCases, ["root"], "Cycle detected");
    }
    const cases = discriminatorOrCases;
    const defaultFn = casesOrDefault as ((val: T) => R) | undefined;

    for (const { match, handler } of cases) {
      if (match(value)) {
        return typeof handler === "function" ? handler(value) : handler;
      }
    }

    if (defaultFn) {
      return defaultFn(value);
    }

    throw new Error(`No matching case for value: ${JSON.stringify(value)}`);
  }

  // Literal type or complex predicate case (object-based)
  if (typeof discriminatorOrCases === "object") {
    if (isCyclic(discriminatorOrCases))
      throw new Error(
        "Cyclic cases detected. See ts-switch-case README for handling cycles (e.g., sanitizeNode for React).",
      );
    const cases = discriminatorOrCases;
    const defaultFn = casesOrDefault as ((val: T) => R) | undefined;
    const literalHandler = cases[String(value)];

    if (literalHandler !== undefined) {
      const result =
        typeof literalHandler === "function"
          ? literalHandler()
          : literalHandler;
      if (isCyclic(result))
        logCyclicError(discriminatorOrCases, ["root"], "Cycle detected");
      return result;
    }

    for (const key of Object.keys(cases)) {
      const c = cases[key];
      if (typeof c !== "function") {
        const match =
          typeof c.match === "function" ? c.match(value) : c.match === value;
        if (match) {
          const result =
            typeof c.handler === "function" ? c.handler(value) : c.handler;
          if (isCyclic(result))
            logCyclicError(discriminatorOrCases, ["root"], "Cycle detected");
          return result;
        }
      }
    }

    if (defaultFn) {
      const result = defaultFn(value);
      if (isCyclic(result))
        logCyclicError(discriminatorOrCases, ["root"], "Cycle detected");
      return result;
    }

    throw new Error(`No matching case for value: ${JSON.stringify(value)}`);
  }
  // If none of the above branches match, throw an error to satisfy return type
  throw new Error("Invalid arguments to switchCase");
}

// Utility for exhaustive checking in traditional switch
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable case: ${value}`);
}
