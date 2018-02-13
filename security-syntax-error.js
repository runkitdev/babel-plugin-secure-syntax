function SecuritySyntaxError(message, type, fileName, location)
{
    var instance = new SyntaxError(message, type, fileName, location.start.lineNumber);
    instance.columnNumber = location.start.columnNumber;
    instance.start = location.start;
    instance.end = location.end;
    instance.type = type;

    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    return instance;
}

SecuritySyntaxError.prototype = new SyntaxError();
SecuritySyntaxError.prototype.constructor = SecuritySyntaxError;
SecuritySyntaxError.toString = function ()
{
    return "SecuritySyntaxError: " + this.message;
};

// Alternate constructor which automatically sets the message based on the type:
SecuritySyntaxError.KeyError = function (type, fileName, location)
{
    return new SecuritySyntaxError("Inline " + type + " was found", type, fileName, location);
};

module.exports = SecuritySyntaxError;
