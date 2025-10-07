/**
 * Vex Lang Type System
 * Maps TypeScript types to C++ compatible types with runtime validation.
 * 
 * The linter will not always complain about types like 
 * integers and numbers, be aware of this, if it does 
 * not complain it may not work as expected and I hope to fix it soon.
 */

/**
 * Brand types for type safety at compile time.
 * 
 * This works, don't ask me how.
 */

declare const __brand: unique symbol;
type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

// Primitive type aliases with branding

export type int = Brand<number, 'int'>;
export type short = Brand<number, 'short'>;
export type long = Brand<number, 'long'>;
export type float = Brand<number, 'float'>;
export type double = Brand<number, 'double'>;
export type bool = Brand<boolean, 'bool'>;
export type char = Brand<string, 'char'>;


/**
 * Union of all Vex types.
 * 
 * Store the primitive types compatible with C++.
 * 
 * Don't tell me it needs improvement, make a pull request :)
 */
export type VexType = 
    | int 
    | short 
    | long 
    | float 
    | double 
    | bool 
    | char 
    | string 
    | void;


/**
 * Integer type constructor with runtime validation.
 * @param value The number value to make and validate integer.
 * @returns The value as int.
 */
export function int(value: number): int {
    if (!Number.isInteger(value)) {
        throw new TypeError(`int requires an integer value, got ${value}`);
    }
    if (value < -2147483648 || value > 2147483647) {
        throw new RangeError(`int overflow: ${value} is out of range [-2147483648, 2147483647]`);
    }
    return value as int;
}

/**
 * Short type constructor with runtime validation.
 * @param value The number value to make and validate short.
 * @returns The value as short.
 */
export function short(value: number): short {
    if (!Number.isInteger(value)) {
        throw new TypeError(`short requires an integer value, got ${value}`);
    }
    if (value < -32768 || value > 32767) {
        throw new RangeError(`short overflow: ${value} is out of range [-32768, 32767]`);
    }
    return value as short;
}

/**
 * Long type constructor with runtime validation.
 * @param value The number value to make and validate long.
 * @returns The value as long.
 */
export function long(value: number): long {
    if (!Number.isInteger(value)) {
        throw new TypeError(`long requires an integer value, got ${value}`);
    }
    // JavaScript number limit check
    if (value < Number.MIN_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
        throw new RangeError(`long overflow: ${value} is out of safe integer range`);
    }
    return value as long;
}

/**
 * Float type constructor with runtime validation.
 * @param value The number value to make and validate float.
 * @returns The value as float.
 */
export function float(value: number): float {
    // Float range check (IEEE 754 single precision)
    const absValue = Math.abs(value);
    if (absValue > 3.4028235e38) {
        throw new RangeError(`float overflow: ${value} exceeds maximum float value`);
    }
    if (absValue > 0 && absValue < 1.175494e-38) {
        throw new RangeError(`float underflow: ${value} is below minimum float value`);
    }
    return value as float;
}

/**
 * Double type constructor with runtime validation.
 * 
 * **Abstraction**: the TypeScript/JavaScript numbers are double.
 * @param value The number value to make and validate double.
 * @returns The value as double.
 */
export function double(value: number): double {
    return value as double;
}

/**
 * Bool type constructor with runtime validation.
 * **Abstraction**: the TypeScript/JavaScript boolean are bool.
 * @param value The boolean value to make and validate bool.
 * @returns The value as bool.
 */
export function bool(value: boolean): bool {
    return value as bool;
}

/**
 * Char type constructor with runtime validation.
 * @param value The string value to make and validate char.
 * @returns The value as char.
 */
export function char(value: string): char {
    if (value.length !== 1) {
        throw new TypeError(`char requires exactly one character, got "${value}" (length: ${value.length})`);
    }
    return value as char;
}

/**
 * Type metadata for reflection and transpilation
 */
export interface TypeMetadata {
    /**The name of type */
    name: string;
    /**The C++ corresponding type */
    cppType: string;
    /**The type size in bytes */
    size: number;
    /**The minimum type size
     * 
     * `Not required`
     */
    min?: number;
    /**The maximum type size 
     * 
    * `Not required`
    */
    max?: number;
}

export const TYPE_METADATA: Record<string, TypeMetadata> = {
    int: { name: 'int', cppType: 'int32_t', size: 4, min: -2147483648, max: 2147483647 },
    short: { name: 'short', cppType: 'int16_t', size: 2, min: -32768, max: 32767 },
    long: { name: 'long', cppType: 'int64_t', size: 8, min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
    float: { name: 'float', cppType: 'float', size: 4 },
    double: { name: 'double', cppType: 'double', size: 8 },
    bool: { name: 'bool', cppType: 'bool', size: 1 },
    char: { name: 'char', cppType: 'char', size: 1 },
    string: { name: 'string', cppType: 'std::string', size: -1 }, // variable size
    void: { name: 'void', cppType: 'void', size: 0 }
};


/**
 * Get C++ type string from TypeScript type name.
 * @param typeName The typescript typename as string.
 * @returns The C++ type as TypeScript string.
 */
export function getCppType(typeName: string): string {
    return TYPE_METADATA[typeName]?.cppType || 'auto';
}


/**
 * Check if a value is within type bounds.
 * @param value The value to check.
 * @param typeName The type name as string.
 * @returns boolean
 */
export function isWithinBounds(value: number, typeName: string): boolean {
    const metadata = TYPE_METADATA[typeName];
    if (!metadata || metadata.min === undefined || metadata.max === undefined) {
        return true;
    }
    return value >= metadata.min && value <= metadata.max;
}

/**
 * Vex Function wrapper for function types
 */
export class VexFunction<TReturn extends VexType = VexType> {
    constructor(
        public readonly name: string,
        public readonly returnType: string,
        public readonly parameters: Array<{ name: string; type: string }>,
        // deno-lint-ignore no-explicit-any
        public readonly func: (...args: any[]) => TReturn
    ) {}

    /**
     * Get C++ function signature
     * @returns The signature as string.
     */
    getCppSignature(): string {
        const params = this.parameters
            .map(p => `${getCppType(p.type)} ${p.name}`)
            .join(', ');
        return `${getCppType(this.returnType)} ${this.name}(${params})`;
    }
}

/**
 * Type utilities for compile-time checks
 */

/**
 * Compile time check if a type is integer.
 * @param typeName The type as string to check.
 * @returns boolean
 */
export function isIntegerType(typeName: string): boolean {
    return ['int', 'short', 'long'].includes(typeName);
}

/**
 * Compile time check if a type is floating.
 * @param typeName The type as string to check.
 * @returns boolean
 */
export function isFloatingType(typeName: string): boolean {
    return ['float', 'double'].includes(typeName);
}

/**
 * Compile time check if a type is numeric.
 * @param typeName The type as string to check.
 * @returns boolean
 */
export function isNumericType(typeName: string): boolean {
    return isIntegerType(typeName) || isFloatingType(typeName);
}

/**
 * Compile time check if a type is primitive.
 * @param typeName The type as string to check.
 * @returns boolean
 */
export function isPrimitiveType(typeName: string): boolean {
    return typeName in TYPE_METADATA;
}