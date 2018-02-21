var SecuritySyntaxError = require("./security-syntax-error");

function AggregateError(message, children)
{
    // Aggregate errors must have multiple children, otherwise they should be single errors
    if (children.length <= 1)
        return children.pop();

    var instance = new Error(message);
    instance.children = children;

    // Take the lineNumber and columnNumber from first child error
    instance.lineNumber = children[0].lineNumber;
    instance.columnNumber = children[0].columnNumber;

    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    return instance;
}

AggregateError.prototype = new Error();
AggregateError.prototype.constructor = AggregateError;
AggregateError.prototype.toString = function ()
{
    return "AggregateError: " + this.message + "\n" + this.children.map(function (error)
    {
        return "* " + error.toString();
    }).join("\n");
};

AggregateError.prototype.containsSecuritySyntaxError = function ()
{
    return this.children.reduce(function(accumulator, currentValue)
    {
        return accumulator || (currentValue instanceof SecuritySyntaxError);
    }, false);
};

module.exports = AggregateError;
