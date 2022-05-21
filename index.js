const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@innovative-car-co.ubt2x.mongodb.net/?retryWrites=true&w=majority`;

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(cors());
app.use(express.json());

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const serviceCollection = client
      .db("innovativeCarCo")
      .collection("services");
    const usersCollection = client.db("innovativeCarCo").collection("users");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await usersCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    app.get("/services", verifyJWT, async (req, res) => {
      const services = await serviceCollection.find({}).toArray();
      res.send(services);
    });

    app.get("/services/:id", verifyJWT, async (req, res) => {
      const services = await serviceCollection.findOne({
        _id: ObjectId(req.params.id),
      });
      res.send(services);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Innovative Car Co is Calling You!");
});

app.listen(port, () => {
  console.log(`Innovative Car Co. app listening on port ${port}`);
});
