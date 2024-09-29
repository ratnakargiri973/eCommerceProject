const express=require('express')
const userrouter=require('./Routes/user')
const productRouter=require('./Routes/product')
const blogRoutes=require('./Routes/Blog')
const categoreyRoute=require('./Routes/categorey')
const BrandRoute=require('./Routes/Brand')
const cuponRouter=require('./Routes/cupon')
const cookieParser=require("cookie-parser")

const mongoose = require('mongoose')
var cors = require('cors')
const dotenv=require('dotenv')
const { notfound, erroprHandler } = require('./Middleware/Error')
dotenv.config();
const app=express()
mongoose.connect(process.env.MONGO_URI).then(()=>console.log("data base connected successfully")).catch((err)=>console.log(err))


app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());

app.use('/ecommerce/v1/user',userrouter)
app.use('/ecommerce/v1/product',productRouter)
app.use('/ecommerce/v1/blog',blogRoutes)
app.use('/ecommerce/v1/categorey',categoreyRoute)
app.use('/ecommerce/v1/brand',BrandRoute)
app.use('/ecommerce/v1/cupon',cuponRouter)

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/index.html')

})



app.use(notfound)
app.use(erroprHandler)
app.listen(5313,console.log("server is on post 5313"))