require("dotenv").config();
require("./database/client");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;
const bodyParser = require("body-parser");
const userRouter = require("./router/userRouter.js");
const artists = require("./router/getLocalArtistsRouter.js");
const requestEndpoint = `https://cors-anywhere.herokuapp.com/http://ip-api.com/json/?fields=status,message,country,countryCode,city`;
const cors = require("cors");
const corsOptions = {
  origin: "http://localhost:8000/getIP",
};

app.use(cors("*"));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api/user", userRouter);

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/profile-pics", express.static("./profile-pics"));
app.use("/banner-pics", express.static("./banner-pics"));

app.use("/api/artists", artists);

app.get("/getIP", cors(), async (req, res) => {
  const fetchOptions = {
    method: "GET",
  };
  const response = await fetch(requestEndpoint, fetchOptions);
  if (response) {
    console.log("Success");
    console.log(response);
    const jsonResponse = await response.json();
    res.json(jsonResponse);
  } else {
    console.log(response);
  }
});

app.listen(PORT, () => {
  console.log(`Hello.  Listening on port ${PORT}`);
});
