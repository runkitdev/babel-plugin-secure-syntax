"use strict";

var keyDefinitions = require("./key-definitions");

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

function keyOccurrence(type, location)
{
    var err = new SyntaxError("unexpected " + type + " was found");
    err.lineNumber = location.line;
    err.columnNumber = location.column;
    return err;
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
                            state.file.metadata.errors.push(keyOccurrence(keyType, comment.loc));
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
                    state.file.metadata.errors.push(keyOccurrence(keyType, path.node.loc));
            },
        }
    };
};
