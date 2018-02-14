const test = require("ava").test;
const SecuritySyntaxErrors = require("../index");
const SecuritySyntaxError = require("../security-syntax-error");
const babel = require("babel-core");

// Transform a source using Babel with no options except this plugin, security-syntax-errors:
const transform = (source) => babel.transform(source, { plugins: [SecuritySyntaxErrors] });

test("SecuritySyntaxError constructor should create a instance of a SecuritySyntaxError", t =>
{
    const message = "Simulated SecuritySyntaxError";
    const type = "fake";
    const fileName = "index.js";
    const location = { start: { column: 0, lineNumber: 0 }, end: { column: 1, lineNumber: 0 } };

    const error = new SecuritySyntaxError(message, type, fileName, location);
    t.is(error.message, message);
    t.is(error.type, type);
    t.is(error.fileName, fileName);
    t.deepEqual(error.start, location.start);
    t.deepEqual(error.end, location.end);
    t.is(`${error}`, "SecuritySyntaxError: Simulated SecuritySyntaxError");
    t.is(error instanceof SecuritySyntaxError, true);
    t.is(error instanceof SyntaxError, true);
});

test("shouldn't mangle source if it doesn't contain an API key", t =>
{
    const source = "var x = true;";
    const transformedSource = transform(source);
    t.is(transformedSource.code, source);
});

test("should throw an exception if source contains an API key in a string", t =>
{
    const source = "var api_key = \"sk_live_FakeStripeAPIKey00000000\";";
    const error = t.throws(() =>
    {
        transform(source);
    }, SecuritySyntaxError);

    t.is(/Inline Stripe API Key was found/.test(error.message), true);
});

test("should identify API keys even if parse fails", t =>
{
    const source = `This file doesn't contain valid JavaScript, but it includes an API key:
        sk_live_FakeStripeAPIKey00000000.`;

    const error = t.throws(() =>
    {
        transform(source);
    }, SecuritySyntaxError);
});
