
import mongoose, { CallbackError, Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

interface IUser extends Document {
  username: string,
  password: string,
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [4, "Username must be atleast 4 characters long"],
      maxlength: [30, "Username can't be longer than 30 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be atleast 8 characters long"],
      select: false,
    },
  },
  {timestamps: true}
);

// hook to hash password before saving. Manual hashing also works but with its own pros and cons.

userSchema.pre("save", async function (this: IUser, next) {
  if(!this.password || !this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch(error) {
    next(error as CallbackError);
  }
})


const contentSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    link: {
      type: String,
      required: [true, "Specifying link is required"],
      validate: {
        validator: (value: string) => validator.isURL(value),
        message: "Invalid URL format",
      },
    },
    tags: {
      type: [Schema.Types.ObjectId],
      ref: "Tag",
      default: [],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    type: {
      type: String,
      required: [true, "Type of content is required"]
    }
  },
  {timestamps: true}
);

const linkSchema = new Schema(
  {
    hash: {
      type: String,
      required: [true, "Hash is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user not provided"],
    }
  }
)


export const userModel = mongoose.model("User", userSchema);
export const contentModel = mongoose.model("Content", contentSchema);
export const linkModel = mongoose.model("Link", linkSchema); 