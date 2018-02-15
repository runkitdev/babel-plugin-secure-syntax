"use strict";

var SecuritySyntaxError = require("./security-syntax-error");
var AggregateError = require("./aggregate-error");
var keyDefinitionsMap = require("./processed-key-definitions").keyDefinitionsMap;
var combinedKeyRegExes = require("./processed-key-definitions").combinedKeyRegExes;

function containsKey(string)
{
    for (var keyDef in keyDefinitionsMap)
    {
        if (keyDefinitionsMap[keyDef].test(string))
            return keyDef;
    }
    return false;
}

function checkForKeyIn(property)
{
    return function (path, state)
    {
        var keyType = containsKey(path.node[property]);

        if (keyType)
            state.file.metadata.errors.push(new SecuritySyntaxError.KeyError(keyType, state.file.name, path.node.loc));
    };
}

function securityCheckByRegex(source)
{
    var match;
    var errors = [];
    while ((match = combinedKeyRegExes.exec(source)))
    {
        var location = { start: { columnNumber: match.index } };
        errors.push(new SecuritySyntaxError("Inline key error was found", match[0], null, location));
    }

    if (errors.length)
        return new AggregateError("Multiple Security Errors", errors);

    return null;
}

function secureParse(self, insecureParse, args)
{
    var source = args[0];
    var pedanticSecurityError = securityCheckByRegex(source);

    try
    {
        const result = insecureParse.apply(self, args);

        result.program.pedanticSecurityError = pedanticSecurityError;

        return result;
    }
    catch (e)
    {
        if (pedanticSecurityError)
            throw pedanticSecurityError;

        throw e;
    }
}

module.exports = function (babelInstance)
{
    var File = babelInstance.File;

    if (File.__MODIFIED_BY_PREPROCESSER)
        return;

    // keep unmodified parser from original babelInstance
    var FileParse = File.prototype.parse;

    File.__MODIFIED_BY_PREPROCESSER = true;

    File.prototype.parse = function ()
    {
        return secureParse(this, FileParse, arguments);
    };

    return {
        visitor: {
            Program: {
                enter: function enter(path, state)
                {
                    state.file.metadata.errors = [ ];

                    path.parent.comments.forEach(function(comment)
                    {
                        var keyType = containsKey(comment.value);
                        if (keyType)
                            state.file.metadata.errors.push(new SecuritySyntaxError.KeyError(keyType, state.file.name, path.node.loc));
                    });
                },
                exit: function enter(path, state)
                {
                    if (state.file.metadata.errors.length)
                        throw state.file.metadata.errors.pop();

                    if (path.node.pedanticSecurityError)
                        throw path.node.pedanticSecurityError;
                }
            },
            StringLiteral: checkForKeyIn("value"),
            RegExpLiteral: checkForKeyIn("pattern"),
            TemplateElement: function (path, state)
            {
                var keyType = containsKey(path.node.value.raw);
                if (keyType)
                    state.file.metadata.errors.push(new SecuritySyntaxError.KeyError(keyType, state.file.name, path.node.loc));
            },
        }
    };
};
