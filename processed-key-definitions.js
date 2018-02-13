var keyDefinitions = require("./key-definitions");

var keyDefinitionsMap = {};

var keyDefinitionRegExps = keyDefinitions.map(function(def)
{
    return (keyDefinitionsMap[def.description] = new RegExp(def.regexp.pattern));
});

module.exports.keyDefinitionsMap = keyDefinitionsMap;

var combinedKeyRegExes = new RegExp(keyDefinitionRegExps.map(function (re)
{
    return re.source;
}).join("|"));

module.exports.combinedKeyRegExes = combinedKeyRegExes;
