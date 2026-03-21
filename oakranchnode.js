const express = require('express');
const serverless = require('serverless-http'); // Import this
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb'); // Modern destructuring
const cors = require('cors');

dotenv.config();

const footynz = express();
const MongoUrl = process.env.MongoOnline;
let db;

// Middleware
footynz.use(express.json()); // Use built-in express.json instead of body-parser
footynz.use(express.urlencoded({ extended: true }));
footynz.use(cors());

// --- DATABASE CONNECTION HELPER ---
// Serverless functions need to reuse the DB connection
async function connectDB() {
    if (db) return db;
    const client = new MongoClient(MongoUrl);
    await client.connect();
    db = client.db('aokRanchData');
    return db;
}

// --- ROUTES ---

footynz.get('/', (req, res) => {
    res.send("Welcome to Oak Ranch Farm - Farm Api Active");
});

// 1. GET ALL PRODUCE (For Shop.jsx)
footynz.get('/api/produce', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('produce').find().toArray();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Error fetching harvest data" });
    }
});

// 2. GET SINGLE PRODUCT BY ID (For ProductDetail.jsx)
footynz.get('/api/produce/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const id = req.params.id;
        const result = await database.collection('produce').findOne({ _id: new ObjectId(id) });
        
        if (!result) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Invalid ID format or Database Error" });
    }
});

// 3. GET TRACEABILITY DATA (For Traceability.jsx)
footynz.get('/api/trace/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const serial = req.params.id;
        const batch = await database.collection('batches').findOne({ serialNumber: serial });

        if (!batch) {
            return res.status(404).json({ message: "Serial number not found in our registry." });
        }
        res.json(batch);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- VERCEL EXPORT ---
// Instead of footynz.listen, we wrap it for serverless
const handler = serverless(footynz);

module.exports = async (req, res) => {
    // This ensures MongoDB is connected before the request is handled
    await connectDB();
    return await handler(req, res);
};