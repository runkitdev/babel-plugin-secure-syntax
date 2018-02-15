const test = require("ava").test;
const SecuritySyntaxErrors = require("../index");
const SecuritySyntaxError = require("../security-syntax-error");
const babel = require("babel-core");
const R = require("ramda");

// Transform a source using Babel with no options except this plugin, security-syntax-errors:
const transform = (source) => babel.transform(source, { plugins: [SecuritySyntaxErrors] });

// Invalid API keys that resemble valid ones (since that would defeat the purpose of this package)
const SAMPLE_KEYS = {
    stripe: "sk_live_FakeStripeAPIKey00000000",
};

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

const benignSamples = {
    "source with safe types": "var b = true;",
    "source with string": "var str = \"not an API key\";",
    "source with template": "var t = `also not an API key`;",
    "source with regular expression (literal)": "var reA = /ab+c/;",
    "source with regular expression": "var reB = new RegExp(\"ab+c\");",
    "source with line comment": "var i = 1; // not API keys here",
    "source with comment block": "var n = null; /* not API keys here */",
};

R.mapObjIndexed((source, sampleName) =>
{
    test(`shouldn't mangle ${sampleName} if it doesn't contain an API key`, t =>
    {
        const transformedSource = transform(source);
        t.is(transformedSource.code, source);
    });
}, benignSamples);

const insecureSamples = {
    "source with string": `var str = "${SAMPLE_KEYS.stripe}";`,
    "source with template": `var t = \`${SAMPLE_KEYS.stripe}\`;`,
    "source with regular expression (literal)": `var reA = /${SAMPLE_KEYS.stripe}/;`,
    "source with regular expression": `var reB = new RegExp("${SAMPLE_KEYS.stripe}}");`,
    "source with line comment": `var i = 1; // ${SAMPLE_KEYS.stripe}`,
    "source with comment block": `var n = null; /* ${SAMPLE_KEYS.stripe} */`,
};

R.mapObjIndexed((source, sampleName) =>
{
    test(`should throw an exception if ${sampleName} contains an API key in a string`, t =>
    {
        const error = t.throws(() =>
        {
            transform(source);
        }, SecuritySyntaxError);

        t.is(/Inline Stripe API Key was found/.test(error.message), true);
    });
}, insecureSamples);

test("should identify API keys even if parse fails", t =>
{
    const source = "This file doesn't contain valid JavaScript, but it includes an API key:" + SAMPLE_KEYS.stripe;

    const error = t.throws(() =>
    {
        transform(source);
    }, SecuritySyntaxError);
});
