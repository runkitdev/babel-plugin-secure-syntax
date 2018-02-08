"use strict";

var errorMessage = "Invalid use of API key";

module.exports = function ()
{
    return {
        visitor: {
            Program(path, state)
            {
                // As far as I can tell, the only way for a Visitor to get to a File is through the Program parent
                path.parent.comments.forEach(function(comment)
                {
                    if (comment.value === " API_KEY")
                        throw path.buildCodeFrameError(errorMessage);
                });
            },
            StringLiteral(path)
            {
                if (path.node.value === "API_KEY")
                    throw path.buildCodeFrameError(errorMessage);
            },
        }
    };
};
