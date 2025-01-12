const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const path = require("node:path");
const contactsRouter = require("./routes/api/contacts");
const authRouter = require("./routes/api/auth");
require("dotenv").config();

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/avatars", express.static(path.join(__dirname, "public", "avatars")));

app.use("/users", authRouter);
app.use("/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;
