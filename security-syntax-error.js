function SecuritySyntaxError(type, fileName, location)
{
    var message = "unexpected " + type + " was found";
    var instance = new SyntaxError(message, fileName, location.start.lineNumber);
    instance.columnNumber = location.start.columnNumber;
    instance.location = location;
    instance.type = type;

    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    return instance;
}

SecuritySyntaxError.prototype = new SyntaxError();
SecuritySyntaxError.prototype.constructor = SecuritySyntaxError;
SecuritySyntaxError.prototype.toString = function ()
{
    return "SecuritySyntaxError: " + this.message;
};

module.exports = SecuritySyntaxError;
