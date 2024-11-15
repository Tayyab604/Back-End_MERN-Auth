import User from "../models/signupModel.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { text } from "express";

const sendVerificationEmail = async (email, token, forgotPassToken) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Use 465 for a secure connection
    secure: true, // Use `true` for port 465
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

  let subject, text;

if(token){
  subject = "Verify your email";
  text = `Click the following link to verify your email: http://localhost:7880/api/v1/verify-email/${token}`
}else if(forgotPassToken){
  subject = "Forgot Password",
  text = `Click the following link to verify your email for forgot token: http://localhost:7880/api/v1/forgot-pass/${forgotPassToken}`
}

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error Sending email: ", error);
  }
};

const verifyEmailTime = "2m";

const signup = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Provide Credentials",
      });
    }

    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(400).json({
        success: false,
        message:
          "Email already exists! If not check your email for verification.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      `${process.env.JWT_SECRET_KEY}`,
      { expiresIn: `${verifyEmailTime}` }
    );

    await sendVerificationEmail(email, token);

    return res.status(201).json({
      success: true,
      message: `User created successfully. A verification email has been sent to ${email}.`,
    });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while signing up.",
    });
  }
};



const verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;
    const decode = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`);
    const user = await User.findById(decode.id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(400).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not found.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified.",
      });
    }

    const resendtoken = jwt.sign(
      { id: user._id, email: user.email },
      `${process.env.JWT_SECRET_KEY}`,
      { expiresIn: `${verifyEmailTime}` }
    );
    const token = resendtoken;
    await sendVerificationEmail(email, token);

    return res.status(200).json({
      success: true,
      message: `A new verification email has been sent to ${email}.`,
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Provide Credentials",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Email not found!",
    });
  }

  if (!user.isVerified) {
    const signInToken = jwt.sign(
      { id: user._id, email: user.email },
      `${process.env.JWT_SECRET_KEY}`,
      { expiresIn: `${verifyEmailTime}` }
    );
    const token = signInToken;
    await sendVerificationEmail(email, token);

    return res.status(400).json({
      success: false,
      message: `Email not verified. A new verification email has been sent to ${email}.`,
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password!",
    });
  }

  const userAuthToken = jwt.sign(
    { id: user._id, email: user.email },
    `${process.env.JWT_SECRET_KEY}`,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    success: true,
    message: "Login Successful",
  });
};

const passwordChange = async (req, res) =>{
try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    const decode = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`);
    const user = await User.findById(decode.id); //the id that we provided when creating a new user
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Provide new passwords.",
      });
    }
    
    if(password !== confirmPassword){
      return res.status(400).json({
        success: false,
        message: "Passwords do not match!",
      })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been changed successfully.",
    });
  } catch (error) {
    console.error("Error reseting password:", error);
    res.status(400).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if(!email){
    return res.status(400).json({
      success: false,
      message: "Enter Email!"
    })
  }

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Email not found!",
    });
  }

  const forgotPassToken = jwt.sign(
    { id: user._id, },
    `${process.env.JWT_SECRET_KEY}`,
    { expiresIn: `${verifyEmailTime}` }
  );
  await sendVerificationEmail(email, null, forgotPassToken);

  return res.status(201).json({
    success: true,
    message: `Forgot password email has been sent to ${email}.`,
  });
};

export { signup, signin, verifyEmail, resendVerificationEmail, forgotPassword, passwordChange };
