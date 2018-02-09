"use strict";

var keyDefinitions = require("./key-definitions");
var SecuritySyntaxError = require("./security-syntax-error");

var map = {};
keyDefinitions.forEach(function(def)
{
    map[def.description] = new RegExp(def.regexp.pattern);
    return map[def.description];
});

function containsKey(string)
{
    for (var keyDef in map)
    {
        if (map.hasOwnProperty(keyDef))
        {
            if (map[keyDef].test(string))
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
