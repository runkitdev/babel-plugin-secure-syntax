"use strict";

var SecuritySyntaxError = require("./errors/security-syntax-error");
var AggregateError = require("./errors/aggregate-error");
var combinedKeyRegExes = require("./processed-key-definitions").combinedKeyRegExes;
var locationRange = require("./location").locationRange;
var checks = require("./checks");
var containsKey = checks.containsKey;
var checkForKeyIn = checks.checkForKeyIn;

function securityCheckByRegex(source, errors)
{
    var match;
    // go through each match and create an error for it
    while ((match = combinedKeyRegExes.exec(source)))
    {
        var keyType = containsKey(match[0]);
        var location = locationRange(source, match.index, match[0]);
        errors.push(new SecuritySyntaxError.KeyError(keyType, null, location));
    }

    // return an AggregateError if there's more than one
    if (errors.length > 1)
        return new AggregateError("Multiple Security Errors", errors);

    // otherwise, return the only error
    return errors[0];
}

function secureParse(self, insecureParse, args)
{
    var source = args[0];
    try
    {
        return insecureParse.apply(self, args);
    }
    catch (e)
    {
        // throw the caught error and any others found in securityCheckByRegex
        throw securityCheckByRegex(source, [e]);
    }
}

module.exports = function (babelInstance)
{
    if (babelInstance)
    {
        var File = babelInstance.File;

        // keep unmodified parser from original babelInstance
        var FileParse = File.prototype.parse;

        File.prototype.parse = function ()
        {
            return secureParse(this, FileParse, arguments);
        };
    }

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
                    {
                        if (state.file.metadata.errors.length > 1)
                            throw new AggregateError("Multiple Security Syntax Errors", state.file.metadata.errors);

                        throw state.file.metadata.errors[0];
                    }
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
