
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

dotenv.config();

 function generateToken(user){
    return jwt.sign({
        userID: user._id,
      userEmail: user.email,
      isVerified: true,
    },
    process.env.SECRET,
    { expiresIn: "1d" }
);
}

module.exports=generateToken;