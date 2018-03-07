var SecuritySyntaxError = require("./security-syntax-error");

Object.setPrototypeOf = Object.setPrototypeOf || function(object, prototypeOf)
{
    return (object.__proto__ = prototypeOf, object);
};

Object.getPrototypeOf = Object.getPrototypeOf || function(object)
{
    return object.__proto__;
};

function AggregateError(message, children)
{
    // Aggregate errors may have any number of children
    if (!children)
        children = [];

    var instance = new Error(message);
    instance.children = children;

    // Take the lineNumber and columnNumber from first child error
    var firstChild = children[0];
    instance.lineNumber = firstChild && children[0].lineNumber;
    instance.columnNumber = firstChild && children[0].columnNumber;

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
