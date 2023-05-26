const express = require("express");
const router = express.Router();
require("dotenv").config();
const multer = require("multer");
const { checkFileType } = require("../utils");
const User = require("../models/newUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/auth");
const secret = process.env.MY_SECRET;
const { s3 } = require("../s3.js");
const { PutObjectCommand } = require("../s3.js");
const { GetObjectCommand } = require("../s3.js");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const generateToken = (data) => {
  return jwt.sign(data, secret, { expiresIn: "1800s" }); //token expires in 30 minutes
};

//setting multer for profile pics
const storage = multer.memoryStorage();
// multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === "profile") {
//       cb(null, "./profile-pics");
//     }
//     if (file.fieldname === "banner") {
//       cb(null, "./banner-pics");
//     }
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

router.post(
  "/signup",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      name,
      username,
      email,
      password,
      city,
      country,
      genre,
      age,
      favouriteGenre,
      favouriteArtists,
      favouriteSongs,
      planedEvents,
      userType,
      members,
      bandUrl,
    } = req.body;
    User.findOne({ username }).then((user) => {
      if (user) {
        console.log(user);
        return res.status(404).json({ message: "username already exists" });
      }
    });
    User.findOne({ email }).then((email) => {
      if (email) {
        console.log(email);
        return res
          .status(404)
          .json({ message: "email already associated with an account" });
      }
    });
    if (req.files.profile && req.files.banner) {
      const profilePicture = Date.now() + req.files.profile[0].originalname;
      const paramsProfile = {
        Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
        Key: req.files.profile[0].originalname,
        Body: req.files.profile[0].buffer,
        ContentType: req.files.profile[0].mimetype,
      };
      const commandProfile = new PutObjectCommand(paramsProfile);
      await s3.send(commandProfile);
      const bannerPicture = Date.now() + req.files.banner[0].originalname;
      const paramsBanner = {
        Bucket: process.env.AWS_BUCKET_NAME_BANNER,
        Key: req.files.banner[0].originalname,
        Body: req.files.banner[0].buffer,
        ContentType: req.files.banner[0].mimetype,
      };
      const commandBanner = new PutObjectCommand(paramsBanner);
      await s3.send(commandBanner);
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          User.create({
            name,
            username,
            email,
            password: hashedPassword,
            city,
            country,
            genre,
            age,
            favouriteGenre,
            favouriteArtists,
            favouriteSongs,
            planedEvents,
            userType,
            members,
            bandUrl,
            profilePicture,
            bannerPicture,
          })
            .then((data) => res.status(200).json(data))
            .catch((e) => console.log(e.message));
        })
        .catch((e) => console.log(e.message));
    } else if (req.files.profile) {
      const profilePicture = Date.now() + req.files.profile[0].originalname;
      const paramsProfile = {
        Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
        Key: req.files.profile[0].originalname,
        Body: req.files.profile[0].buffer,
        ContentType: req.files.profile[0].mimetype,
      };
      const commandProfile = new PutObjectCommand(paramsProfile);
      await s3.send(commandProfile);
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          User.create({
            name,
            username,
            email,
            password: hashedPassword,
            city,
            country,
            genre,
            age,
            favouriteGenre,
            favouriteArtists,
            favouriteSongs,
            planedEvents,
            userType,
            members,
            bandUrl,
            profilePicture,
          })
            .then((data) => res.status(200).json(data))
            .catch((e) => console.log(e.message));
        })
        .catch((e) => console.log(e.message));
    } else if (req.files.banner) {
      const bannerPicture = Date.now() + req.files.banner[0].originalname;
      const paramsBanner = {
        Bucket: process.env.AWS_BUCKET_NAME_BANNER,
        Key: req.files.banner[0].originalname,
        Body: req.files.banner[0].buffer,
        ContentType: req.files.banner[0].mimetype,
      };
      const commandBanner = new PutObjectCommand(paramsBanner);
      await s3.send(commandBanner);
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          User.create({
            name,
            username,
            email,
            password: hashedPassword,
            city,
            country,
            genre,
            age,
            favouriteGenre,
            favouriteArtists,
            favouriteSongs,
            planedEvents,
            userType,
            members,
            bandUrl,
            bannerPicture,
          })
            .then((data) => res.status(200).json(data))
            .catch((e) => console.log(e.message));
        })
        .catch((e) => console.log(e.message));
    } else {
      bcrypt
        .hash(password, 10)
        .then((hashedPassword) => {
          User.create({
            name,
            username,
            email,
            password: hashedPassword,
            city,
            country,
            age,
            favouriteGenre,
            favouriteArtists,
            favouriteSongs,
            planedEvents,
            userType,
            genre,
            members,
            bandUrl,
          })
            .then((data) => res.status(200).json(data))
            .catch((e) => console.log(e.message));
        })
        .catch((e) => console.log(e.message));
    }
  }
);

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username }).then((user) => {
    if (!user) {
      return res.status(404).send("username not found");
    }
    bcrypt.compare(password, user.password).then((validPassword) => {
      if (!validPassword) {
        return res.status(404).send("password incorrect");
      }
      const token = generateToken({ username: user.username });
      const response = user;
      res.json({ token, response });
    });
  });
});

router.put(
  "/:id",

  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      username,
      password,
      genre,
      bio,
      city,
      country,
      age,
      favouriteGenre,
      favouriteArtists,
      favouriteSongs,
      planedEvents,
      members,
      bandUrl,
      email,
    } = req.body;

    if (req.files.profile && req.files.banner) {
      const profilePicture = Date.now() + req.files.profile[0].originalname;
      const paramsProfile = {
        Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
        Key: req.files.profile[0].originalname,
        Body: req.files.profile[0].buffer,
        ContentType: req.files.profile[0].mimetype,
      };
      const commandProfile = new PutObjectCommand(paramsProfile);
      await s3.send(commandProfile);
      const bannerPicture = Date.now() + req.files.banner[0].originalname;
      const paramsBanner = {
        Bucket: process.env.AWS_BUCKET_NAME_BANNER,
        Key: req.files.banner[0].originalname,
        Body: req.files.banner[0].buffer,
        ContentType: req.files.banner[0].mimetype,
      };
      const commandBanner = new PutObjectCommand(paramsBanner);
      await s3.send(commandBanner);
      //bcrypt.hash(password, 10).then((hashedPassword) => {
      User.findByIdAndUpdate(
        id,
        {
          name,
          username,
          email,
          password /* : hashedPassword */,
          age,
          favouriteGenre,
          favouriteArtists,
          favouriteSongs,
          planedEvents,
          city,
          country,
          genre,
          bio,
          members,
          bandUrl,
          profilePicture,
          bannerPicture,
        },
        { new: true }
      )
        .then((data) => {
          if (!data) {
            // Send 404 if no artist is found with the specified _id
            return res.sendStatus(404);
          }
          res.json(data);
        })
        .catch((err) => {
          console.log(err.message);
          res.sendStatus(500);
        })
        .catch((e) => console.log(e.message));
      //});
    } else if (req.files.profile) {
      console.log(req.files.profile[0]);
      const profilePicture = Date.now() + req.files.profile[0].originalname;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
        Key: profilePicture,
        Body: req.files.profile[0].buffer,
        ContentType: req.files.profile[0].mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
      //bcrypt.hash(password, 10).then((hashedPassword) => {
      User.findByIdAndUpdate(
        id,
        {
          name,
          username,
          email,
          password /* : hashedPassword */,
          age,
          favouriteGenre,
          favouriteArtists,
          favouriteSongs,
          planedEvents,
          city,
          country,
          genre,
          bio,
          members,
          bandUrl,
          profilePicture,
        },
        { new: true }
      )
        .then((data) => {
          if (!data) {
            // Send 404 if no artist is found with the specified _id
            return res.sendStatus(404);
          }
          res.json(data);
        })
        .catch((err) => {
          console.log(err.message);
          res.sendStatus(500);
        })
        .catch((e) => console.log(e.message));
      // });
    } else if (req.files.banner) {
      const bannerPicture = Date.now() + req.files.banner[0].originalname;
      const paramsBanner = {
        Bucket: process.env.AWS_BUCKET_NAME_BANNER,
        Key: req.files.banner[0].originalname,
        Body: req.files.banner[0].buffer,
        ContentType: req.files.banner[0].mimetype,
      };
      const commandBanner = new PutObjectCommand(paramsBanner);
      await s3.send(commandBanner);

      //bcrypt.hash(password, 10).then((hashedPassword) => {
      User.findByIdAndUpdate(
        id,
        {
          name,
          username,
          email,
          password /* : hashedPassword */,
          age,
          favouriteGenre,
          favouriteArtists,
          favouriteSongs,
          planedEvents,
          city,
          country,
          genre,
          bio,
          members,
          bandUrl,
          bannerPicture,
        },
        { new: true }
      )
        .then((data) => {
          if (!data) {
            // Send 404 if no artist is found with the specified _id
            return res.sendStatus(404);
          }
          res.json(data);
        })
        .catch((err) => {
          console.log(err.message);
          res.sendStatus(500);
        })
        .catch((e) => console.log(e.message));
      // });
    } else {
      //bcrypt.hash(password, 10).then((hashedPassword) => {
      User.findByIdAndUpdate(
        id,
        {
          name,
          username,
          email,
          password /* : hashedPassword */,
          age,
          favouriteGenre,
          favouriteArtists,
          favouriteSongs,
          planedEvents,
          city,
          country,
          genre,
          bio,
          members,
          bandUrl,
        },
        { new: true }
      )
        .then((data) => {
          if (!data) {
            // Send 404 if no artist is found with the specified _id
            return res.sendStatus(404);
          }
          res.json(data);
        })
        .catch((err) => {
          console.log(err.message);
          res.sendStatus(500);
        })
        .catch((e) => console.log(e.message));
      //});
    }
  }
);

router.put("/:id/upcomingEvent", (req, res) => {
  const { id } = req.params;
  const {
    artistId,
    profilePicture,
    artistName,
    eventName,
    date,
    startTime,
    info,
    street,
    city,
    state,
    country,
    postalCode,
    address,
    artistType,
  } = req.body;
  const upcomingEvent = {
    artistId: artistId,
    profilePicture: profilePicture,
    artistName: artistName,
    eventName: eventName,
    date: date,
    startTime: startTime,
    info: info,
    street: street,
    city: city,
    state: state,
    country: country,
    postalCode: postalCode,
    address: address,
    artistType: artistType,
  };
  User.findByIdAndUpdate(
    id,
    { $push: { upcomingEvents: upcomingEvent } },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.put("/:id/song", (req, res) => {
  const { id } = req.params;
  const { name, minutes, seconds, url, releaseDate, album } = req.body;
  const song = {
    name: name,
    minutes: minutes,
    seconds: seconds,
    url: url,
    releaseDate: releaseDate,
    album: album,
  };
  User.findByIdAndUpdate(id, { $push: { songsList: song } }, { new: true })
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log("Didn't receive request for song with id", id);
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.put("/:id/song/:songId", (req, res) => {
  const { id, songId } = req.params;
  const { name, duration, url, releaseDate, album } = req.body;
  User.updateOne(
    { _id: id, "songsList._id": songId },
    { $set: { "songsList.$": { name, duration, url, releaseDate, album } } },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.put("/:id/upcomingEvent/:eventId", (req, res) => {
  const { id, eventId } = req.params;
  const {
    artistId,
    profilePicture,
    artistName,
    eventName,
    date,
    startTime,
    info,
    street,
    city,
    state,
    country,
    postalCode,
    address,
    artistType,
  } = req.body;
  User.updateOne(
    { _id: id, "upcomingEvents._id": eventId },
    {
      $set: {
        "upcomingEvents.$": {
          artistId,
          profilePicture,
          artistName,
          eventName,
          date,
          startTime,
          info,
          street,
          city,
          state,
          country,
          postalCode,
          address,
          artistType,
        },
      },
    },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});
//CREATING OR UPDATING BIOGRAPHY
router.put("/:id/biography", (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;
  console.log(req.body);
  User.updateOne(
    { _id: id },
    {
      $set: {
        bio: bio,
      },
    },
    { upsert: true, new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.put("/:id/faveArtist", (req, res) => {
  const { id } = req.params;
  const { favouriteArtists } = req.body;

  User.findByIdAndUpdate(
    id,
    {
      favouriteArtists,
    },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.put("/:id/plannedEvents", (req, res) => {
  const { id } = req.params;
  const { plannedEvents } = req.body;

  User.findByIdAndUpdate(
    id,
    {
      plannedEvents,
    },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.json(data);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

// DELETE Create an endpoint that DELETES an existing local artist in artist collection
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  User.findByIdAndDelete(id)
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.delete("/:id/song/:songid", (req, res) => {
  const id = req.params.id;
  const songId = req.params.songid;
  User.updateOne(
    { _id: id },
    { $pull: { songsList: { _id: songId } } },
    { safe: true, multi: false }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.delete("/:id/upcomingEvent/:eventid", (req, res) => {
  const id = req.params.id;
  const eventId = req.params.eventid;
  User.updateOne(
    { _id: id },
    { $pull: { upcomingEvents: { _id: eventId } } },
    { safe: true, multi: false }
  )
    .then((data) => {
      if (!data) {
        // Send 404 if no artist is found with the specified _id
        return res.sendStatus(404);
      }
      res.sendStatus(204);
    })
    .catch((err) => {
      console.log(err.message);
      res.sendStatus(500);
    });
});

router.get("/:id", (req, res) => {
  const id = req.params.id;
  User.findById(id)
    .then(async (user) => {
      if (!user) {
        return res.status(404).send("User not found!");
      } else {
        if (user.profilePicture) {
          const getObjectParamsProfile = {
            Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
            Key: user.profilePicture,
          };
          const commandProfile = new GetObjectCommand(getObjectParamsProfile);
          const urlProfile = await getSignedUrl(s3, commandProfile, {
            expiresIn: 3600,
          });
          user.profilePicture = urlProfile;
        }
        if (user.bannerPicture) {
          const getObjectParamsBanner = {
            Bucket: process.env.AWS_BUCKET_NAME_BANNER,
            Key: user.bannerPicture,
          };
          const commandBanner = new GetObjectCommand(getObjectParamsBanner);
          const urlBanner = await getSignedUrl(s3, commandBanner, {
            expiresIn: 3600,
          });
          user.bannerPicture = urlBanner;
        }
        return res.json(user);
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.sendStatus(500);
    });
});
router.get("/:username", (req, res) => {
  const username = req.params.username;
  User.findById(username)
    .then(async (user) => {
      if (!user) {
        return res.status(404).send("User not found!");
      } else {
        if (user.profilePicture) {
          const getObjectParamsProfile = {
            Bucket: process.env.AWS_BUCKET_NAME_PROFILE,
            Key: user.profilePicture,
          };
          const commandProfile = new GetObjectCommand(getObjectParamsProfile);
          const urlProfile = await getSignedUrl(s3, commandProfile, {
            expiresIn: 3600,
          });
          user.profilePicture = urlProfile;
        }
        if (user.bannerPicture) {
          const getObjectParamsBanner = {
            Bucket: process.env.AWS_BUCKET_NAME_BANNER,
            Key: user.bannerPicture,
          };
          const commandBanner = new GetObjectCommand(getObjectParamsBanner);
          const urlBanner = await getSignedUrl(s3, commandBanner, {
            expiresIn: 3600,
          });
          user.bannerPicture = urlBanner;
        }
        return res.json(user);
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.sendStatus(500);
    });
});

module.exports = router;
