var express = require('express');
var footynz = express();
var dotenv = require('dotenv');
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
dotenv.config();
var MongoUrl = process.env.MongoOnline;
// var MongoOnline = process.env.MongoOnline;
var cors = require('cors')
const bodyparser = require('body-parser');
var port = process.env.PORT || 80;
var db;


footynz.use(bodyparser.urlencoded({extended:true}));
footynz.use(bodyparser.json());
footynz.use(cors());
footynz.use(express());

// Assuming 'db' is your connected MongoDB database instance
footynz.get('/',(req,res)=>{
    res.send("Welcome to footynz.server")
})

    footynz.get('/getCategory', (req, res) => {
    const category = req.query.category;
    const productId = req.query.id; // Corrected: Grab ID from query params

    let query = {};

    if (productId) {
        // High priority: Fetch specific product for Detail Page
        query = { id: productId };
    } else if (category && category !== 'All') {
        // Medium priority: Fetch products by category (Men, Sports, etc.)
        query = { category: category };
    } else {
        // Default: Homepage view showing featured items
        query = { isFeatured: true };
    }
    // Connect to your 'products' collection in 'footynzdata'
    db.collection('products').find(query).toArray((err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send(err);
        }
        
        // Debugging: See what is being sent to your frontend
        console.log(`Sending ${result.length} products for category: ${category || 'Featured'}`);
        
        res.send(result);
    });
});


MongoClient.connect(MongoUrl, (err,client) => {
    if(err) console.log("error while connecting");
    db = client.db('footynzdata');
    footynz.listen(port, '0.0.0.0',()=>{
        console.log(`listening on port ${port}`)
    })
})




