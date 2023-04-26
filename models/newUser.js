const mongoose = require("mongoose");

const newUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: false,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    favouriteGenre: {
      type: Array,
    },
    profilePicture: {
      type: String,
    },
    bannerPicture: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    favouriteArtists: {
      type: Array,
    },
    favouriteSongs: {
      type: Array,
    },
    plannedEvents: {
      type: Array,
    },
    userType: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
    genre: {
      type: String,
      default: "",
    },
    songsList: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
          minutes: {
            type: String,
          },
          seconds: {
            type: String,
          },
          url: {
            type: String,
          },
          releaseDate: {
            type: Date,
          },
          album: {
            type: String,
          },
        },
      ],
      default: [],
    },
    upcomingEvents: {
      type: [
        {
          artistId: {
            type: String,
          },
          profilePicture: {
            type: String,
          },
          artistName: {
            type: String,
          },
          eventName: {
            type: String,
          },
          date: {
            type: String,
          },
          startTime: {
            type: String,
          },
          info: {
            type: String,
          },
          street: {
            type: String,
          },
          city: {
            type: String,
          },
          state: {
            type: String,
          },
          country: {
            type: String,
          },
          postalCode: {
            type: String,
          },
          address: {
            type: String,
          },
          artistType: {
            type: String,
          },
        },
      ],
      default: [],
    },
    members: {
      type: [String],
      default: undefined,
    },
    bandUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", newUserSchema);
module.exports = User;
