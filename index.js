const express = require("express");
const socketIO = require("socket.io");
const { Client } = require("pg");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const publicIp = require("public-ip");
const fetch = require("node-fetch");
const fruitname = require("fruitname");
require("dotenv").config();
const api_key = process.env.API_KEY;

const PORT = process.env.PORT || 4000;

const server = express()
  .use((request, response, next) => {
    if (!request.headers.cookie) {
      response.cookie("wsid", uuidv4(), {
        expires: new Date(Date.now() + 9999999999),
        httpOnly: true
      });
    }
    next();
  })
  .use(express.static(path.join(__dirname, "client/build")))
  .get("*", (request, response) => {
    response.sendFile(path.join(__dirname + "/client/build/index.html"));
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server, { cookie: false });

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
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
    console.log("Server location: ", serverLocation);
    clients.push(serverLocation);
  });

io.on("connection", socket => {
  const id = socket.id;
  const ip = socket.handshake.headers["x-forwarded-for"];
  const address = socket.handshake.address;
  const userAgent = socket.handshake.headers["user-agent"];
  if (socket.handshake.headers["cookie"]) {
    const userid = socket.handshake.headers["cookie"].replace("wsid=", "");
    const text = "SELECT * FROM users WHERE useridandtime LIKE $1;";
    const values = [userid.replace("wsid=", "") + "%"];
    pg.query(text, values)
      .then(response => {
        if (response.rows.length === 0) {
          const time = Date.now();
          const name = fruitname();
          const text =
            "INSERT INTO users(useridandtime, username) VALUES($1, $2) RETURNING *";
          const useridandtime = userid + "#" + time;
          const values = [useridandtime, name];
          pg.query(text, values)
            .then(response => {
              console.log("Postgres response: ", response.rows);
              io.emit("server", JSON.stringify(response.rows));
            })
            .catch(error => console.log(error));
          const client = {
            name: name,
            id: id,
            ip: ip,
            address: address,
            userAgent: userAgent
          };
          clients.push(client);
        } else {
          const [results] = response.rows;
          const client = {
            name: results.username,
            id: id,
            ip: ip,
            address: address,
            userAgent: userAgent
          };
          clients.push(client);
        }
      })
      .catch(error => console.log(error));
  } else {
    const client = {
      name: fruitname(),
      id: id,
      ip: ip,
      address: address,
      userAgent: userAgent
    };
    clients.push(client);
  }

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
