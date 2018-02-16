const test = require("ava").test;
const SecuritySyntaxErrors = require("../index");
const SecuritySyntaxError = require("../security-syntax-error");
const AggregateError = require("../aggregate-error");
const babel = require("babel-core");
const R = require("ramda");

// Transform a source using Babel with no options except this plugin, security-syntax-errors:
const transform = (source) => babel.transform(source, { plugins: [SecuritySyntaxErrors] });

// Invalid API keys that resemble valid ones (since that would defeat the purpose of this package)
const SAMPLE_KEYS = {
    stripe: "sk_live_FakeStripeAPIKey00000000",
};

const SAMPLE_SECURITY_SYNTAX_ERROR_VALUES = new function ()
{
    this.message = "Simulated SecuritySyntaxError";
    this.type = "Fake";
    this.fileName = "index.js";
    this.location = { start: { column: 0, lineNumber: 0 }, end: { column: 1, lineNumber: 0 } };
    this.sample = new SecuritySyntaxError(this.message, this.type, this.fileName, this.location);
}();

const SAMPLE_SECURITY_SYNTAX_ERROR = SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.sample;

test("SecuritySyntaxError constructor should create a instance of a SecuritySyntaxError", t =>
{
    const error = new SecuritySyntaxError(
        SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.message,
        SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.type,
        SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.fileName,
        SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.location
    );

    t.is(error.message, SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.message);
    t.is(error.type, SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.type);
    t.is(error.fileName, SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.fileName);
    t.deepEqual(error.start, SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.location.start);
    t.deepEqual(error.end, SAMPLE_SECURITY_SYNTAX_ERROR_VALUES.location.end);
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
    }, AggregateError);

    t.is(R.any(error => error instanceof SecuritySyntaxError, error.children), true);
});
