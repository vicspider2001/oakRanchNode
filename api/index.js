const express = require('express');
const serverless = require('serverless-http');
const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

dotenv.config();

const footynz = express();
const MongoUrl = process.env.MongoOnline;
let cachedClient = null;
let cachedDb = null;

// Middleware
footynz.use(express.json());
footynz.use(express.urlencoded({ extended: true }));

// FIX: Remove the trailing slash from origin and fix double semicolon
footynz.use(cors({
    origin: "https://oakranchfarm.netlify.app", 
    methods: ["GET", "POST"],
    credentials: true
}));

// --- DATABASE CONNECTION HELPER ---
async function connectDB() {
    // Reuse connection to prevent 504 timeouts on Vercel
    if (cachedDb) return cachedDb;

    if (!cachedClient) {
        cachedClient = new MongoClient(MongoUrl, {
            connectTimeoutMS: 10000, // Give up after 10s
            serverSelectionTimeoutMS: 10000
        });
        await cachedClient.connect();
    }

    cachedDb = cachedClient.db('aokRanchData');
    return cachedDb;
}

// --- ROUTES ---

footynz.get('/', (req, res) => {
    res.send("Welcome to Oak Ranch Farm - Farm Api Active");
});

// 1. GET ALL PRODUCE
footynz.get('/api/produce', async (req, res) => {
    try {
        const database = await connectDB();
        const result = await database.collection('produce').find().toArray();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Error fetching harvest data" });
    }
});

// 2. GET SINGLE PRODUCT BY ID
footynz.get('/api/produce/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const id = req.params.id;
        
        // Ensure ID is valid format before querying
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const result = await database.collection('produce').findOne({ _id: new ObjectId(id) });
        if (!result) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Database Error" });
    }
});

// 3. GET TRACEABILITY DATA
footynz.get('/api/trace/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const serial = req.params.id;
        const batch = await database.collection('batches').findOne({ serialNumber: serial });

        if (!batch) {
            return res.status(404).json({ message: "Serial number not found." });
        }
        res.json(batch);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// --- VERCEL EXPORT ---
const handler = serverless(footynz);

module.exports = async (req, res) => {
    try {
        await connectDB();
        return await handler(req, res);
    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).send("Database Connection Failed");
    }
};