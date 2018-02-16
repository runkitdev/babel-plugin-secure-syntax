// lineNumber and columnNumber indexes are one-based
function locationFromIndex(source, index)
{
    const substring = source.substr(0, index);
    const lines = substring.split(/\n/);
    return { columnNumber: lines[lines.length - 1].length + 1, lineNumber: lines.length };
};

function locationRange(source, index, match)
{
    var startLocation = locationFromIndex(source, index);
    var endLocation = locationFromIndex(source, index + match.length);
    return { start: startLocation, end: endLocation };
}

module.exports.locationRange = locationRange;

function getLocation(source, regex)
{
    var match = regex.exec(source);
    return match && locationRange(source, match.index, match[0]);
}

module.exports.getLocation = getLocation;
