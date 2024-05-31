const express = require("express");
const path = require("path");
const User = require("../model/user");
const OTP = require("../model/userOtp");
// const { upload } = require("../multer");
const ErrorHandler = require("../utilis/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utilis/sendMail");
const router = express.Router();
const sendToken = require("../utilis/jwtToken");
const { isAuthenticated } = require("../middleware/auth");
const otpGenerator = require("otp-generator");

router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });
    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const username = {
      name: name,
      email: email,
      password: password,
    };

    try {
      const generatedOtp = Math.floor(Math.random() * 1000000);
      await sendMail({
        email: username.email,
        subject: "Verify your new Raregem account",
        message: `To verify your email address, please use the following One Time Password (OTP): <b>${generatedOtp}</b>. Do not share this OTP with anyone. Raregem takes your account security very seriously. Raregem Customer Service will never ask you to disclose or verify your Raregem password, OTP, credit card, or banking account number. If you receive a suspicious email with a link to update your account information, do not click on the link-instead, report the email to Raregem for investigation`,
      });
      res.status(201).json({
        success: true,
        message: `We have sent a One Time Password (OTP) to ${username.email} `,
      });
      // if (info.messageId) {
      //   let user = await User.findOneAndUpdate(
      //     {email},
      //     {password},
      //     {otp: generatedOtp},
      //     {new: true}
      //   );
      //   if (!user){
      //     return res.status
      //   }
      // }
      // // // Find the most recent OTP for the email
      // const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
      // if (response.length === 0 || otp !== response[0].otp) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "The OTP is not valid",
      //   });
      // }

      let user = await User.findOneAndUpdate(
        { email },
        { otp: generatedOtp },
        { new: true }
      );

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        otp: generatedOtp,
        email,
        password,
      });
      await user.save();
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }

    //   const filename = req.file.filename;
    //   //   const fileUrl = path.join(filename);
    // const user = {
    //   name: name,
    //   email: email,
    //   password: password,
    // };
    // const activationToken = createActivationToken(user);

    // const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    // try {
    //   await sendMail({
    //     email: user.email,
    //     subject: "Verify your new Raregem account",
    //     message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
    //   });
    //   res.status(201).json({
    //     success: true,
    //     message: `Please check your email:- ${user.email} to activate your account`,
    //   });
    // } catch (error) {
    //   return next(new ErrorHandler(error.message, 500));
    // }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
// const createActivationToken = (user) => {
//   return jwt.sign(user, process.env.ACTIVATION_SECRET, {
//     expiresIn: "5m",
//   });
// };

router.post("/verify-user", async (req, res, next) => {
  const { otp } = req.body;
  try {
    let user = await User.findOne({ otp });
    if (!user) {
      return next(new ErrorHandler("Invalid Otp", 400));
    }
    // const securePassword = await bcrypt.hash(password, 10)

    user = await User.findOneAndUpdate({ otp }, { new: true });
    // user = await User.create({
    //   name,
    //   email,
    //   password,
    // });
    // await user.save();

    return res.status(201).json({
      message: "Account Successfully created. Please login to continue",
    });
    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
// // activate user
// router.post(
//   "/activation",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { activation_token } = req.body;

//       const newUser = jwt.verify(
//         activation_token,
//         process.env.ACTIVATION_SECRET
//       );

//       if (!newUser) {
//         return next(new ErrorHandler("Invalid token", 400));
//       }
// const { name, email, password } = newUser;

// let user = await User.findOne({ email });

// if (user) {
//   return next(new ErrorHandler("User already exists", 400));
// }
// user = await User.create({
//   name,
//   email,
//   password,
// });

// sendToken(user, 201, res);
// }
//  catch (error) {
// //       return next(new ErrorHandler(error.message, 500));
// //     }
//   })
// );

// //Request new verification
// router.post("/send-otp", async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     // Check if user is already present
//     const checkUserPresent = await User.findOne({ email });
//     // If user found with provided email
//     if (checkUserPresent) {
//       return next(new ErrorHandler("User is already registered", 200));
//     }
//     const otp = otpGenerator.generate(6, {
//       upperCaseAlphabets: false,
//       lowerCaseAlphabets: false,
//       specialChars: false,
//     });
//     let result = await OTP.findOne({ otp: otp });
//     while (result) {
//       otp = otpGenerator.generate(6, {
//         upperCaseAlphabets: false,
//       });
//       result = await OTP.findOne({ otp: otp });
//     }
//     const otpPayload = { email, otp };
//     const otpBody = await OTP.create(otpPayload);
//     return next(new ErrorHandler("OTP sent successfully", otp, 200));
//     // res.status(200).json({
//     //   success: true,
//     //   message: "OTP sent successfully",
//     //   otp,
//     // });
//   } catch (error) {
//     console.log(error.message);
//     // return res.status(500).json({ success: false, error: error.message });
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

// router.post("/send-otp", async (req, res, next) => {
//   try {
//     const { email, duration = "5m" } = req.body;
//     if (!email) {
//       return next(new ErrorHandler("Please provide your email!", 400));
//     }

//     //Clearn any old record
//     await OTP.deleteOne({ email });

//     //Generate pin
//     const generatedOTP = await generateOTP();

//     const user = {
//       name: name,
//       email: email,
//       password: password,
//     };

//     //Send Email
//     await sendMail({
//       email: user.email,
//       subject: "Verify your new Raregem account",
//       message: `<p>To verify your email address, please use the following One Time Password (OTP): </p> <p style="color:tomato; font-size:25px; letter-spacing:2px;"><b>${generatedOTP}</b> for</p><p>This code expires in ${duration} hour(s).</p>`,
//     });
//     res.status(201).json({
//       success: true,
//       message: `Please check your email:- ${user.email} to activate your account`,
//     });

//     //save OTP record in the database
//     const newOTP = new OTP({
//       email,
//       otp: generatedOTP,
//       createdAt: Date.now(),
//       expiresAt: Date.now() + 3600000 * +duration,
//     });

//     const createdOTPRecord = await newOTP.save();
//     return createdOTPRecord;
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
