
# Vex Lang Types

> Core type utilities used by the **Vex Lang** project.
> Currently in **beta** — APIs, naming conventions, and usage patterns are subject to change.
> For the latest information, please refer to the official documentation.

---

## Overview

**`@vex-lang/types`** provides a collection of **TypeScript type definitions** compatible with `C++`, along with a set of **utility functions** for type checking and related operations.
It serves as the foundation for strong type interoperability within the Vex Lang ecosystem.

---

## Installation

Add the package to your project using:

```bash
deno add @vex-lang/types
```

---

## Usage

You can import all utilities or just the ones you need:

```typescript
// Import the entire module
import * as vexTypes from "@vex-lang/types";

// Or import specific types and functions
import { int, isIntegerType } from "@vex-lang/types";

// Using full import
const intNumber: vexTypes.int = 30;

// Using partial import
const intNumber: int = 30;

if (!isIntegerType(intNumber)) {
  console.log("The number is not an integer.");
}
```

---

## Notes

* The library is still in active development and may introduce **breaking changes** between versions.
* Contributions and feedback are welcome as part of the Vex Lang ecosystem.
