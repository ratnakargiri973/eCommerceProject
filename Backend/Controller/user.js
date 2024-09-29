const Usermodel = require("../Model/user");
const ProductModel=require('../Model/product')
const cartModel=require('../Model/cart')
const CuponModel=require('../Model/cupon')
const orderModel=require('../Model/order')
const jwt = require("jsonwebtoken");
const {v4:uuidv4}=require('uuid')
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const generateToken  = require("../config/tokenGenerate");
const generateRefreshToken = require("../config/refreshToken");

//signup
const signup = asyncHandler(async (req, res) => {
  // console.log(req.body.email);

  const userexist = await Usermodel.findOne({ email: req.body.email });
  if (!userexist) {
    //bcrpting the password
    const hashPassword = await bcrypt.hash(req.body.password, 10)

    await Usermodel.create({
      ...req.body,
      role: req.body.role,
      password: hashPassword,
    });
    res.json({
      success: true,
      message: "signup successfull",
      userinfo: req.body,
    });
  } else {
    throw new Error(
      "User already exist please login or signup with  other email"
    );
  }
});

//signin
const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const checkUser = await Usermodel.findOne({ email }).exec();
  
  if (!checkUser) {
      return res.status(404).json({ error: "Invalid Credentials" });
  }
  
  const check = bcrypt.compareSync(password, checkUser.password);
  
  if (!check) {
      return res.status(404).json({ error: "Invalid Credentials" });
  }

  // Generate refresh token and update user
  const refreshToken = generateRefreshToken(checkUser._id);
  await Usermodel.findByIdAndUpdate(
      checkUser._id,
      { refreshToken },
      { new: true }
  );

  // Generate access token
  const token = generateToken(checkUser);

  // Set refresh token as a cookie
  res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000, // 3 days
  });


  res.status(200).json({
      message: "Login Successful",
      token
  });
});

//updatea user
const updateauser = asyncHandler(async (req, res) => {
  try {
    await Usermodel.findByIdAndUpdate(req.params.userid, req.body);

    res.json({
      success: true,
      message: "user updated successfully",
      updatedUserId: req.params.userid,
    });
  } catch (err) {
    throw new Error(err);
  }
});

//findall the users
const findalltheusers = asyncHandler(async (req, res) => {
  try {
    const findallusers = await Usermodel.find(req.params.userid);
    res.json({
      success: true,
      message: "got all the users",
      users: findallusers,
    });
  } catch (err) {
    throw new Error(err);
  }
});

//find user by id

const finduserbyid = asyncHandler(async (req, res) => {
  try {
    const userbyid = await Usermodel.findById(req.params.userid);
    res.json({
      success: true,
      message: "found user by it's id",
      user: userbyid,
    });
  } catch (err) {
    throw new Error(err);
  }
});

//delete a user by id
const deleteauserbyid = asyncHandler(async (req, res) => {
  try {
    const userbyid = await Usermodel.findByIdAndDelete(req.params.userid);
    res.json({
      success: true,
      message: "successfully deleted a user",
      user: userbyid,
    });
  } catch (err) {
    throw new Error(err);
  }
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  
  if (!cookie?.refreshToken) throw new Error("No refresh Token in Cookies");

  const refreshToken = cookie.refreshToken;
  const user = await Usermodel.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.status(200).json({ message: "User logged out successfully" });  // Send success message
  }

  await Usermodel.findOneAndUpdate({ refreshToken }, { refreshToken: "" });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });

  res.status(200).json({ message: "User logged out successfully" });  // Send success message
});


//reset password token geneartion
const forgotpasswordtoken=asyncHandler(async(req,res)=>{
  try{
    const user = await Usermodel.findById(req.params.userid);
    if (!user) {
      throw new Error("there is no user with this id to reset  the password");
    }

    const currenttime = Math.floor(new Date().getTime() / 1000);
  const expirytime = currenttime + 600;
  const Jwtpayload = {
    userId: user._id,
    role: user.role,
    mobileNo: user.mobileNo,
    exp: expirytime,
  };
  const forgotpasswordtoken = jwt.sign(Jwtpayload, "Ecommerce");
  res.status(200).json({
    success:true,
    message:"Forgot Password",
    token:forgotpasswordtoken})
  }
  catch(err){
    throw new Error(err)
  }

})

const resetpassword = asyncHandler(async (req, res) => {
  // console.log(req.params.userid);
  try {
    const salt = bcrypt.genSaltSync(10);
    const hashpassword = bcrypt.hashSync(req.body.password, salt);
    // const updatedpassword = req.body.password;
    const user = await Usermodel.findById(req.params.userid);
    if (!user) {
      throw new Error("there is no user with this id to reset  the password");
    }
    const userbyid = await Usermodel.findByIdAndUpdate(req.params.userid, {
      $set: { password: hashpassword },
    });
    res.json({
      success: true,
      message: `passowrd updated successfulyy for user ${req.params.userid}`,
    });
  } catch (err) {
    throw new Error(err);
  }
});


//get wishlist
const getwishlist=asyncHandler(async(req,res)=>{

  try{
    const token=req.headers.authorization.split(' ')[1]
    const tokendata=jwt.decode(token)
    const getwishlist=await Usermodel.findById(tokendata.userID).populate('wishlist')
    res.json({success:true,message:"found a widhlist",getwishlist})
    

  }
  catch(err){
    throw new Error(err)
  }
})

//cart
const usercart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  // console.log(cart);

  try {
    const token = req.headers.authorization.split(" ")[1];
    const tokendata = jwt.decode(token);
    console.log(tokendata);

    let products = [];
    const user = await Usermodel.findById(tokendata.userID);

    for (let i = 0; i < cart.length; i++) {
      const object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;

      let getprice = await ProductModel.findById(cart[i]._id).select("price").exec();
      if (!getprice) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      object.price = getprice.price;
      products.push(object);
    }

    let carttotal = products.reduce((total, item) => total + item.price * item.count, 0);

    let newcart = await new cartModel({
      products,
      carttotal,
      orderedby: tokendata.userID,
    }).save();

    user.carts.push(newcart._id); 
    await user.save(); 
    
    const updatedUser = await Usermodel.findById(tokendata.userID).populate("carts");

   
    res.json({ success: true, message: "Cart updated successfully", updatedUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});



  //get user crt 
const getusercart=asyncHandler(async(req,res)=>{
  try{
    const token=req.headers.authorization.split(' ')[1]
    const tokendata=jwt.decode(token)
    const userid=tokendata.userID
    const cart=await cartModel.findOne({orderedby:userid});
    
    res.json(cart)

  }
  catch(err){
    throw new Error(err)

  }

})

//makin cart empty
const emptycart = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const tokendata = jwt.decode(token);
    const userid = tokendata.userID;

    // Find the user
    const user = await Usermodel.findById(userid);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find and delete the cart
    const cart = await cartModel.findOneAndDelete({ orderedby: user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Remove the cart ID from the user's carts array
    user.carts = user.carts.filter(cartId => cartId.toString() !== cart._id.toString());
    await user.save();

    res.json({ success: true, message: "Cart emptied successfully", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});



//apply cupons
const applycupon=asyncHandler(async(req,res)=>{
  const {cupon}=req.body
  try{
    const token=req.headers.authorization.split(' ')[1]
    const tokendata=jwt.decode(token)
    const userid=tokendata.userID
    const validcupon=await CuponModel.findOne({name:cupon})
    console.log(validcupon);
    
  
    if(validcupon==null){
      throw new Error("invalid cupon")

    }
    const user=await Usermodel.findOne({_id:userid})
    // console.log(user)
    let {products,carttotal}=await cartModel.findOne({orderedby:userid})
    let totalafterdiscount=(carttotal-(carttotal*validcupon.discount)/100).toFixed(2)
    await cartModel.findOneAndUpdate({orderedby:user._id},{totalafterdiscount},{new:true})
    res.status(200).json({
      message: "success",
      totalAfterDiscount: totalafterdiscount
    });
  }
  catch(err){
    throw new Error(err)

  }
})

//create order
const createorder=asyncHandler(async(req,res)=>{
  const {COD,cuponapplied}=req.body;
  console.log(req.body);
  
 try{
  if(!COD){
    throw new Error("creating cash on deliveary is failed")
  }
  const token=req.headers.authorization.split(' ')[1]
  const tokendata=jwt.decode(token)
  const userid=tokendata.userID
  const user=await Usermodel.findById(userid)
  let usercart=await cartModel.findOne({orderedby:user._id})
  let finalamount=0
  if(cuponapplied&&usercart.totalafterdiscount){
    finalamount=usercart.totalafterdiscount
  }
  else{
    finalamount=usercart.carttotal
  }

    let newOrder=await new orderModel({
      products:usercart.products,
      paymentintent:{
        id:uuidv4(),
        method:COD,
        amount:finalamount,
        status:"Cash on deliveary",
        created:Date.now(),
        currency:"INR"
      },
      orderedby:user._id,
      orderStatus:"Cash on deliveary",

    }).save()
    console.log(newOrder)
    let update=usercart.products.map((item)=>{
      return{
        updateOne:{
          filter:{userid:item.product},
          update:{$inc:{stock:-item.count}}
        }
      }
    })

    const updated=await  ProductModel.bulkWrite(update,{})
    res.json({success:true})
 }
 catch(err){
  throw new Error(err)
 }

})


//get all orders
const getorders=asyncHandler(async(req,res)=>{
  try{
    const token=req.headers.authorization.split(' ')[1]
    const tokendata=jwt.decode(token)
    const userid=tokendata.userID
    const userorders=await orderModel.findOne({orderedby:userid})
    res.json({success:true,userorders})

  }
  catch(err){
    throw new Error(err)
  }
})


const updateorderstatus=asyncHandler(async(req,res)=>{
  try{
    const {status}=req.body
    const {id}=req.params
    const finalupdatedorder=await orderModel.findByIdAndUpdate(id,
      {
        orderStatus:status,
        paymentintent:{
          status:status
        }
      },
      {new:true}
    )
    res.json(finalupdatedorder)

  }
  catch(err){
    throw new Error(err)
  }
})




const userController = {
  signup,
  signin,
  updateauser,
  findalltheusers,
  finduserbyid,
  deleteauserbyid,
  logout,
  forgotpasswordtoken,
  resetpassword,
  getwishlist,
  usercart,
  getusercart,
  emptycart,
  applycupon,
  createorder,
  getorders,
  updateorderstatus
};
module.exports = userController;
