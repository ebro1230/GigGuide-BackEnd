const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../models/newUser");
const { s3 } = require("../s3.js");
const { GetObjectCommand } = require("../s3.js");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//GET Create an endpoint to retrieve all local artists
router.get("/", (req, res) => {
  User.find({ userType: "Artist" })
    .then(async (data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      for (let i = 0; i < data.length; i++) {
        const getObjectParams = {
          Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
          Key: data[i].profilePicture,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        data[i].profilePicture = url;
      }
      for (let i = 0; i < data.length; i++) {
        const getObjectParams = {
          Bucket: process.env.AWS_BUCKET_NAME_BANNER,
          Key: data[i].bannerPicture,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        data[i].bannerPicture = url;
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

//GET Create an endpoint to retrieve a specific local artist by id
router.get("/:id", (req, res) => {
  const { id } = req.params;
  User.findById(id)
    .then(async (data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      const getObjectParamsProfile = {
        Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
        Key: data.profilePicture,
      };
      const commandProfile = new GetObjectCommand(getObjectParamsProfile);
      const urlProfile = await getSignedUrl(s3, commandProfile, {
        expiresIn: 3600,
      });
      data.profilePicture = urlProfile;
      const getObjectParamsBanner = {
        Bucket: process.env.AWS_BUCKET_NAME_BANNER,
        Key: data.bannerPicture,
      };
      const commandBanner = new GetObjectCommand(getObjectParamsBanner);
      const urlBanner = await getSignedUrl(s3, commandBanner, {
        expiresIn: 3600,
      });
      data.bannerPicture = urlBanner;
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.get("/:name/:country/:city/:genre", (req, res) => {
  let { name, country, city, genre } = req.params;
  if (name === "0") {
    name = "";
  }
  if (city === "0") {
    city = "";
  }
  if (country === "0") {
    country = "";
  }
  if (genre === "0") {
    genre = "";
  }
  User.find({
    userType: "Artist",
    name: { $regex: name },
    city: { $regex: city },
    country: { $regex: country },
    //genre: { $regex: genre },
  })
    .then(async (data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified search parameters
        return res.sendStatus(404);
      }
      for (let i = 0; i < data.length; i++) {
        const getObjectParams = {
          Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
          Key: data[i].profilePicture,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        data[i].profilePicture = url;
      }
      for (let i = 0; i < data.length; i++) {
        const getObjectParams = {
          Bucket: process.env.AWS_BUCKET_NAME_BANNER,
          Key: data[i].bannerPicture,
        };
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        data[i].bannerPicture = url;
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

module.exports = router;
