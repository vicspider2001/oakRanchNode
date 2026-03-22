var express = require('express');
var footynz = express();
var dotenv = require('dotenv');
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var cors = require('cors');
const bodyparser = require('body-parser');

dotenv.config();

var MongoUrl = process.env.MongoOnline;
// var MongoOnline = process.env.MongoOnline;

var port = process.env.PORT || 80;
var db;


footynz.use(bodyparser.urlencoded({extended:true}));
footynz.use(bodyparser.json());
footynz.use(cors());


// Assuming 'db' is your connected MongoDB database instance
footynz.get('/',(req,res)=>{
    res.send("Welcome to Oak Ranch Farm - Farm Api Active")
})

// 1. GET ALL PRODUCE (For Shop.jsx)
footynz.get('/api/produce', (req, res) => {
    // We access the collection 'produce' inside your 'aokRanchData' DB
    db.collection('produce').find().toArray((err, result) => {
        if (err) res.status(500).send("Error fetching harvest data");
        res.status(200).send(result);
    });
});

// 2. GET SINGLE PRODUCT BY ID (For ProductDetail.jsx)
footynz.get('/api/produce/:id', (req, res) => {
    var id = req.params.id;
    // We must convert the string ID to a MongoDB ObjectID
    db.collection('produce').findOne({ _id: new mongo.ObjectId(id) }, (err, result) => {
        if (err) res.status(500).send("Error fetching product details");
        if (!result) res.status(404).send("Product not found");
        res.status(200).send(result);
    });
});

// GET /api/trace/:id
footynz.get('/api/trace/:id', async (req, res) => {
    try {
      const serial = req.params.id;
      
      // Access the 'batches' collection directly from your 'footynz' database
      const batch = await db.collection('batches').findOne({ serialNumber: serial });
  
      if (!batch) {
        return res.status(404).json({ message: "Serial number not found in our registry." });
      }
  
      res.json(batch);
    } catch (err) {
      console.error("Database Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

MongoClient.connect(MongoUrl, (err,client) => {
    if(err) console.log("error while connecting");
    db = client.db('aokRanchData');
    footynz.listen(port, '0.0.0.0',()=>{
        console.log(`listening on port ${port}`)
    })
})




