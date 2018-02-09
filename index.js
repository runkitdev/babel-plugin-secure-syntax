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
    return { type: type, loc: location.start };
}

function toSyntaxError(keyOccurrence)
{
    var err = new SyntaxError("unexpected " + keyOccurrence.type + " was found");
    err.lineNumber = keyOccurrence.loc.line;
    err.columnNumber = keyOccurrence.loc.column;
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
                    {
                        var firstError = state.file.metadata.errors.pop();
                        throw toSyntaxError(firstError);
                    }
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
