# Security Syntax Errors

This is a [`babel`](https://github.com/babel/babel) plugin for throwing a class of `SyntaxErrors` when API keys are detected in your source code. When you write API keys inline, you become subject to [unnecessary risks](https://www.quora.com/My-AWS-account-was-hacked-and-I-have-a-50-000-bill-how-can-I-reduce-the-amount-I-need-to-pay) that occur from accidentally leaking your secrets to the world.

## Why `AggregateError`?

If `babel` encounters a syntax error, it will throw the error and halt parsing. Of course, if it were possible, you would like to know about all the errors contained in a file. In the case of SecuritySyntaxErrors, however, we can keep parsing after we encounter these "syntax errors", so we introduce a new error class to collect multiple errors, `AggregateError`, which can contain errors of different types.
