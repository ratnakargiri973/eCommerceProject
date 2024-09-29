const Usermodel = require('../Model/user');
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const authmiddleware = asyncHandler(async (req, res, next) => {
    let token;

    // Check if authorization header is present and starts with 'Bearer'
    if (req.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(" ")[1];
        try {
            if (token) {
                // Verify the token
                const decoded = jwt.verify(token, process.env.SECRET);
                
                // Find the user based on the decoded user ID
                const user = await Usermodel.findById(decoded?.userID);
                
                // If user is found, attach it to the request object
                if (user) {
                    req.user = user;
                    next(); // Proceed to the next middleware or route
                } else {
                    res.status(401);
                    throw new Error("User not found, please login again");
                }
            }
        } catch (error) {
            // Handle JWT verification errors (e.g., token expired, invalid token)
            res.status(401); // Unauthorized
            throw new Error("Not authorized, token expired or invalid. Please login again.");
        }
    } else {
        // If no token is provided in the authorization header
        res.status(401); // Unauthorized
        throw new Error("No token provided, authorization denied.");
    }
});

module.exports = authmiddleware;
