# Secure Syntax

This is a [Babel](https://github.com/babel/babel) plugin for throwing a class of `SyntaxErrors` when API keys are detected in your source code. When you write API keys in-line, you become subject to [unnecessary risks](https://www.quora.com/My-AWS-account-was-hacked-and-I-have-a-50-000-bill-how-can-I-reduce-the-amount-I-need-to-pay) that occur from accidentally leaking your secrets to the world.

## Installation

Install using npm or Yarn by adding `babel-plugin-secure-syntax` as a dev dependency to your project:

Using npm:
```
npm install --save-dev babel-plugin-secure-syntax
```

Using Yarn:
```
yarn add --dev babel-plugin-secure-syntax
```

This will add `babel-plugin-secure-syntax` to your `package.json` for use in development, but won't classify this plugin as a dependency if someone were to `npm install` your package.

## Prerequisites

* `babel`: 6.x.x

## Usage

### `.babelrc`

The easiest way to use `babel-plugin-secure-syntax` is by adding it to your [`.babelrc` file](https://babeljs.io/docs/usage/babelrc/).

Find the `"plugins"` key in your `.babelrc` and add `"secure-syntax"` to the list of plugins:

```
{
  ...
  "plugins": "secure-syntax"
}
```

### Babel Transform

If you're running Babel transforms in your application code using `babel.transform()`, simply require the plugin and add it to the plugins array:

```
const SecureSyntax = require("babel-plugin-secure-syntax");
const transform = (source) => babel.transform(source, { plugins: [SecureSyntax] });
```

## Contributing

Helping others find in-line API keys in their source code is the point of this plugin, so please [open a PR](https://github.com/runkitdev/babel-plugin-secure-syntax/pulls) to add any missing API key regular expressions.

## Help

This package is maintained by the [RunKit team](https://runkit.com). Please feel free to file an [issue](https://github.com/runkitdev/babel-plugin-secure-syntax/issues) or reach out to us at support@runkit.com.
