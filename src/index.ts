
import express from "express";
import connectDB from "./db";
import { contentModel, linkModel, userModel } from "./schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userMiddleware from "./userMiddleware";
import { random } from "./utils";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors())
app.use(express.json());

connectDB();

//first-time user.
app.post("/api/v1/signup", async (req, res): Promise<void> => {

  const { username, password } = req.body;

  try {
    if(!username || !password) {
      res.status(400).json({
        message: "Username and password required"
      });
      return;
    }

    const existingUser = await userModel.findOne({ username });
    if(existingUser) {
      res.status(403).json({ message: "User already exists with the given username" });
      return;
    }

    const user = await userModel.create({
      username,
      password,
    })

    const jwtSeceret = process.env.JWT_SECERET;
    if(!jwtSeceret) {
      throw new Error("JWT_SECERET is not defined, check environment variables");
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username }, 
      jwtSeceret,
      { expiresIn : "7d"}
    );

    res.status(200).json({
      message: "User created successfully",
      token,
      user: { _id: user._id, username: user.username},
    });
  } catch (error) {
    res.json({ message: "Unable to create user at the moment", error: `${error}`});
  }
});


//not first-time user.
app.post("/api/v1/signin", async (req, res): Promise<void> => {

  try {

    const { username, password } = req.body;
    if(!username || !password) {
      res.status(400).json({ message: "Username and password are required"})
      return;
    }

    const user = await userModel.findOne({ username }).select("+password");
    if(!user) {
      res.status(401).json({ message: "Unable to find user with given username" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
      res.status(401).json({ message: "Invalid Password"});
      return;
    }

    const jwtSeceret = process.env.JWT_SECERET;
    if(!jwtSeceret) {
      throw new Error("Unable to find JWT_SECERET in environment variables");
    }


    const token = jwt.sign(
      { _id: user._id, username: user.username },
      jwtSeceret, 
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "SignIn successfull",
      token,
      user: { _id: user._id, username: user.username },
    });

  } catch(error) {
    res.json({ message: "Unable to sigin at the moment", error: `${error}` })
  }

});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  const { type, link, title, tags } = req.body;

  // userMiddleware gives req.user, but typescript doesn't know. So it starts to shout.
  // It is better to let typescript know about req.user than asking it to ignore. Going with quick fix for now. 
  // @ts-ignore
  const user = req.user;

  try {
    const data = await contentModel.create({
      type,
      link,
      title,
      tags,
      user: user._id 
    })
    res.status(200).json({
      message: "Data added successfully!"
    })
  } catch(error) {
    res.status(400).json({
      message: "Unable to post data at this moment",
      error: `${error}`,
    })
  }

})

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user._id;
    const data = await contentModel.find({user: userId });
    res.status(200).json({ data })
  } catch(error) {
    res.status(500).json({
      message: "Unable to fetch messages at this moment",
      error: `${error}`
    })
  }
})

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const _id = req.body._id;
    // @ts-ignore
    const user_id = req.user._id;
    console.log(user_id);
    const data = await contentModel.deleteOne({_id: _id, user: user_id});
    res.status(200).json({
      message: "Data removed successfully"
    })
  } catch(error) {
    res.status(500).json({
      message: `Internal server error ${error}`
    })
  }
})

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {

  try {
    const share = req.body.share;
    if(share) {
      const hash = random(10);
      await linkModel.create(
        {
          hash: hash,
          // @ts-ignore
          user: req.user._id,
        }
      )
      res.json({
        message: "Success",
        hash,
        // @ts-ignore
        user: req.user._id,
      })
    }
    else {
      await linkModel.deleteOne(
        {
          // @ts-ignore
          user: req.user._id
        }
      )
      res.json({
        message: "Updated Shareable link"
      })
    }

  }
  catch(error) {
    res.json({
      message: "Unable to update shareable link",
      error: `${error}`
    })
  }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const link = req.params.shareLink;

  try{
    const userLink = await linkModel.findOne({ hash: link });
    if(!userLink) {
      res.json({
        message: "Link not found"
      })
      return;
    }
    const user = await userModel.findOne({ _id: userLink.user });
    if(!user) {
      res.json({
        message: "This shouldn't happen ideally, user not found",
      })
      return;
    }
    const data = await contentModel.find({ user: user._id })
    res.json({
      message: "Success",
      data:  data,
    })
  }
  catch(error) {
    res.json({
      message: "Error encountered",
      error: `${error}`,
    })
  }
})



app.listen(PORT, () => {
  console.log("Listening on PORT: ", PORT)
})