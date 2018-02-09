"use strict";

var SecuritySyntaxError = require("./security-syntax-error");
var keyDefinitionsMap = require("./processed-key-definitions").keyDefinitionsMap;

function containsKey(string)
{
    for (var keyDef in keyDefinitionsMap)
    {
        if (keyDefinitionsMap.hasOwnProperty(keyDef))
        {
            if (keyDefinitionsMap[keyDef].test(string))
                return keyDef;
        }
    }
    return false;
}

module.exports = function ()
{
    return {
        visitor: {
            Program: {
                enter(path, state)
                {
                    state.file.metadata.errors = [ ];

                    path.parent.comments.forEach(function(comment)
                    {
                        var keyType = containsKey(comment.value);
                        if (keyType)
                            state.file.metadata.errors.push(new SecuritySyntaxError(keyType, state.file.name, comment.loc));
                    });
                },
                exit(path, state)
                {
                    if (state.file.metadata.errors.length)
                        throw state.file.metadata.errors.pop();
                }
            },
            StringLiteral(path, state)
            {
                var keyType = containsKey(path.node.value);

                if (keyType)
                    state.file.metadata.errors.push(new SecuritySyntaxError(keyType, state.file.name, path.node.loc));
            },
        }
    };
};
