const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb'); // Modern destructuring
const cors = require('cors');

dotenv.config();

const oak = express();
const MongoUrl = process.env.MongoOnline;
const port = process.env.PORT || 80;
let db;

// Middleware
oak.use(express.urlencoded({ extended: true })); // Express has built-in body-parser now
oak.use(express.json());
oak.use(cors());

// --- ROUTES ---

oak.get('/', (req, res) => {
    res.send("Welcome to Oak Ranch Farm - Farm Api Active");
});

// 1. GET ALL PRODUCE
oak.get('/api/produce', async (req, res) => {
    try {
        const result = await db.collection('produce').find().toArray();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).send("Error fetching harvest data");
    }
});

// 2. GET SINGLE PRODUCT BY ID
oak.get('/api/produce/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send("Invalid ID format");

        const result = await db.collection('produce').findOne({ _id: new ObjectId(id) });
        if (!result) return res.status(404).send("Product not found");
        res.status(200).json(result);
    } catch (err) {
        res.status(500).send("Error fetching product details");
    }
});

// 3. GET TRACEABILITY DATA
oak.get('/api/trace/:id', async (req, res) => {
    try {
        const serial = req.params.id;
        const batch = await db.collection('batches').findOne({ serialNumber: serial });
        if (!batch) return res.status(404).json({ message: "Serial number not found." });
        res.json(batch);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- CONNECTION LOGIC ---

async function main() {
    try {
        // 1. Attempt connection
        const client = new MongoClient(MongoUrl);
        await client.connect();
        
        // 2. Assign the DB once connected
        db = client.db('aokRanchData');
        console.log("✅ Connected to MongoDB: aokRanchData");

        // 3. Start the server ONLY after DB is ready
        oak.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server listening on port ${port}`);
        });

    } catch (err) {
        console.error("❌ CRITICAL: Could not connect to MongoDB", err.message);
        process.exit(1); // Kill the process so Render knows it failed
    }
}

main();