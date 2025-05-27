# ts-switch-case

A TypeScript-first control flow utility for modern JavaScript applications, offering a powerful, type-safe alternative to native `switch` statements. With **dual syntax** (object-based and chainable), `ts-switch-case` supports plain values (strings, numbers, symbols), pattern matching, boolean conditions (like `switch (true)`), and discriminated unions, making it ideal for web, serverless, and API-driven projects.

Inspired by Kotlin's `when` and Rust's `match`, `ts-switch-case` combines conciseness, type safety, and flexibility, outperforming npm alternatives like `ts-pattern` and `switch` with its intuitive API and lightweight footprint.

## Features
- **Dual Syntax**: Choose between object-based (`{ 200: 'OK' }`) for static mappings or chainable (`.case(200, 'OK')`) for fluent dynamic logic.
- **Plain Values**: Use simple values (e.g., `'OK'`) or functions for handlers, supporting strings, numbers, and symbols.
- **Pattern Matching**: Support predicates (e.g., `p => p > 10`) and boolean conditions (`switch (true)`-style).
- **Discriminated Unions**: Type-safe handling of tagged unions (e.g., API responses).
- **Type Safety**: Enforces exhaustiveness and narrows types in handlers.
- **Lightweight**: No dependencies, optimized for Next.js Edge Runtime, Deno, and AWS Lambda.
- **TypeScript-First**: Built with advanced TypeScript for compile-time guarantees.

## Installation

### npm
```bash
npm install ts-switch-case
```

### Deno
```typescript
import { switchCase } from 'https://deno.land/x/ts_switch_case@v1.0.0/mod.ts';
```

## Usage

### Literal Types (Object-based)
Map HTTP status codes to messages with concise syntax:
```typescript
import { switchCase } from 'ts-switch-case';
type HttpStatus = 200 | 404 | 500;
const code = 404 as HttpStatus;
const message = switchCase(code, {
  200: 'OK',
  404: 'Not Found',
  500: 'Server Error',
}); // message = 'Not Found'
```

### Literal Types (Chainable)
Use fluent syntax for the same mapping:
```typescript
const message = switchCase(code)
  .case(200, 'OK')
  .case(404, 'Not Found')
  .case(500, 'Server Error')
  .exhaustive(); // message = 'Not Found'
```

### Discriminated Unions
Handle API response types with type-safe narrowing:
```typescript
type ApiResponse =
  | { type: 'success'; data: string }
  | { type: 'error'; message: string }
  | { type: 'loading' };

const response = { type: 'success', data: 'User created' } as ApiResponse;
const result = switchCase(response, 'type', {
  success: ({ data }) => `Success: ${data}`,
  error: ({ message }) => `Error: ${message}`,
  loading: () => 'Loading...',
}); // result = 'Success: User created'
```

### Predicates
Match scores with custom conditions:
```typescript
const score: number = 85;
const grade = switchCase(
  score,
  {
    excellent: { match: (s) => s >= 90, handler: 'A' },
    good: { match: (s) => s >= 80, handler: 'B' },
    average: { match: (s) => s >= 70, handler: 'C' },
  },
  'F'
); // grade = 'B'
```

### Boolean Conditions (Chainable, `switch (true)`)
Mimic `switch (true)` with sequential predicates:
```typescript
const age: number = 25;
const category = switchCase(age)
  .case(a => a < 13, 'Child')
  .case(a => a < 20, 'Teen')
  .case(a => a >= 20, 'Adult')
  .default(() => 'Unknown')
  .run(); // category = 'Adult'
```

### User Roles
Map user roles to permissions:
```typescript
type Role = 'admin' | 'editor' | 'viewer';
const role = 'editor' as Role;
const permissions = switchCase(role, {
  admin: ['read', 'write', 'delete'],
  editor: ['read', 'write'],
  viewer: ['read'],
}); // permissions = ['read', 'write']
```

## Why ts-switch-case?
Compared to alternatives:
- **vs. `ts-pattern`**: More concise object-based syntax for literals and discriminated unions; dual syntax offers flexibility.
- **vs. `switch`**: Adds boolean conditions, discriminated unions, symbols, and modern TypeScript.
- **vs. `switch-case`**: Supports plain values, type safety, and chainable API.
- **vs. Native `switch`**: Returns values, enforces exhaustiveness, and supports advanced matching.

## Handling Cyclic References

`ts-switch-case` includes cycle detection via `isCyclic` and `logCyclicError`. If a cyclic reference is detected (e.g., in cases or results), an error is thrown with a message pointing to this section.

For React applications, cyclic references often occur in `React.ReactNode` (e.g., JSX elements with internal fiber properties). To handle this, you can implement a `sanitizeNode` function to safely process nodes. Example:

```typescript
import { isValidElement } from 'react';
import { isCyclic } from 'ts-switch-case';

function sanitizeNode(node: React.ReactNode): React.ReactNode {
  if (isValidElement(node)) {
    const { children, ...safeProps } = node.props;
    return { ...node, props: { ...safeProps, children: sanitizeNode(children) } };
  }
  if (isCyclic(node)) return '[Cyclic Node]';
  return node;
}
```

Use `sanitizeNode` in your `switchCase` handlers to avoid cyclic errors:

```typescript
import { switchCase } from 'ts-switch-case';

const node = <div>Cyclic</div>;
const result = switchCase(node)
  .case(v => typeof v === 'string', v => v)
  .default(v => sanitizeNode(v))
  .run();
```

For non-React contexts, use `isCyclic` to check inputs and handle cycles appropriately.


## Setup for Development
```bash
git clone https://github.com/astralstriker/ts-switch-case.git
cd ts-switch-case
npm install
npm run build
npm test
```

## Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/xyz`).
3. Commit changes (`git commit -m 'Add feature xyz'`).
4. Push to the branch (`git push origin feature/xyz`).
5. Open a pull request.

## License
MIT License. See [LICENSE](LICENSE) for details.

## Support
File issues at [GitHub Issues](https://github.com/yourname/ts-switch-case/issues) or contact [your.email@example.com](mailto:your.email@example.com).
