const test = require("ava").test;
const SecuritySyntaxErrors = require("../index");
const babel = require("babel-core");

// Transform a source using Babel with no options except this plugin, security-syntax-errors:
const transform = (source) => babel.transform(source, { plugins: [SecuritySyntaxErrors] });

test("shouldn't mangle source if it doesn't contain an API key", t =>
{
    const source = "var x = true;";
    const transformedSource = transform(source);
    t.is(transformedSource.code, source);
});

test("should throw an exception if source contains an API key", t =>
{
    const source = "var api_key = \"sk_live_FakeStripeAPIKey00000000\";";
    const error = t.throws(() =>
    {
        transform(source);
    }, SyntaxError);

    t.is(/Inline Stripe API Key was found/.test(error.message), true);
});
