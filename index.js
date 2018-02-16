"use strict";

var SecuritySyntaxError = require("./security-syntax-error");
var AggregateError = require("./aggregate-error");
var keyDefinitionsMap = require("./processed-key-definitions").keyDefinitionsMap;
var combinedKeyRegExes = require("./processed-key-definitions").combinedKeyRegExes;
var locationRange = require("./location");

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
        var keyType = containsKey(match[0]);
        var location = locationRange(source, match.index, match[0]);
        errors.push(new SecuritySyntaxError.KeyError(keyType, null, location));
    }

    if (errors.length)
        return new AggregateError("Multiple Security Errors", errors);

    return null;
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
