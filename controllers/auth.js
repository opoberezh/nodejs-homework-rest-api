const fs = require("node:fs/promises");
const path = require("node:path");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const User = require("../models/user");
const { HttpError, ctrlWrapper } = require("../helpers");
const sendEmail = require("../helpers/sendEmail");
const { token } = require("morgan");
const Jimp = require("jimp");
require("dotenv").config();
const { SECRET_KEY } = process.env;

const register = async (req, res) => {
  console.log("Request body:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    throw HttpError(400, "Email and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomUUID();
  await sendEmail ({
    to: email,
    subject: "Welcome to your Phone Book",
    html: `To confirm your registration please click on the <a href="http://localhost:3000/auth/verify/${verificationToken}">link</a>`,
    text: `To confirm your registration, pleasde open the link http://localhost:3000/auth/verify/${verificationToken}`,
  });

  const avatarURL = gravatar.url(email);
  const newUser = await User.create({
    email,
    verificationToken,
    password: hashPassword,
    avatarURL,
  });

  res.status(201).send({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(400, "Bad Request");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(400, "Bad Request");
  }
  const payload = {
    id: user._id,
  };
  if (user.verify !== true) {
    throw HttpError(401, "Your account is not verified");
  }
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.send({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;

  const user = await User.findOne({ verificationToken }).exec();

  if (user === null) {
    throw HttpError(404, "Not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.status(200).send({ message:  "Verification successful" });
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  if (!email){
    throw HttpError(400,"Missing required field email")
  }
  const user = await User.findOne({email}).exec();
  if(!user){
    throw HttpError(404,"User not found");
  }
  if(user.verify){
    throw HttpError(400,"Verification has already been passed")
  }
  const newVerificationToken = crypto.randomUUID();
  await User.findByIdAndUpdate(user._id, { verificationToken: newVerificationToken });

  await sendEmail ({
    to: email,
      subject: "Resend Verification",
      html: `To confirm your registration please click on the <a href="http://localhost:3000/auth/verify/${newVerificationToken}">link</a>`,
      text: `To confirm your registration, please open the link http://localhost:3000/auth/verify/${newVerificationToken}`,
  });
  res.status(200).send({ message:  "Verification email sent" });
}

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).send({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json({ message: "Logout success" });
};



const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { _id } = req.user;
  const validSubscriptions = ["starter", "pro", "business"];
  await User.findByIdAndUpdate(_id, { subscription });
  if (!validSubscriptions.includes(subscription)) {
    throw HttpError(400, "Invalid subscription value");
  }
  res.send({ subscription });
};

const uploadAvatar = async (req, res, next) => {
  try {
    const image = await Jimp.read(req.file.path);
    image.resize(250, 250).write(req.file.path);

    await fs.rename(
      req.file.path,
      path.join(__dirname, "..", "public/avatars", req.file.filename)
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarURL: req.file.filename },
      { new: true }
    ).exec();
    if (user === null) {
      return res.status(404).send({ massege: "User not found" });
    }

    res.send(user);
  } catch (error) {
    next(error);
  }
};

const getAvatar = async (req, res, next) => {
  const user = await User.findById(req.user.id).exec();
  if (user === null) {
    return res.status(404).send({ massege: "User not found" });
  }
  if (user.avatar === null) {
    return res.status(404).send({ message: "Avatar not found" });
  }

  res.sendFile(path.join(__dirname, "..", "public/avatars", user.avatar));
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateSubscription),
  uploadAvatar: ctrlWrapper(uploadAvatar),
  getAvatar: ctrlWrapper(getAvatar),
  verify: ctrlWrapper(verify),
  resendVerificationEmail: ctrlWrapper(resendVerificationEmail),
};
