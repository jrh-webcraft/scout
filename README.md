# @jrh/scout

Test the behavior of Node.js functions which reach beyond your application's boundaries.

## Installation

`npm install @jrh/scout`

## Functions

### `.ensureCount()`

#### Usage

`const { ensureCount } = require('@jrh/scout')`

#### Syntax

```
ensureCount(count, target, options)
```

#### Arguments

| Name | Type | Description |
| :-- | :-- | :-- |
| count | Number | The number of records to ensure in the result. |
| target | Function | The function to test. |
| options | Object | A configuration object *(details below)*. |

**Options**

| Attribute | Type | Description | Default |
| :-- | :-- | :-- | :-- |
| delay | Number | Milliseconds to wait between retries. | `1000` |
| retries | Number | Number of times to retry. | `10` |

### Exceptions

Throws a standard `Error` if:

- The function does not return the expected number of records within the allowed number of retries.
