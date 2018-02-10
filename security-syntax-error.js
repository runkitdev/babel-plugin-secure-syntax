function SecuritySyntaxError(type, fileName, location)
{
    var message = "unexpected " + type + " was found";
    var instance = new SyntaxError(message, fileName, location.start.lineNumber);
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

module.exports = SecuritySyntaxError;
