const express = require("express");
const app = express();

require("dotenv").config();
const PORT = process.env.PORT;
const REDIS_URL = process.env.REDIS_URL;

const redis = require("redis");
const client = redis.createClient({ url: REDIS_URL });
client.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  try {
    await client.connect();
    console.log("Redis datastore connected");
  } catch (err) {
    console.error(err);
  }
})();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const axios = require("axios");

app.get("/", async (req, res) => {
  const { key } = req.body;
  const value = await client.get(key);
  res.json(value);
});

app.post("/", async (req, res) => {
  const { key, value } = req.body;
  const response = await client.set(key, value);
  res.json(response);
});

app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const cachedPost = await client.get(`post-${id}`);
  if (cachedPost) {
    return res.json(JSON.parse(cachedPost));
  }
  const response = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  client.set(`post-${id}`, JSON.stringify(response.data), "EX", 3);
  return res.json(response.data);
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
