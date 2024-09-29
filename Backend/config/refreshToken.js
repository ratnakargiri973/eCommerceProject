const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

dotenv.config();

function generateRefreshToken(user){
    return jwt.sign({
        userID: user._id,
      userEmail: user.email,
      isVerified: true,
    },
    process.env.SECRET,
    { expiresIn: "3d" }
);
}

module.exports=generateRefreshToken;