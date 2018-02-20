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

module.exports.containsKey = containsKey;

function checkForKeyIn(property)
{
    return function (path, state)
    {
        var keyType = containsKey(path.node[property]);

        if (keyType)
            state.file.metadata.errors.push(new SecuritySyntaxError.KeyError(keyType, state.file.name, path.node.loc));
    };
}

module.exports.checkForKeyIn = checkForKeyIn;
