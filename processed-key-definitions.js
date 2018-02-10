var keyDefinitions = require("./key-definitions");

var keyDefinitionsMap = {};
var keyRegexes = [];

keyDefinitions.forEach(function(def)
{
    keyDefinitionsMap[def.description] = new RegExp(def.regexp.pattern);
    keyRegexes.push(keyDefinitionsMap[def.description]);
    return keyDefinitionsMap[def.description];
});

module.exports.keyDefinitionsMap = keyDefinitionsMap;

var combinedKeyRegExes = new RegExp(keyRegexes.map(function (re) { return re.source; }).join("|"));

module.exports.combinedKeyRegExes = combinedKeyRegExes;
