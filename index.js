const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config({ path: ".env.local" });
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("campusmart");

    const usersCollection = db.collection("users");
    const itemsCollection = db.collection("items");

    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      try {
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.password !== password) {
          return res.status(401).json({ message: "Invalid password" });
        }

        res.cookie("userEmail", user.email, {
          httpOnly: false,
          secure: false,
          maxAge: 86400000,
          sameSite: "lax",
        });

        res.status(200).json({
          message: "Login successful",
          user: {
            email: user.email,
          },
        });
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });

    app.get("/items", async (req, res) => {
      try {
        const cursor = itemsCollection.find().sort({ createdAt: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });

    app.get("/items/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await itemsCollection.findOne(query);
        if (result) {
          res.send(result);
        } else {
          res.status(404).json({ message: "Item not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });

    app.post("/items", async (req, res) => {
      try {
        const newItem = {
          ...req.body,
          createdAt: new Date(),
        };
        const result = await itemsCollection.insertOne(newItem);
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
      }
    });
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`CampusMart server listening on port ${port}`);
});
