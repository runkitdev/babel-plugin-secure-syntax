var keyDefinitions = require("./key-definitions");

var keyDefinitionsMap = {};

keyDefinitions.forEach(function(def)
{
    keyDefinitionsMap[def.description] = new RegExp(def.regexp.pattern);
    return keyDefinitionsMap[def.description];
});

module.exports.keyDefinitionsMap = keyDefinitionsMap;
