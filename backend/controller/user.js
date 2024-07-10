const express = require("express");
const path = require("path");
const User = require("../model/user");
// const OTP = require("../model/userOtp");
// const UnverifiedUser = require("../model/unverifiedUserOtp");
const { upload } = require("../multer");
const ErrorHandler = require("../utilis/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utilis/sendMail");
const router = express.Router();
const sendToken = require("../utilis/jwtToken");
const { isAuthenticated } = require("../middleware/auth");
// const otpGenerator = require("otp-generator");

// create user
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const user = {
      name: name,
      email: email,
      password: password,
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:3000/user/activation/${activationToken}`;
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// //For OTP
// router.post("/create-user", async (req, res, next) => {
//   try {
//     const { name, email, password, duration } = req.body;

//     // Check if the user already exists in the verified users collection
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return next(new ErrorHandler("User already exists", 400));
//     }

//     // Check if the user already exists in the unverified users collection
//     const unverifiedUserExists = await UnverifiedUser.findOne({ email });
//     if (unverifiedUserExists) {
//       await UnverifiedUser.deleteOne({ email });
//     }

//     // Generate OTP and send it via email
//     const generatedOtp = Math.floor(Math.random() * 1000000);

//     try {
//       await sendMail({
//         email,
//         subject: "Verify your new Raregem account",
//         message: `<p>To verify your email address, please use the following One Time Password (OTP): </p>
//                   <p style="color:tomato; font-size:25px; letter-spacing:2px;"><b>${generatedOtp}</b></p>
//                   <p>This code expires in ${duration} hour(s).</p>`,
//       });
//     } catch (error) {
//       return next(new ErrorHandler("Failed to send OTP email", 500));
//     }

//     // Save the unverified user and OTP to the database
//     const newUnverifiedUser = new UnverifiedUser({
//       name,
//       email,
//       password,
//       otp: generatedOtp,
//     });
//     await newUnverifiedUser.save();

//     res.status(201).json({
//       success: true,
//       message: `We have sent a One Time Password (OTP) to ${email}`,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

// router.post("/verify-user", async (req, res, next) => {
//   const { email, otp } = req.body;
//   console.log(`Verifying OTP: ${otp} for Email: ${email}`);

//   try {
//     // Find the unverified user and validate the OTP
//     const unverifiedUser = await UnverifiedUser.findOne({ email, otp });
//     console.log(
//       `OTP from database: ${unverifiedUser ? unverifiedUser.otp : "not found"}`
//     ); // Log the OTP from the database

//     if (!unverifiedUser) {
//       return next(new ErrorHandler("Invalid OTP", 400));
//     }

//     // Create new user
//     const newUser = new User({
//       name: unverifiedUser.name,
//       email: unverifiedUser.email,
//       password: unverifiedUser.password,
//     });
//     await newUser.save();

//     // Remove the unverified user record
//     await UnverifiedUser.deleteOne({ email });

//     res.status(201).json({
//       message: "Account successfully created. Please login to continue.",
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

//Forgot password
router.post("/forgot-password", async (req, res, next) => {
  const { email } = req.body;
  const user = {
    name: name,
    email: email,
    password: password,
  };
  try {
    const generateOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    await sendMail({
      email: user.email,
      subject: "Verify your new Raregem account",
      message: `<p>To verify your email address, please use the following One Time Password (OTP): </p> <p style="color:tomato; font-size:25px; letter-spacing:2px;"><b>${generatedOTP}</b> for</p><p>This code expires in ${duration} hour(s).</p>`,
    });
    if (sendMail.messageId) {
      ssss;
      let user = await User.findOneAndUpdate(
        { email },
        { otp: generateOtp },
        { new: true }
      );
      if (!user) {
      }
      return next(new ErrorHandler("User does not exist", 400));
    }
    res.status(201).json({
      success: true,
      message: `<p>To continue, complete this verification step. We have sent  One Time Password (OTP): </p> <p style="color:tomato; font-size:25px; letter-spacing:2px;"><b>${generateOtp}</b> to the email ${user.email}</p><p>Please enter it below.</p>`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// // update user info
// router.put(
//   "/update-user-info",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password, phoneNumber, name } = req.body;

//       const user = await User.findOne({ email }).select("+password");

//       if (!user) {
//         return next(new ErrorHandler("User not found", 400));
//       }

//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Please provide the correct information", 400)
//         );
//       }

//       user.name = name;
//       user.email = email;
//       user.phoneNumber = phoneNumber;

//       await user.save();

//       res.status(201).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update user avatar
// router.put(
//   "/update-avatar",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       let existsUser = await User.findById(req.user.id);
//       if (req.body.avatar !== "") {
//         const imageId = existsUser.avatar.public_id;

//         await cloudinary.v2.uploader.destroy(imageId);

//         const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//           folder: "avatars",
//           width: 150,
//         });

//         existsUser.avatar = {
//           public_id: myCloud.public_id,
//           url: myCloud.secure_url,
//         };
//       }

//       await existsUser.save();

//       res.status(200).json({
//         success: true,
//         user: existsUser,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update user addresses
// router.put(
//   "/update-user-addresses",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.user.id);

//       const sameTypeAddress = user.addresses.find(
//         (address) => address.addressType === req.body.addressType
//       );
//       if (sameTypeAddress) {
//         return next(
//           new ErrorHandler(`${req.body.addressType} address already exists`)
//         );
//       }

//       const existsAddress = user.addresses.find(
//         (address) => address._id === req.body._id
//       );

//       if (existsAddress) {
//         Object.assign(existsAddress, req.body);
//       } else {
//         // add the new address to the array
//         user.addresses.push(req.body);
//       }

//       await user.save();

//       res.status(200).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // delete user address
// router.delete(
//   "/delete-user-address/:id",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const userId = req.user._id;
//       const addressId = req.params.id;

//       await User.updateOne(
//         {
//           _id: userId,
//         },
//         { $pull: { addresses: { _id: addressId } } }
//       );

//       const user = await User.findById(userId);

//       res.status(200).json({ success: true, user });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update user password
// router.put(
//   "/update-user-password",
//   isAuthenticated,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.user.id).select("+password");

//       const isPasswordMatched = await user.comparePassword(
//         req.body.oldPassword
//       );

//       if (!isPasswordMatched) {
//         return next(new ErrorHandler("Old password is incorrect!", 400));
//       }

//       if (req.body.newPassword !== req.body.confirmPassword) {
//         return next(
//           new ErrorHandler("Password doesn't matched with each other!", 400)
//         );
//       }
//       user.password = req.body.newPassword;

//       await user.save();

//       res.status(200).json({
//         success: true,
//         message: "Password updated successfully!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // find user infoormation with the userId
// router.get(
//   "/user-info/:id",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.params.id);

//       res.status(201).json({
//         success: true,
//         user,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // all users --- for admin
// router.get(
//   "/admin-all-users",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const users = await User.find().sort({
//         createdAt: -1,
//       });
//       res.status(201).json({
//         success: true,
//         users,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // delete users --- admin
// router.delete(
//   "/delete-user/:id",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const user = await User.findById(req.params.id);

//       if (!user) {
//         return next(
//           new ErrorHandler("User is not available with this id", 400)
//         );
//       }

//       const imageId = user.avatar.public_id;

//       await cloudinary.v2.uploader.destroy(imageId);

//       await User.findByIdAndDelete(req.params.id);

//       res.status(201).json({
//         success: true,
//         message: "User deleted successfully!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

module.exports = router;
