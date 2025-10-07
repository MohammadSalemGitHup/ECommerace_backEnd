
import express from 'express';
const mohsal_app = express();

import mohsal_mongoose from 'mongoose';

import mohsal_jwt from 'jsonwebtoken';
import mohsal_multer from 'multer';
import mohsal_path from 'path';
import mohsal_cors from 'cors';
import { type } from 'os';
import { log } from 'console';




////////////// register in app.use method ////////////
////////////////////use  MiddleWare as a global //////////////
// register in Middle Ware
mohsal_app.use(express.json()); //parse incoming JSON data
mohsal_app.use(mohsal_cors()); //call your API safely



//////////////////// server listen on static socket ////////////////////////////
const mohsal_PORT = process.env.PORT || 4000;
  // process.env.PORT => this is the port that when deploy on hosting server 

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

const mohsal_MONGO_URI = "mongodb+srv://salmohammad683_db_user:mohsal%40mongodb123456@cluster0.hzar987.mongodb.net/e-commerce";
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
mohsal_app.use("/images", express.static("upload/images")); // make upload/images folder public accessable
mohsal_app.post("/upload", mohsal_upload.single('product'), (request, response) => {
    response.json({
        success:1,
        image_url: `http://localhost:${mohsal_PORT}/images/${request.file.filename}`
    })                        
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
    
    
    const {name, image, category, new_price, old_price, available } = request.body;

    const product = new Product({
      id,name,image,category,new_price,old_price,
      date: new Date(),  
      available: available ?? true 
    });
    console.log(`when use =>/addproduct<= product: ${product}`);
    
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
in JSON Body
{
  "name": "product123",
  "image": "http://localhost:4000/images/product_1759821259418.png", 
  "category": "kid",
  "old_price": 10,
  "new_price": 8
}
*/



//////////////// Delete Product EndPoint /////////////
mohsal_app.delete("/removeproduct/:id", async (request, response) => {

  try{
    const { id } = request.params;;
    
    // Attempt to delete product by its 'id' field
    const deletedProduct = await Product.findOneAndDelete({ id });
    if (!deletedProduct) {
      return response.status(404).json({
        success: false,
        message: " Product not found"
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
localhost/4000/removeproduct/5
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

