import { describe, it, expect } from 'vitest';
import { switchCase, assertUnreachable } from '../src/switchCase';

describe('switchCase utility', () => {
    // 1. Literal type matching (string/number/symbol)
    describe('literal type matching', () => {
        it('should match string literals and return values', () => {
            const result = switchCase('apple'  as string, {
                'apple': 'This is an apple',
                'orange': 'This is an orange',
                'banana': 'This is a banana'
            });

            expect(result).toBe('This is an apple');
        });

        it('should match number literals and return values', () => {
            const result = switchCase(2 as number, {
                1: 'One',
                2: 'Two',
                3: 'Three'
            });

            expect(result).toBe('Two');
        });

        it('should handle functions as handlers for literals', () => {
            const result = switchCase('apple' as string, {
                'apple': () => 'Apple handler called',
                'orange': () => 'Orange handler called',
                'banana': () => 'Banana handler called'
            });

            expect(result).toBe('Apple handler called');
        });

        it('should use default handler when no literal matches', () => {
            const result = switchCase('pear' as string, {
                'apple': 'This is an apple',
                'orange': 'This is an orange'
            }, (val) => `Default: ${val}`);

            expect(result).toBe('Default: pear');
        });

        it('should throw error when no literal matches and no default is provided', () => {
            expect(() => {
                switchCase('pear'  as string, {
                    'apple': 'This is an apple',
                    'orange': 'This is an orange'
                });
            }).toThrow(/No matching case for value/);
        });

    });

    // 2. Discriminated union handling
    describe('discriminated union handling', () => {
        type Circle = { kind: 'circle'; radius: number };
        type Square = { kind: 'square'; size: number };
        type Rectangle = { kind: 'rectangle'; width: number; height: number };
        type Shape = Circle | Square | Rectangle;

        it('should handle discriminated unions with the correct narrowing', () => {
            const circle = { kind: 'circle', radius: 5 } as Shape;

            const area = switchCase(circle, 'kind', {
                circle: (shape) => Math.PI * shape.radius ** 2,
                square: (shape) => shape.size ** 2,
                rectangle: (shape) => shape.width * shape.height
            });

            expect(area).toBeCloseTo(Math.PI * 25);
        });

        it('should handle discriminated unions with direct values', () => {
            const rectangle = { kind: 'rectangle', width: 10, height: 5 } as Shape;
            const shapeName = switchCase(rectangle, 'kind', {
                circle: 'Circle',
                square: 'Square',
                rectangle: 'Rectangle'
            });

            expect(shapeName).toBe('Rectangle');
        });

        it('should use default handler when no discriminator matches', () => {
            // @ts-expect-error - Intentionally using a non-existent kind for testing
            const shape: Shape = { kind: 'triangle', base: 10, height: 5 };

            const result = switchCase(shape, 'kind', {
                circle: 'Circle',
                square: 'Square',
                rectangle: 'Rectangle'
            }, (val) => `Unknown shape: ${val.kind}`);

            expect(result).toBe('Unknown shape: triangle');
        });

        it('should throw error when no discriminator matches and no default is provided', () => {
            // @ts-expect-error - Intentionally using a non-existent kind for testing
            const shape: Shape = { kind: 'triangle', base: 10, height: 5 };

            expect(() => {
                switchCase(shape, 'kind', {
                    circle: 'Circle',
                    square: 'Square',
                    rectangle: 'Rectangle'
                });
            }).toThrow(/No matching case for kind: triangle/);
        });
    });

    // 3. Predicate-based matching for complex conditions
    describe('predicate-based matching with object cases', () => {
        type User = {
            name: string;
            role: string;
            age: number;
            subscription?: string;
        };

        const user: User = {
            name: 'Alice',
            role: 'admin',
            age: 30,
            subscription: 'premium'
        };

        it('should match based on predicates', () => {
            const result = switchCase(user, {
                isAdmin: {
                    match: (u) => u.role === 'admin',
                    handler: (u) => `Admin: ${u.name}`
                },
                isPremium: {
                    match: (u) => u.subscription === 'premium',
                    handler: (u) => `Premium user: ${u.name}`
                },
                isAdult: {
                    match: (u) => u.age >= 18,
                    handler: (u) => `Adult: ${u.name}`
                }
            });

            // First matching predicate should win (isAdmin in this case)
            expect(result).toBe('Admin: Alice');
        });

        it('should match literal values in complex predicate case', () => {
            const value : string = 'test';
            const result = switchCase(value , {
                isTest: {
                    match: 'test', // Literal match
                    handler: 'It is test'
                },
                isDev: {
                    match: 'dev',
                    handler: 'It is dev'
                }
            });

            expect(result).toBe('It is test');
        });

        it('should use default handler when no predicate matches', () => {
            const regularUser: User = {
                name: 'Bob',
                role: 'user',
                age: 17
            };

            const result = switchCase(regularUser, {
                isAdmin: {
                    match: (u) => u.role === 'admin',
                    handler: (u) => `Admin: ${u.name}`
                },
                isPremium: {
                    match: (u) => u.subscription === 'premium',
                    handler: (u) => `Premium user: ${u.name}`
                }
            }, (u) => `Regular user: ${u.name}`);

            expect(result).toBe('Regular user: Bob');
        });

        it('should handle direct values as handlers in predicate cases', () => {
            const result = switchCase(42,
                [{
                    match: (num: number) => num === 42,
                    handler: 'Answer to the Ultimate Question'
                }
                ]
            );

            expect(result).toBe('Answer to the Ultimate Question');
        });

        it('should throw error when no predicate matches and no default is provided', () => {
            const regularUser: User = {
                name: 'Bob',
                role: 'user',
                age: 17
            };

            expect(() => {
                switchCase(regularUser, {
                    isAdmin: {
                        match: (u) => u.role === 'admin',
                        handler: (u) => `Admin: ${u.name}`
                    },
                    isPremium: {
                        match: (u) => u.subscription === 'premium',
                        handler: (u) => `Premium user: ${u.name}`
                    }
                });
            }).toThrow(/No matching case for value/);
        });
    });

    // 4. Boolean condition matching (array-based)
    describe('boolean condition matching (array-based)', () => {
        it('should match based on array of conditions/handlers', () => {
            const age = 25;

            const result = switchCase(age, [
                {
                    match: (a) => a < 13,
                    handler: 'Child'
                },
                {
                    match: (a) => a >= 13 && a < 18,
                    handler: 'Teenager'
                },
                {
                    match: (a) => a >= 18 && a < 65,
                    handler: 'Adult'
                },
                {
                    match: (a) => a >= 65,
                    handler: 'Senior'
                }
            ]);

            expect(result).toBe('Adult');
        });

        it('should handle function handlers with array cases', () => {
            const age = 15;

            const result = switchCase(age, [
                {
                    match: (a) => a < 13,
                    handler: (a) => `Child (${a} years old)`
                },
                {
                    match: (a) => a >= 13 && a < 18,
                    handler: (a) => `Teenager (${a} years old)`
                },
                {
                    match: (a) => a >= 18,
                    handler: (a) => `Adult (${a} years old)`
                }
            ]);

            expect(result).toBe('Teenager (15 years old)');
        });

        it('should use default handler when no condition matches in array cases', () => {
            const age = -5; // Invalid age

            const result = switchCase(age, [
                {
                    match: (a) => a >= 0 && a < 13,
                    handler: 'Child'
                },
                {
                    match: (a) => a >= 13 && a < 18,
                    handler: 'Teenager'
                },
                {
                    match: (a) => a >= 18,
                    handler: 'Adult'
                }
            ], () => 'Invalid age');

            expect(result).toBe('Invalid age');
        });

        it('should throw error when no condition matches and no default is provided', () => {
            const age = -5; // Invalid age

            expect(() => {
                switchCase(age, [
                    {
                        match: (a) => a >= 0 && a < 13,
                        handler: 'Child'
                    },
                    {
                        match: (a) => a >= 13 && a < 18,
                        handler: 'Teenager'
                    },
                    {
                        match: (a) => a >= 18,
                        handler: 'Adult'
                    }
                ]);
            }).toThrow(/No matching case for value/);
        });
    });

    // 5. Chainable builder pattern
    describe('chainable builder pattern', () => {
        it('should handle literal matching with chainable API', () => {
            const fruit : string= 'apple';

            const result = switchCase(fruit)
                .case('apple', 'This is an apple')
                .case('orange', 'This is an orange')
                .case('banana', 'This is a banana')
                .run();

            expect(result).toBe('This is an apple');
        });

        it('should handle predicate matching with chainable API', () => {
            const num: number = 42;

            const result = switchCase(num)
                .case((n) => n < 0, 'Negative')
                .case((n) => n === 0, 'Zero')
                .case((n) => n > 0 && n < 10, 'Small positive')
                .case((n) => n >= 10 && n < 100, 'Medium positive')
                .case((n) => n >= 100, 'Large positive')
                .run();

            expect(result).toBe('Medium positive');
        });

        it('should handle function handlers with chainable API', () => {
            const num: number = 42;

            const result = switchCase(num)
                .case((n) => n < 0, (n: number) => `Negative (${n})`)
                .case((n) => n === 0, (n: number) => `Zero (${n})`)
                .case((n) => n > 0, (n: number) => `Positive (${n})`)
                .run();

            expect(result).toBe('Positive (42)');
        });

        it('should use default handler with chainable API', () => {
            const color: string = 'purple';

            const result = switchCase(color)
                .case('red', 'RGB: 255,0,0')
                .case('green', 'RGB: 0,255,0')
                .case('blue', 'RGB: 0,0,255')
                .default((c) => `Unknown color: ${c}`)
                .run();

            expect(result).toBe('Unknown color: purple');
        });

        it('should handle exhaustive checking with chainable API', () => {
            type Status = 'pending' | 'fulfilled' | 'rejected';
            const status = 'fulfilled' as Status;

            const result = switchCase(status)
                .case('pending', 'Loading...')
                .case('fulfilled', 'Success!')
                .case('rejected', 'Error!')
                .exhaustive();

            expect(result).toBe('Success!');
        });

        it('should throw error when no case matches and using exhaustive without default', () => {
            expect(() => {
                // We don't handle all cases here (missing 'rejected')
                switchCase('rejected' as 'pending' | 'fulfilled' | 'rejected')
                    .case('pending', 'Loading...')
                    .case('fulfilled', 'Success!')
                    .exhaustive();
            }).toThrow(/No matching case for value/);
        });

        it('should not throw when exhaustive has a default handler', () => {
            const result = switchCase('rejected' as 'pending' | 'fulfilled' | 'rejected')
                .case('pending', 'Loading...')
                .case('fulfilled', 'Success!')
                .default(() => 'Default handler')
                .exhaustive();

            expect(result).toBe('Default handler');
        });
    });

    // 6. assertUnreachable utility
    describe('assertUnreachable utility', () => {
        it('should throw an error with the provided value', () => {
            expect(() => assertUnreachable('something' as never)).toThrow(/Unreachable case: something/);
        });
    });

    // 7. Edge cases and additional coverage
    describe('edge cases and additional coverage', () => {

        it('should handle null values correctly', () => {
            const result = switchCase(null, [
                { match: (v) => v === null, handler: 'Null value' },
                { match: (v) => v === undefined, handler: 'Undefined value' }
            ]);

            expect(result).toBe('Null value');
        });

        it('should handle undefined values correctly', () => {
            const result = switchCase(undefined, [
                { match: (v) => v === null, handler: 'Null value' },
                { match: (v) => v === undefined, handler: 'Undefined value' }
            ]);

            expect(result).toBe('Undefined value');
        });


    });
});