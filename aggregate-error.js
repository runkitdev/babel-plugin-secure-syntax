function AggregateError(message, children)
{
    var instance = new Error(message);
    instance.children = children;

    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    return instance;
}

AggregateError.prototype = new Error();
AggregateError.prototype.constructor = AggregateError;
AggregateError.prototype.toString = function ()
{
    var errorString = "AggregateError: " + this.message;

    if (this.children)
    {
        errorString += "\n" + this.children.map(function (error)
        {
            return "* " + error.message + "\n";
        });
    }

    return errorString;
};

module.exports = AggregateError;
