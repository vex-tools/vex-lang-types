import ts from "typescript";

/**
 * Maps TypeScript types to C++ types
 */
export class TypeMapper {
    private checker: ts.TypeChecker;
    private program: ts.Program;

    constructor(sourceFile: ts.SourceFile) {
        // Create a program for type checking
        this.program = ts.createProgram([sourceFile.fileName], {
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.CommonJS
        });
        this.checker = this.program.getTypeChecker();
    }

    /**
     * Main mapping function: TypeScript type → C++ type
     */
    mapType(node: ts.Node): string {
        const type = this.checker.getTypeAtLocation(node);
        return this.typeToString(type);
    }

    /**
     * Get C++ type from variable declaration
     */
    getVariableType(declaration: ts.VariableDeclaration): string {
        // Check if has explicit type annotation
        if (declaration.type) {
            return this.mapTypeNode(declaration.type);
        }

        // Infer from initializer
        if (declaration.initializer) {
            return this.inferFromExpression(declaration.initializer);
        }

        return "auto";
    }

    /**
     * Map TypeScript type node to C++ type
     */
    private mapTypeNode(typeNode: ts.TypeNode): string {
        const typeText = typeNode.getText();
        
        // Direct type mappings
        const typeMap: Record<string, string> = {
            'int': 'int32_t',
            'short': 'int16_t',
            'long': 'int64_t',
            'float': 'float',
            'double': 'double',
            'bool': 'bool',
            'boolean': 'bool',
            'char': 'char',
            'string': 'std::string',
            'number': 'double',
            'void': 'void',
            'any': 'auto'
        };

        // Check for array types
        if (ts.isArrayTypeNode(typeNode)) {
            const elementType = this.mapTypeNode(typeNode.elementType);
            return `std::vector<${elementType}>`;
        }

        // Check for tuple types
        if (ts.isTupleTypeNode(typeNode)) {
            const elementTypes = typeNode.elements.map(el => this.mapTypeNode(el));
            return `std::tuple<${elementTypes.join(', ')}>`;
        }

        return typeMap[typeText] || 'auto';
    }

    /**
     * Infer C++ type from expression
     */
    private inferFromExpression(expr: ts.Expression): string {
        // String literal
        if (ts.isStringLiteral(expr)) {
            return 'std::string';
        }

        // Numeric literal
        if (ts.isNumericLiteral(expr)) {
            const value = parseFloat(expr.text);
            
            // Check if it's a float (has decimal point)
            if (expr.text.includes('.')) {
                return 'double';
            }
            
            // Check range for integer types
            if (Number.isInteger(value)) {
                if (value >= -32768 && value <= 32767) {
                    return 'int16_t'; // short
                }
                if (value >= -2147483648 && value <= 2147483647) {
                    return 'int32_t'; // int
                }
                return 'int64_t'; // long
            }
            
            return 'double';
        }

        // Boolean literal
        if (expr.kind === ts.SyntaxKind.TrueKeyword || 
            expr.kind === ts.SyntaxKind.FalseKeyword) {
            return 'bool';
        }

        // Array literal
        if (ts.isArrayLiteralExpression(expr)) {
            if (expr.elements.length > 0) {
                const elementType = this.inferFromExpression(expr.elements[0]);
                return `std::vector<${elementType}>`;
            }
            return 'std::vector<auto>';
        }

        // Call expression - check for type constructor functions
        if (ts.isCallExpression(expr)) {
            const funcName = expr.expression.getText();
            
            const typeConstructors: Record<string, string> = {
                'int': 'int32_t',
                'short': 'int16_t',
                'long': 'int64_t',
                'float': 'float',
                'double': 'double',
                'bool': 'bool',
                'char': 'char',
                'string': 'std::string'
            };

            if (typeConstructors[funcName]) {
                return typeConstructors[funcName];
            }
        }

        return 'auto';
    }

    /**
     * Convert ts.Type to C++ type string
     */
    private typeToString(type: ts.Type): string {
        // Check for primitive types
        if (type.flags & ts.TypeFlags.String) {
            return 'std::string';
        }
        if (type.flags & ts.TypeFlags.Number) {
            return 'double';
        }
        if (type.flags & ts.TypeFlags.Boolean) {
            return 'bool';
        }
        if (type.flags & ts.TypeFlags.Void) {
            return 'void';
        }

        // Get type as string and try to map
        const typeString = this.checker.typeToString(type);
        
        const typeMap: Record<string, string> = {
            'int': 'int32_t',
            'short': 'int16_t',
            'long': 'int64_t',
            'float': 'float',
            'double': 'double',
            'bool': 'bool',
            'char': 'char'
        };

        return typeMap[typeString] || 'auto';
    }

    /**
     * Get function return type
     */
    getFunctionReturnType(func: ts.FunctionDeclaration): string {
        if (func.type) {
            return this.mapTypeNode(func.type);
        }
        return 'auto';
    }

    /**
     * Get function parameter type
     */
    getParameterType(param: ts.ParameterDeclaration): string {
        if (param.type) {
            return this.mapTypeNode(param.type);
        }
        return 'auto';
    }
}

/**
 * Helper function to create TypeMapper from source code
 */
export function createTypeMapper(sourceCode: string): TypeMapper {
    const sourceFile = ts.createSourceFile(
        "temp.ts",
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );
    return new TypeMapper(sourceFile);
}