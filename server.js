require("dotenv").config();
require("./database/client");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;
const bodyParser = require("body-parser");
const userRouter = require("./router/userRouter.js");
const artists = require("./router/getLocalArtistsRouter.js");
const cors = require("cors");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
app.use(cors("*"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/user", userRouter);

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/profile-pics", express.static("./profile-pics"));
app.use("/banner-pics", express.static("./banner-pics"));

app.use("/api/artists", artists);

app.listen(PORT, () => {
  console.log(`Hello.  Listening on port ${PORT}`);
});
