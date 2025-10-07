/**
 * Core type utilities used by the Vex Lang.
 * 
 * This module provides a collection of TypeScript type definitions compatible 
 * with C++, along with a set of utility functions for type checking and related 
 * operations. It serves as the foundation for strong type interoperability within 
 * the Vex Lang ecosystem.
 * 
 * @module
 */

import {
    TypeMapper,
    createTypeMapper
} from "./TypeMapper.ts"
import {
    VexFunction,
    TYPE_METADATA,
    bool,
    char,
    double,
    float,
    getCppType,
    int,
    isFloatingType,
    isIntegerType,
    isNumericType,
    isPrimitiveType,
    isWithinBounds,
    long,
    short
} from "./Types.ts";

import type {TypeMetadata, VexType,} from "./Types.ts"

export type {
    VexType, TypeMetadata, 
};

export {
    int,
    bool,
    char,
    double,
    float,
    long,
    short,
    VexFunction,
    TYPE_METADATA,
    TypeMapper,
    getCppType,
    createTypeMapper,
    isFloatingType,
    isIntegerType,
    isNumericType,
    isPrimitiveType,
    isWithinBounds,
};