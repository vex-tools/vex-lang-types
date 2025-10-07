/**
 * Liquid Script Type System
 * Maps TypeScript types to C++ compatible types with runtime validation
 */

// Brand types for type safety at compile time
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

// Union of all liquid types
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
 * Type constructors with runtime validation
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

export function short(value: number): short {
    if (!Number.isInteger(value)) {
        throw new TypeError(`short requires an integer value, got ${value}`);
    }
    if (value < -32768 || value > 32767) {
        throw new RangeError(`short overflow: ${value} is out of range [-32768, 32767]`);
    }
    return value as short;
}

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

export function double(value: number): double {
    return value as double;
}

export function bool(value: boolean): bool {
    return value as bool;
}

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
    name: string;
    cppType: string;
    size: number; // in bytes
    min?: number;
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
 * Get C++ type string from TypeScript type name
 */
export function getCppType(typeName: string): string {
    return TYPE_METADATA[typeName]?.cppType || 'auto';
}

/**
 * Check if a value is within type bounds
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
export function isIntegerType(typeName: string): boolean {
    return ['int', 'short', 'long'].includes(typeName);
}

export function isFloatingType(typeName: string): boolean {
    return ['float', 'double'].includes(typeName);
}

export function isNumericType(typeName: string): boolean {
    return isIntegerType(typeName) || isFloatingType(typeName);
}

export function isPrimitiveType(typeName: string): boolean {
    return typeName in TYPE_METADATA;
}