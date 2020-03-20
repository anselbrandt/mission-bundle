const express = require("express");
const socketIO = require("socket.io");
const { Client } = require("pg");
const path = require("path");
const publicIp = require("public-ip");
const fetch = require("node-fetch");
const fruitname = require("fruitname");
require("dotenv").config();
const api_key = process.env.API_KEY;

const PORT = process.env.PORT || 4000;

const server = express()
  .use(express.static(path.join(__dirname, "client/build")))
  .get("*", (req, res) => {
    res.sendFile(path.join(__dirname + "/client/build/index.html"));
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // change to true in prod
    rejectUnauthorized: false
  }
});

pg.connect(error => {
  if (error) {
    console.log("Failed to connect to db");
  } else {
    console.log("Connected to db");
  }
});

const clients = [];

fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${api_key}`, {
  method: "POST",
  body: JSON.stringify({ considerIp: true })
})
  .then(response => response.json())
  .then(async response => {
    const serverIP = await publicIp.v4();
    const serverLocation = {
      name: "Server",
      id: "server",
      ip: serverIP,
      client: "server",
      location: response.location
    };
    console.log(serverLocation);
    clients.push(serverLocation);
  });

io.on("connection", socket => {
  const time = Date.now();
  const name = fruitname();
  const id = socket.id;
  const ip = socket.handshake.headers["x-forwarded-for"];
  const address = socket.handshake.address;
  const userAgent = socket.handshake.headers["user-agent"];
  if (socket.handshake.headers["cookie"]) {
    const cookie = socket.handshake.headers["cookie"];
    const text = "SELECT * FROM users WHERE useridandtime LIKE $1;";
    const values = [cookie.replace("io=", "") + "%"];
    console.log(values);
    pg.query(text, values)
      .then(response => {
        console.log(response.rows);
        io.emit("server", JSON.stringify(response.rows));
      })
      .catch(error => console.log(error));
  } else {
    const text =
      "INSERT INTO users(useridandtime, username) VALUES($1, $2) RETURNING *";
    const useridandtime = id + "#" + time;
    const values = [useridandtime, name];
    pg.query(text, values)
      .then(response => {
        console.log(response.rows);
        io.emit("server", JSON.stringify(response.rows));
      })
      .catch(error => console.log(error));
  }

  const client = {
    name: name,
    id: id,
    ip: ip,
    address: address,
    userAgent: userAgent
  };
  clients.push(client);

  socket.on("identity", data => {
    const identity = JSON.parse(data);
    clients[clients.findIndex(client => client.id === id)].client =
      identity.client;
    clients[clients.findIndex(client => client.id === id)].location =
      identity.location;
    io.emit("connected", JSON.stringify(clients));
    // console.log(
    //   "connected",
    //   clients[clients.findIndex(client => client.id === id)]
    // );
  });

  socket.on("disconnect", () => {
    const disconnected = clients[clients.findIndex(client => client.id === id)];
    io.emit("disconnected", JSON.stringify(disconnected));
    console.log("disconnected", {
      name: disconnected.name,
      id: disconnected.id
    });
    clients.splice(
      clients.findIndex(client => client.id === id),
      1
    );
    io.emit("connected", JSON.stringify(clients));
  });

  socket.on("web", data => {
    io.emit("web", data);
  });
  socket.on("pi data", data => {
    io.emit("pi data", data);
  });
  socket.on("pi message", data => {
    io.emit("pi message", data);
  });
});

setInterval(() => io.emit("time", JSON.stringify(new Date())), 1000);
