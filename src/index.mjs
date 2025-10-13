
import express from 'express';
const mohsal_app = express();

import mohsal_mongoose from 'mongoose';

import mohsal_jwt from 'jsonwebtoken';
import mohsal_multer from 'multer';
import mohsal_path from 'path';


import mohsal_dotenv  from "dotenv";
mohsal_dotenv.config();
console.log(`mohsal_dotenv file configration done yaaaaaa`);


import mohsal_cors from "cors";




////////////// register in app.use method ////////////
////////////////////use  MiddleWare as a global //////////////
// register in Middle Ware
mohsal_app.use(express.json()); //parse incoming JSON data
mohsal_app.use(mohsal_cors()); //call your API safely


//////////////////// server listen on static socket ////////////////////////////
const mohsal_PORT = process.env.PORT || 4000;
  // process.env.PORT => this is the port that when deploy on hosting server 
const mohsal_HOST = process.env.HOST || "http://localhost";
const mohsal_BASE_URL = process.env.BASE_URL || `${mohsal_HOST}:${mohsal_PORT}`;

mohsal_app.listen(mohsal_PORT, (error)=> {
    if(!error){
        console.log(`Server runing on ${mohsal_PORT}`);
    }
    else{
        console.log(`Error: ${error}`);  
    }
});






mohsal_app.get("/", (request, response) => {
    response.send(`Express App Runing ...`);
})


/* 
database connection in MongoDb Atles 
 mongodb+srv://salmohammad683_db_user:<db_password>@cluster0.hzar987.mongodb.net/
 Note: Do not forgit URL Encodeing in password => @ --> %40

 */


const mohsal_MONGO_URI = process.env.MOHSAL_MONGO_URI;
const connectDB = async () => {
  try {
    await mohsal_mongoose.connect(mohsal_MONGO_URI);
    console.log("Connected to MongoDB Atlas, Yaaasss");
  } catch (err) {
    console.error("Failed to connect MongoDB:", err.message);
    process.exit(1); // Stop app if DB fails to connect
  }
};

connectDB();




////////////// upload the image on multer //////////////
/// image Storage Engine ///
const mohsal_storage = mohsal_multer.diskStorage( {
    destination: "./upload/images",
    filename:(req, file, cb) => {
                     // file formating => filName_dateExtention
        return cb(null, `${file.fieldname}_${Date.now()}${mohsal_path.extname(file.originalname)}`)
    }
})

const mohsal_upload = mohsal_multer( {storage:mohsal_storage} );

///////////////////////////////////////////////////


//////// creating Upload end Point ///////////////
mohsal_app.use("/mohsalimages", express.static("upload/images")); // make upload/images folder public accessable by mohsalimages as a link e.g(BASEURL/mohsalimages/xxxx.png)
mohsal_app.post("/upload", mohsal_upload.single('product'),  /* Upload Just only one file at a time key:product, value:file*/
                          (request, response) => {

    if (!request.file) {
      return response.status(400).json({ success: 0, message: "No file uploaded." });
    }
    const url = `${mohsal_BASE_URL}/mohsalimages/${request.file.filename}`;
    console.log(url);
    

    return response.status(201).json({
      success: 1,
      image_url: url,
      filename: request.file.filename,
    });                   
})
/*
Use Case for this post (on postman ) =>
  POST : localhost:4000/upload  -> Body -> form Check File yes 
                                            -> product chooseFile
*/


/////////////////////////////////////////////////////////////////////////
//////////////////////////// Product ///////////////////////////////
/////////////////////////////////////////////////////////////////////////
// Schema for Creating Product 
                                  //collection name
const Product = mohsal_mongoose.model("product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
});

///

mohsal_app.post("/addproduct", async (request, response) => {
  
  try{
    /* get last Product object to take/get thier id 
               this is help me to set id for new object */
    let products = await Product.find( {} );  
    let id = 0;
    if(products.length > 0){  
      let lastProduct_arr = products.slice(-1);
      id = lastProduct_arr[0].id + 1 
    }else id=1;
    
    // console.log(id);
    // console.log(request.body);
    
    const {name, image, category, new_price, old_price, available } = request.body;

    const product = new Product({
      id, // added from server (from me)
      name,image,category,new_price,old_price, // from user frontEnds
      date: new Date(), // added from server (from me) 
      available: available ?? true // added from server (from me)
    });
    console.log(`when use =>/addproduct<= the product is : ${product}`);
    
    // save on database
    await product.save();
    console.log("Saved");
    

    response.status(201).json({
      success: true,
      message: " Product added successfully!",
      product
    });

  }catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: " Failed to add product",
      error: error.message
    });
  }

})
/*
useCase :
URL=> localhost:4000/addproduct
in JSON Body (make sure it is a JSON on Postman)
{
  "name": "product123",
  "image": "http://localhost:4000/mohsalimages/product_1760079593646.png", 
  "category": "kid",
  "old_price": 10,
  "new_price": 8
}
*/



/// creating API to det ALL Products
mohsal_app.get("/getallproducts", async (request, response) => {

  try{

    /// Query to get all products 
    let products = await Product.find( {} );
    
    response.status(200).json({
      success: true,
      message: " Successfully fetched all products",
      count: products.length,
      products
    });

  }
  catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: " Failed to get products",
      error: error.message
    });
  }
  
})
/*
UseCase
localhost:4000/getallproducts
*/


//////////////// Delete Product EndPoint /////////////
mohsal_app.delete("/removeproduct/:id", async (request, response) => {

  try{
    const { id } = request.params;

    // 1. Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    
    // 2.Attempt to delete product by its 'id' field
    const deletedProduct = await Product.findOneAndDelete({ id });
    if (!deletedProduct) {
      return response.status(404).json({
        success: false,
        message: " Product not found"
      });
    }

    // Handle not found
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${id} not found`,
      });
    }

    // Successful deletion
    console.log(` Product with id ${id} removed`);
    response.status(200).json({
      success: true,
      message: `Product with id ${id} has been deleted successfully`
    });

  }
  catch (error) {
    console.error(error);
    response.status(500).json({
      success: false,
      message: " Failed to add product",
      error: error.message
    });
  }
  
})
/*
UseCase:
http://localhost:4000/removeproduct/1
*/



///////////////////////////////////////////////////
////////////////////// SignUp and LoginIn //////////////////////
/////////////////////////////////////////////////////


//////////////////// SignUp ///////////////////////////
// Shema creating for user model 
const Users = mohsal_mongoose.model("Users",{

  name: {type: String},
  email: {type:String, unique: true},
  password: {type:String},
  cartData: {type:Object},
  date: {type:Date, default: Date.now}
});

//Test reading from .env file /////////////
// setTimeout(
//       () => {
//         console.log("\nJWT Secret:", process.env.MOHSAL_JWT_SECRET); // test if it works
//       }
//   ,500);

// API EndPoints  for signup for user 
mohsal_app.post("/signup", async (reqest, response) => {

  try{

    const {userName, email, password, cartData} = reqest.body;

    // check user exist or not on Data base 
    let check_user = await Users.findOne( {email: email} );
    // console.log(check_user);
    if(check_user){
      return response.status(400).json({success: false, errMSg:"User Exist with same email address"});
    }

    // crating user Object 
    let numberOfProductsPerUser = 300; // max number of products that user can purchase is just 300 product
    let cart = {}; 
    for(let i = 0; i < numberOfProductsPerUser; i++){
      cart[i] = 0;
    }
    const user = new Users( {name:userName, email:email, password:password, cartData:cart } );
    
    // commit on data base 
    await user.save();

    
    ///////////////// JWT Authntication //////////////
    const mohsal_data_payload = { user: {id: user.id} }; 
    // console.log(mohsal_data_payload);
    
    const jwt_token = mohsal_jwt.sign(mohsal_data_payload, process.env.MOHSAL_JWT_SECRET, 
                                                                          { expiresIn: "1h" }); 
    //Now your secret is hidden inside .env and not exposed in your code.
    
    return response.status(201).json( {success: true, jwt_token} );



  }catch(err){
    console.error(err);
  }
  
});

/* UseCase:
POST on localhost:4000/signup 
on Body JSON => 
{
  "userName": "mohsal",
  "email": "test1.com", 
  "password": "123"
}

*/




/////////////////// LoginIn EndPoint //////////////////////

mohsal_app.post("/login", async (request, response) => {

  let user = await Users.findOne( {email: request.body.email} );

  if(user){

    const pass_comapr = ( user.password === request.body.password );
    if(pass_comapr){


       ///////////////// JWT Authntication //////////////
      const data_payload = { user: {id: user.id} };
      const jwt_token = mohsal_jwt.sign(data_payload, process.env.MOHSAL_JWT_SECRET, { expiresIn: "1h" });
      
      return response.status(201).json( {success: true, jwt_token} ); 
    }else{
      return response.json({success: false, err:"Wrong Password "});
    }

  }else{
    return response.json({success: false, err:"Wrong Email "});
  }



});

/* UseCase:
POST on localhost:4000/login
on Body JSON => 
{
  "email": "test1.com", 
  "password": "123"
}

*/

