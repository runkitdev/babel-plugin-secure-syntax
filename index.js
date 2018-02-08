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

function errorMessage(keyDescription)
{
    return "Error: Contains " + keyDescription + ".";
}

module.exports = function ()
{
    return {
        visitor: {
            Program(path, state)
            {
                // As far as I can tell, the only way for a Visitor to get to a File is through the Program parent
                path.parent.comments.forEach(function(comment)
                {
                    var key = containsKey(comment.value);
                    if (key)
                        throw path.buildCodeFrameError(errorMessage(key));
                });
            },
            StringLiteral(path)
            {
                var key = containsKey(path.node.value);
                if (key)
                    throw path.buildCodeFrameError(errorMessage(key));
            },
        }
    };
};
