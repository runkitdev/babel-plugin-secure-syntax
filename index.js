"use strict";

var SecuritySyntaxError = require("./security-syntax-error");
var keyDefinitionsMap = require("./processed-key-definitions").keyDefinitionsMap;

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

module.exports = function ()
{
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
