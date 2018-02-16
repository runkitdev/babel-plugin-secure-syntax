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

const SAMPLE_SYNTAX_ERROR = new SyntaxError("Simulated SyntaxError");

const SAMPLE_AGGREGATE_ERROR = new AggregateError("Simulated AggregateError", [
    SAMPLE_SYNTAX_ERROR,
    SAMPLE_SECURITY_SYNTAX_ERROR
]);

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

test("AggregateError constructor should create a instance of an AggregateError", t =>
{
    const message = "Simulated AggregateError";
    const children = [
        SAMPLE_SYNTAX_ERROR,
        SAMPLE_SECURITY_SYNTAX_ERROR
    ];

    const error = new AggregateError(message, children);
    t.is(error.toString(), "AggregateError: Simulated AggregateError\n* SyntaxError: Simulated SyntaxError\n* SecuritySyntaxError: Simulated SecuritySyntaxError");
    t.is(error.message, message);
    t.deepEqual(error.children, children);
    t.is(error instanceof Error, true);
    t.is(error instanceof AggregateError, true);
});

test("AggregateError constructor should return Error if it has only one child", t =>
{
    const message = "Simulated AggregateError";
    const children = [
        SAMPLE_SECURITY_SYNTAX_ERROR
    ];

    const error = new AggregateError(message, children);
    t.is(error instanceof SecuritySyntaxError, true);
    t.is(error instanceof AggregateError, false);
});

const aggregateErrorSamples = {
    "error with mixed errors": [SAMPLE_AGGREGATE_ERROR, true],
    "error with only SyntaxErrors": [
        new AggregateError("Sample AggregateError", [SAMPLE_SYNTAX_ERROR, SAMPLE_SYNTAX_ERROR]),
        false
    ],
    "error with only SecuritySyntaxErrors": [
        new AggregateError("Sample AggregateError", [
            SAMPLE_SECURITY_SYNTAX_ERROR,
            SAMPLE_SECURITY_SYNTAX_ERROR
        ]),
        true
    ],
};

R.mapObjIndexed(([error, expectedValue], sampleName) =>
{
    test(`AggregateError.containsSecuritySyntaxError() on ${sampleName} should return ${expectedValue}`, t =>
    {
        t.is(error.containsSecuritySyntaxError(), expectedValue);
    });
}, aggregateErrorSamples);

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

test("should throw AggregateError with SyntaxError and SecuritySyntaxError as children when parse fails", t =>
{
    const source = "This file doesn't contain valid JavaScript, but it includes an API key:" + SAMPLE_KEYS.stripe;

    const error = t.throws(() =>
    {
        transform(source);
    }, AggregateError);

    t.is(error.children.length, 2);
    t.is(R.any(error => error instanceof SyntaxError && !(error instanceof SecuritySyntaxError), error.children), true);
    t.is(R.any(error => error instanceof SecuritySyntaxError, error.children), true);
});

test("should throw AggregateError with multiple SyntaxErrors when containing multiple API keys", t =>
{
    const source = `var x = "${SAMPLE_KEYS.stripe}";\nvar y = "${SAMPLE_KEYS.stripe}"`;

    const error = t.throws(() =>
    {
        transform(source);
    }, AggregateError);

    t.is(error.children.length, 2);
    t.is(R.filter(error => error instanceof SecuritySyntaxError, error.children).length, 2);
});

test("should throw a single SyntaxError when not containing valid JavaScript or any API keys", t =>
{
    const source = "this is nonsense";

    t.throws(() =>
    {
        transform(source);
    }, SyntaxError);
});
