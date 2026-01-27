import mongoose from "mongoose";

const spreadsheetSchema = new mongoose.Schema(
  {
    spreadsheetId: {
      type: String,
      required: true,
    },
    spreadsheetName:{
     type:String,
     required:true
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true,
      index: true, 
    },

    password: {
      type: String,
      required: true,
    },

    spreadsheets: {
      type: [spreadsheetSchema],
      default: [],
    },

    subscription: {
      tier: {
        type: String,
        enum: ["Free", "Basic", "Pro"],
        default: "Free",
      },
      invoicesUploaded: {
        type: Number,
        default: 0,
      },
      spreadsheetLimit: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1, "subscription.tier": 1 });

userSchema.index({ "spreadsheets.spreadsheetId": 1 });

const User = mongoose.model("User", userSchema);

export default User;
