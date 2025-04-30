
import { type CaseHandler, type SwitchCaseBuilder } from "./types";

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

// Implementation
export function switchCase<T, K extends keyof T, R>(
  value: T,
  discriminatorOrCases?:
    | K
    | Record<string, any>
    | Array<{ match: (val: T) => boolean; handler: R | ((val: T) => R) }>,
  casesOrDefault?: Record<string, any> | ((val: T) => R),
  defaultHandler?: (val: T) => R,
): R | SwitchCaseBuilder<T, R, any> {
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

  // Boolean condition case (array-based)
  if (Array.isArray(discriminatorOrCases)) {
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
    const cases = discriminatorOrCases;
    const defaultFn = casesOrDefault as ((val: T) => R) | undefined;
    const literalHandler = cases[String(value)];

    if (literalHandler !== undefined) {
      return typeof literalHandler === "function"
        ? literalHandler()
        : literalHandler;
    }

    for (const key of Object.keys(cases)) {
      const c = cases[key];
      if (typeof c !== "function") {
        const match =
          typeof c.match === "function" ? c.match(value) : c.match === value;
        if (match) {
          return typeof c.handler === "function" ? c.handler(value) : c.handler;
        }
      }
    }

    if (defaultFn) {
      return defaultFn(value);
    }

    throw new Error(`No matching case for value: ${JSON.stringify(value)}`);
  }

  // Discriminated union case
  const discriminator = discriminatorOrCases;
  const cases = casesOrDefault as Record<string, R | ((val: T) => R)>;
  const discriminatorValue = String(value[discriminator]);
  const handlerOrValue = cases[discriminatorValue];

  if (handlerOrValue !== undefined) {
    return typeof handlerOrValue === "function"
      ? (handlerOrValue as (val: T) => R)(value)
      : handlerOrValue;
  }

  if (defaultHandler) {
    return defaultHandler(value);
  }

  throw new Error(
    `No matching case for ${String(discriminator)}: ${discriminatorValue}`,
  );
}

// Utility for exhaustive checking in traditional switch
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable case: ${value}`);
}
