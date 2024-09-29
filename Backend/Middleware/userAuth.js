
const Usermodel=require('../Model/user')
const asyncHandler = require("express-async-handler");
const jwt=require("jsonwebtoken")
const authmiddleware = asyncHandler(async (req, res, next)=>{
    let token;
    if(req.headers?.authorization?.startsWith('Bearer')){
        token = req.headers.authorization.split(" ")[1];
        try {
            if(token){
                const decoded =jwt.verify(token, process.env.SECRET);
                const user = await Usermodel.findById(decoded?.userID);
                req.user = user;
                next();
            }
        } catch (error) {
            throw new Error("Not Authorised token expired, Please login again")
        }
    }else{
        throw new Error
    }
})

 

module.exports=authmiddleware