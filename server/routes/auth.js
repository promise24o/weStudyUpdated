const router = require("express").Router();
const { User } = require("../models/Users");
const Admin = require("../models/Admin");
const OTP = require("../models/Otp");
const { Mentors } = require("../models/Mentors");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const { auth, auth2 } = require("../middleware/auth");
var express = require("express");
var app = express();
var useragent = require("express-useragent");
const axios = require("axios");


const sendEmail = require("../utils/sendEmail");
const toTitleCase = require("../utils/helper");

const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const Donors = require("../models/Donors");
const VerificationBadge = require("../models/VerificationBadge");

app.use(useragent.express());

router.get("/", function (req, res) {
  res.send("Auth API");
});

/**
 * @swagger
 *  tags:
 *   name: Authentication
 *   description: APIs for all authenticated users
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid email address or password
 *       500:
 *         description: Internal server error
 *
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user or admin
 *           example: user@example.com
 *         password:
 *           type: string
 *           description: The password of the user or admin
 *           example: p@ssw0rd
 *     LoginResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT token for authenticated user or admin
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *             accountType:
 *               type: string
 *               enum: [user, admin]
 *               description: Type of the account
 *               example: user
 *             user:
 *               type: object
 *               $ref: '#/components/schemas/User'
 *             admin:
 *               type: object
 *               $ref: '#/components/schemas/Admin'
 *           required:
 *             - token
 *             - accountType
 *         message:
 *           type: string
 *           description: A success message
 *           example: Login Successfully!
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The ID of the user
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: The name of the user
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user
 *           example: user@example.com
 *       required:
 *         - _id
 *         - name
 *         - email
 */

router.post("/login", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });
    const admin = await Admin.findOne({ email: req.body.email });

    if (!user && !admin)
      return res.status(400).send({ message: "Invalid Email Address" });

    if (user) {
      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!validPassword)
        return res.status(400).send({ message: "Invalid Password" });

      const token = await user.generateAuthToken();

      const userWithoutPassword = await User.findOne({ _id: user._id }).select(
        "-password -token"
      );

      res.status(200).send({
        data: {
          token: token,
          accountType: "user",
          user: userWithoutPassword,
        },
        message: "Login Successfully!",
      });
    } else {
      const validPassword = await bcrypt.compare(
        req.body.password,
        admin.password
      );
      if (!validPassword)
        return res.status(400).send({ message: "Invalid Password" });

      const token = await admin.generateAuthToken();

      const adminWithoutPassword = await Admin.findOne({
        _id: admin._id,
      }).select("-password -token");

      res.status(200).send({
        data: {
          token: token,
          accountType: "admin",
          admin: adminWithoutPassword,
        },
        message: "Login Successfully!",
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
    console.error(error);
  }
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       description: User information to be registered
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message
 *                   example: Account Created Successfully! Visit Email to Verify Account
 *       400:
 *         description: Bad request - missing or invalid information provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: 'Validation error: "firstname" is required'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: A User with that email already exists!
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Internal Server Error
 *                 error:
 *                   type: object
 *                   description: Error object
 *                   example: {}
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required:
 *         - firstname
 *         - lastname
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         firstname:
 *           type: string
 *           description: User's first name
 *         lastname:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *         confirmPassword:
 *           type: string
 *           description: Confirm the user's password
 *       example:
 *         firstname: John
 *         lastname: Doe
 *         email: john.doe@example.com
 *         password: password123
 *         confirmPassword: password123
 */


async function validateHuman(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const options = {
    url: `https://www.google.com/recaptcha/api/siteverify`,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data: `secret=${secret}&response=${token}`
  };

  try {
    const response = await axios(options);
    return response.data.success;
  } catch (error) {
    return false;
  }
}


router.post("/register", async (req, res) => {
  const byPass = req.body.byPassRecaptcha; 
  try {

    if(!byPass) {
      const human = await validateHuman(req.body.recaptchaValue);

      if (!human) {
        res.status(400).send({ message: "Confirm you are a human" });
        return;
      }
    }
    
    const fullname = (req.body.firstname + " " + req.body.lastname);

    const email = req.body.email.toLowerCase();

    let user = await User.findOne({ email: req.body.email });

    if (user)
      return res.status(409).send({ message: "A User with that email already exists!" });


    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    const verificationBadge = await VerificationBadge.findOne({ title: "Acadaboo Neutral" });

    user = await new User({
      ...req.body,
      password: hashPassword,
      verification: verificationBadge._id
    }).save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp_user.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // Generate a 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpData = new OTP({ email, otp });
    await otpData.save();

    // compile the EJS template with the url variable
    let html = ejs.render(template, { otp, fullname });

    await sendEmail(user.email, "Verify Account", html);

    // Log the user in after successful registration
    const token = await user.generateAuthToken();
    const userWithoutPassword = await User.findOne({ email: email }).select("-password -token");

    res.status(201).send({
      data: {
        token: token,
        accountType: "user",
        user: userWithoutPassword,
      },
      message: "Account Created and Logged In Successfully!"
    });

  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
  }

});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Logout successful message
 *                   example: Logout successful
 *       '401':
 *         description: Unauthorized user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized user message
 *                   example: Unauthorized user
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Internal Server Error message
 *                   example: Internal Server Error
 */

// Logout user
router.post("/logout", auth, async (req, res) => {
  try {
    const user = req.user;
    user.token = null;
    user.liveFeedSettings.onlineStatus = false; // Set onlineStatus to false
    await user.save();

    res.status(200).send({ message: "Logout successful" });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Logout Mentor
router.post("/mentor-logout", async (req, res) => {
  const mentorId = req.body.id;
  try {
    // Remove the token from the mentor's document
    const mentor = await Mentors.findOne({ _id: mentorId });
    mentor.token = null;
    await mentor.save();

    res.status(200).send({ message: "Logout successful" });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Logout Admin
router.post("/admin-logout", auth2, async (req, res) => {
  const adminId = req.body.id;

  try {
    // Remove the token from the user's document
    const user = await Admin.findOne({ _id: adminId });

    user.token = null;
    await user.save();

    res.status(200).send({ message: "Logout successful" });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /auth/user/{token}:
 *   get:
 *     summary: Get user details by token
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token of the user to retrieve details for
 *     responses:
 *       200:
 *         description: User details successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found with the provided token
 *         content:
 *           application/json:
 *             example:
 *               message: User not found
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 *     security:
 *       - BearerAuth: []
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Route to get user by token
router.get("/user/:token", auth, async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token })
      .select("-password -token")
      .populate("friends.userId", "firstname lastname profilePhoto");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /auth/donor/{token}:
 *   get:
 *     summary: Get Donor by Token
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The authentication token of the donor
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful operation. Returns the donor details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DonorResponse'
 *       '404':
 *         description: Donor not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message.
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message.
 * components:
 *   schemas:
 *     DonorResponse:
 *       type: object
 *       properties:
 *         fullname:
 *           type: string
 *           description: The fullname of the donor.
 *         gender:
 *           type: string
 *           description: The gender of the donor.
 *         avatar:
 *           type: string
 *           description: The avatar of the donor.
 *         bio:
 *           type: string
 *           description: The bio of the donor.
 *         email:
 *           type: string
 *           description: The email of the donor.
 *         phone:
 *           type: string
 *           description: The phone number of the donor.
 *         city:
 *           type: string
 *           description: The city of the donor.
 *         country:
 *           type: string
 *           description: The country of the donor.
 *         linkedin:
 *           type: string
 *           description: The LinkedIn profile of the donor.
 *         twitter:
 *           type: string
 *           description: The Twitter profile of the donor.
 *         facebook:
 *           type: string
 *           description: The Facebook profile of the donor.
 *         status:
 *           type: string
 *           enum: [Pending, Active, Suspended]
 *           description: The status of the donor.
 *         rating:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               review:
 *                 type: string
 *                 description: The review of the donor.
 *               rating:
 *                 type: number
 *                 description: The rating given by the user.
 *               user:
 *                 $ref: '#/components/schemas/User'
 *                 description: The user who provided the rating.
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time when the rating was created.
 *     User:
 *       type: object
 *       properties:
 *         firstname:
 *           type: string
 *           description: The firstname of the user.
 *         lastname:
 *           type: string
 *           description: The lastname of the user.
 *         profilePhoto:
 *           type: string
 *           description: The profile photo of the user.
 */

router.get("/donor/:token", auth, async (req, res) => {
  try {
    const donor = await Donors.findOne({ token: req.params.token })
      .select("-password -token")
      .populate("rating.user", "firstname lastname profilePhoto");

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.status(200).json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /auth/mentor/{token}:
 *   get:
 *     summary: Get mentor details by token
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token of the mentor to retrieve details for
 *     responses:
 *       200:
 *         description: Mentor details successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MentorWithoutPassword'
 *       404:
 *         description: Mentor not found with the provided token
 *         content:
 *           application/json:
 *             example:
 *               message: Mentor not found
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 *     security:
 *       - BearerAuth: []
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Route to get mentor by token
router.get("/mentor/:token", auth, async (req, res) => {
  try {
    const mentor = await Mentors.findOne({ token: req.params.token })
      .select("-password -token")
      .populate("faculty")
      .populate({ path: "sessions", model: "MentorSessions" })
      .populate("rating.user", "firstname lastname profilePhoto")
      .populate({
        path: "mentees.user",
        model: "user",
        select: "firstname lastname profilePhoto education",
      })
      .select("mentees");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    res.status(200).json(mentor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get New Password for User
router.post("/request-password", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(404)
        .send({ message: "A User with this Email does not Exists!" });

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?";
    const randomPassword = Array.from(
      {
        length: 12,
      },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(randomPassword, salt);

    // Update user's password
    user.password = hashPassword;
    await user.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "reset_password.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the url variable
    let html = ejs.render(template, { password: randomPassword });

    await sendEmail(user.email, "Password Reset", html);

    res.status(201).send({ message: "New Password Sent. Check  your Email" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
  }
});

/**
 * @swagger
 * /auth/register-mentor:
 *   post:
 *     summary: Register a new mentor
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 description: Full name of the mentor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the mentor
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the mentor's account
 *             required:
 *               - fullname
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Mentor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mentor'
 *       400:
 *         description: Invalid request body or missing required fields
 *         content:
 *           application/json:
 *             example:
 *               message: Please fill in all the fields
 *       500:
 *         description: An error occurred while registering the mentor
 *         content:
 *           application/json:
 *             example:
 *               message: An error occurred while registering the mentor
 *               error: <error message>
 *     security:
 *       - BearerAuth: []
 * components:
 *   schemas:
 *     Mentor:
 *       type: object
 *       properties:
 *         fullname:
 *           type: string
 *           description: Full name of the mentor
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the mentor
 *         password:
 *           type: string
 *           format: password
 *           description: Password for the mentor's account
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Route: /register-mentor
router.post("/register-mentor", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Generate a 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Validate the input
    const { error } = validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if the email already exists in Mentors collection
    const existingMentor = await Mentors.findOne({ email });
    if (existingMentor) {
      return res.status(400).json({
        message: "Email already exists. Please choose a different email.",
      });
    }

    // Check if the email already exists in User collection
    // const existingUser = await User.findOne ({email});
    // if (existingUser) {
    //     return res.status (400).json ({message: "Email already exists. Please choose a different email."});
    // }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    const mentor = new Mentors({
      fullname,
      email,
      password: hashPassword,
      status: "Pending", // Default status for new mentors
      source: "Registration", // Source as "Registration"
    });


    // Save the OTP in the OTP schema
    const otpData = new OTP({ email, otp });
    await otpData.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the otp and fullname variables
    let html = ejs.render(template, { otp, fullname });

    await sendEmail(email, "Account Verification", html);

    res.status(200).json({ message: "Account created successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while registering the mentor" });
  }
});

/**
 * @swagger
 * /register-donor:
 *   post:
 *     summary: Register a new Donor
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 description: The full name of the donor
 *               email:
 *                 type: string
 *                 description: The email address of the donor
 *               password:
 *                 type: string
 *                 description: The password for the donor's account
 *             required:
 *               - fullname
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: Donor registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the donor's account has been created successfully
 *       '400':
 *         description: Invalid input data or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 */

// Route: /register-donor
router.post("/register-donor", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Generate a 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Validate the input
    const { error } = validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if the email already exists in Mentors collection
    const existingDonor = await Donors.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({
        message: "Email already exists. Please choose a different email.",
      });
    }

    // // Check if the email already exists in User collection
    // const existingUser = await User.findOne ({email});
    // if (existingUser) {
    //     return res.status (400).json ({message: "Email already exists. Please choose a different email."});
    // }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);


    // Save the OTP in the OTP schema
    const otpData = new OTP({ email, otp });
    await otpData.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp_donor.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the otp and fullname variables
    let html = ejs.render(template, { otp, fullname });

    await sendEmail(email, "Account Verification", html);

    res.status(200).json({ message: "Account created successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while registering the donor" });
  }
});

/**
 * @swagger
 * /auth/mentor-login:
 *   post:
 *     summary: Mentor Login
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the mentor
 *               password:
 *                 type: string
 *                 description: The password of the mentor
 *             required:
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: Mentor login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: The generated authentication token
 *                     accountType:
 *                       type: string
 *                       description: The account type (mentor)
 *                     mentor:
 *                       $ref: '#/components/schemas/MentorWithoutPassword'
 *                   required:
 *                     - token
 *                     - accountType
 *                     - mentor
 *                 message:
 *                   type: string
 *                   description: A success message
 *       '400':
 *         description: Invalid email address or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       'default':
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *       required:
 *         - message
 *     MentorWithoutPassword:
 *       type: object
 *       properties:
 *         fullname:
 *           type: string
 *           description: Full name of the mentor
 *         avatar:
 *           type: string
 *           description: Avatar URL of the mentor
 *         bio:
 *           type: string
 *           description: Biography of the mentor
 *         faculty:
 *           type: string
 *           description: Faculty of the mentor
 *         email:
 *           type: string
 *           description: Email address of the mentor
 *         phone:
 *           type: string
 *           description: Phone number of the mentor
 *         institution:
 *           type: string
 *           description: Institution of the mentor
 *         city:
 *           type: string
 *           description: City of the mentor
 *         country:
 *           type: string
 *           description: Country of the mentor
 *         linkedin:
 *           type: string
 *           description: LinkedIn profile URL of the mentor
 *         twitter:
 *           type: string
 *           description: Twitter profile URL of the mentor
 *         facebook:
 *           type: string
 *           description: Facebook profile URL of the mentor
 *         skills:
 *           type: string
 *           description: Skills of the mentor
 *         calendly:
 *           type: string
 *           description: Calendly URL of the mentor
 *         status:
 *           type: string
 *           description: Status of the mentor
 *       required:
 *         - fullname
 *         - email
 *         - status
 */

router.post("/mentor-login", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const mentor = await Mentors.findOne({ email: req.body.email });

    if (!mentor)
      return res.status(400).send({ message: "Invalid Email Address" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      mentor.password
    );

    if (!validPassword)
      return res.status(400).send({ message: "Invalid Password" });

    const token = await mentor.generateAuthToken();

    // Update mentorWithoutPassword object to include the status property
    const mentorWithoutPassword = await Mentors.findOne({ _id: mentor._id })
      .select("-password -token")
      .populate("faculty")
      .populate({
        path: "sessions",
        model: "MentorSessions",
        populate: {
          path: "mentor",
          model: "Mentors",
        },
      })
      .populate("rating.user", "firstname lastname profilePhoto");

    res.status(200).send({
      data: {
        token: token,
        accountType: "mentor",
        mentor: mentorWithoutPassword,
      },
      message: "Login Successfully!",
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
    console.error(error);
  }
});

/**
 * @swagger
 * /auth/donor-login:
 *   post:
 *     summary: Donor Login
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the donor
 *               password:
 *                 type: string
 *                 description: The password of the donor
 *             required:
 *               - email
 *               - password
 *     responses:
 *       '200':
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: The JWT token for the donor
 *                     accountType:
 *                       type: string
 *                       description: The account type (e.g., "donor")
 *                     donor:
 *                       type: object
 *                       description: The donor details excluding the password and token
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: The unique ID of the donor
 *                         email:
 *                           type: string
 *                           description: The email address of the donor
 *                         name:
 *                           type: string
 *                           description: The name of the donor
 *                         phoneNumber:
 *                           type: string
 *                           description: The phone number of the donor
 *
 *                 message:
 *                   type: string
 *                   description: A success message indicating successful login
 *       '400':
 *         description: Invalid email address or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 */

router.post("/donor-login", async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const donor = await Donors.findOne({ email: req.body.email });

    if (!donor)
      return res.status(400).send({ message: "Invalid Email Address" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      donor.password
    );

    if (!validPassword)
      return res.status(400).send({ message: "Invalid Password" });

    const token = await donor.generateAuthToken();

    // Update donorWithoutPassword object to include the status property
    const donorWithoutPassword = await Donors.findOne({
      _id: donor._id,
    }).select("-password -token");

    res.status(200).send({
      data: {
        token: token,
        accountType: "donor",
        donor: donorWithoutPassword,
      },
      message: "Login Successfully!",
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
    console.error(error);
  }
});

/**
 * @swagger
 * /auth/verify-mentor-otp:
 *   post:
 *     summary: Verify Mentor OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the mentor
 *               otp:
 *                 type: string
 *                 description: The OTP to be verified
 *             required:
 *               - email
 *               - otp
 *     responses:
 *       '200':
 *         description: OTP verified successfully
 *       '400':
 *         description: Invalid OTP or OTP has expired
 *       '404':
 *         description: Mentor not found
 *       '500':
 *         description: An error occurred while verifying the OTP
 */

router.post("/verify-mentor-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the mentor by email
    const mentor = await Mentors.findOne({ email });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Find the OTP record in the OTP schema
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update the mentor's status to Profile Pending
    mentor.status = "Profile Pending";
    await mentor.save();

    // Remove the verified OTP record
    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while verifying the OTP" });
  }
});

/**
 * @swagger
 * /auth/verify-user-otp:
 *   post:
 *     summary: Verify User OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *               otp:
 *                 type: string
 *                 description: The OTP to be verified
 *             required:
 *               - email
 *               - otp
 *     responses:
 *       '200':
 *         description: OTP verified successfully
 *       '400':
 *         description: Invalid OTP or user not found
 *       '500':
 *         description: An error occurred while verifying the OTP
 */


router.post("/verify-user-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the OTP record in the OTP schema
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const verificationBadge = await VerificationBadge.findOne({ title: "Acadaboo Gold" });
    const currentDate = new Date();

    // Update the user's status to Profile Pending (or any other status as needed)
    user.verified = true;
    user.dateAccountVerified = currentDate;
    user.dateBadgeVerified = currentDate;
    user.verification = verificationBadge._id;
    await user.save();

    // Remove the verified OTP record
    await OTP.deleteOne({ email, otp });

    const userWithoutPassword = await User.findOne({ _id: user._id }).select("-password -token");

    res.status(200).json({ message: "OTP verified successfully", user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while verifying the OTP" });
  }
});


/**
 * @swagger
 * /auth/verify-donor-otp:
 *   post:
 *     summary: Verify Donor OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the donor
 *               otp:
 *                 type: string
 *                 description: The OTP to be verified
 *             required:
 *               - email
 *               - otp
 *     responses:
 *       '200':
 *         description: OTP verified successfully, donor status updated to Active
 *       '400':
 *         description: Invalid OTP or OTP has expired
 *       '404':
 *         description: Donor not found
 *       '500':
 *         description: An error occurred while verifying the OTP
 */

router.post("/verify-donor-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the donor by email
    const donor = await Donors.findOne({ email });

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // Find the OTP record in the OTP schema
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update the donor's status to Active
    donor.status = "Active";
    await donor.save();

    // Remove the verified OTP record
    await OTP.deleteOne({ email, otp });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while verifying the OTP" });
  }
});

/**
 * @swagger
 * /auth/mentor-request-otp:
 *   post:
 *     summary: Request Mentor OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the mentor
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: New OTP sent successfully
 *       '400':
 *         description: Email does not exist or is invalid
 *       '500':
 *         description: An error occurred while requesting the OTP
 */

// Route: /mentor-request-otp
router.post("/mentor-request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the Mentors collection
    const existingMentor = await Mentors.findOne({ email });
    if (!existingMentor) {
      return res
        .status(400)
        .json({ message: "Email does not exist. Please enter a valid email." });
    }

    // Find the OTP document for the email
    let otpDocument = await OTP.findOne({ email });

    if (!otpDocument) {
      // If OTP document doesn't exist, create a new one
      otpDocument = new OTP({ email });
    }

    // Generate a new 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Update the OTP in the OTP document
    otpDocument.otp = otp;
    await otpDocument.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the otp and fullname variables
    let html = ejs.render(template, { otp, fullname: existingMentor.fullname });

    await sendEmail(email, "Account Verification", html);

    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while requesting the OTP" });
  }
});

/**
 * @swagger
 * /auth/user-request-otp:
 *   post:
 *     summary: Request User OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: New OTP sent successfully
 *       '400':
 *         description: Email does not exist or is invalid
 *       '500':
 *         description: An error occurred while requesting the OTP
 */
router.post("/user-request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the Users collection
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: "Email does not exist. Please enter a valid email." });
    }

    // Find the OTP document for the email
    let otpDocument = await OTP.findOne({ email });

    if (!otpDocument) { // If OTP document doesn't exist, create a new one
      otpDocument = new OTP({ email });
    }

    // Generate a new 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Update the OTP in the OTP document
    otpDocument.otp = otp;
    await otpDocument.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp_user.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    const fullname = existingUser.firstname + " " + existingUser.lastname

    // compile the EJS template with the otp and fullname variables
    let html = ejs.render(template, { otp, fullname });

    await sendEmail(email, "Verify Account", html);

    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while requesting the OTP" });
  }
});


/**
 * @swagger
 * /auth/donor-request-otp:
 *   post:
 *     summary: Request OTP for Donor
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the donor
 *             required:
 *               - email
 *     responses:
 *       '200':
 *         description: OTP request successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that a new OTP has been sent successfully
 *       '400':
 *         description: Invalid email or email not found in Donors collection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating the cause of the failure
 */

router.post("/donor-request-otp", async (req, res) => {
  try {
    const { emazil } = req.body;

    // Check if the email exists in the Donors collection
    const existingDonor = await Donors.findOne({ email });
    if (!existingDonor) {
      return res
        .status(400)
        .json({ message: "Email does not exist. Please enter a valid email." });
    }

    // Find the OTP document for the email
    let otpDocument = await OTP.findOne({ email });

    if (!otpDocument) {
      // If OTP document doesn't exist, create a new one
      otpDocument = new OTP({ email });
    }

    // Generate a new 6-digit random number as OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Update the OTP in the OTP document
    otpDocument.otp = otp;
    await otpDocument.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "otp_donor.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the otp and fullname variables
    let html = ejs.render(template, { otp, fullname: existingDonor.fullname });

    await sendEmail(email, "Account Verification", html);

    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while requesting the OTP" });
  }
});

// Route to reset mentor password
router.post("/reset-mentor-password", async (req, res) => {
  try {
    let mentor = await Mentors.findOne({ email: req.body.email });
    if (!mentor)
      return res
        .status(404)
        .send({ message: "A mentor with this email does not exist!" });

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomPassword = Array.from(
      {
        length: 12,
      },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(randomPassword, salt);

    // Update mentor's password
    mentor.password = hashPassword;
    await mentor.save();

    // construct the file path using the path.join() method
    const filePath = path.join(__dirname, "..", "emails", "reset_password.ejs");

    // read the HTML content from a file
    let template = fs.readFileSync(filePath, "utf8");

    // compile the EJS template with the password variable
    let html = ejs.render(template, { password: randomPassword });

    await sendEmail(mentor.email, "Password Reset", html);

    res.status(201).send({ message: "New password sent. Check your email." });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
  }
});

// router.post ("/update-user-verification", async (req, res) => {
//     try { // Find all users and populate their verification field
//         const users = await User.find ().populate ("verification");

//         // Loop through each user and update their verification property
//         for (const user of users) {
//             const verified = user.verified;
//             const verificationTitle = verified ? "Acadaboo Gold" : "Acadaboo Neutral";

//             // Find the corresponding verification badge based on the title
//             const verificationBadge = await VerificationBadge.findOne ({title: verificationTitle});

//             if (verificationBadge) { 
//                 user.verification = verificationBadge._id;
//                 await user.save ();
//             }
//         }
//         res.status(201).send({ message: "Update Successfully." });
//     } catch (error) {
//          res.status(500).send({ message: "Internal Server Error", error: error });
//     }

// });


// router.put ("/update-date-verified", async (req, res) => {
//     try { // Find all users with verified === true
//         const users = await User.find ({verified: true});

//         if (! users || users.length === 0) {
//             return res.status (404).json ({message: "No verified users found"});
//         }

//         // Update the dateVerified field of each user to the current date
//         const currentDate = new Date ();
//         const updatePromises = users.map ( (user) => User.findByIdAndUpdate (user._id, {
//             dateAccountVerified: currentDate,
//             dateBadgeVerified: currentDate
//         }));


//         await Promise.all (updatePromises);

//         res.status (200).json ({message: "DateVerified updated for all verified users"});
//     } catch (error) {
//         console.error (error);
//         res.status (500).json ({error: "An error occurred while updating dateVerified"});
//     }
// });

// router.put('/change-account-type', async (req, res) => {
//   try {
//     // Update all users to have the accountType "undergraduate"
//     const updateResult = await User.updateMany({}, { $set: { accountType: 'undergraduate' } });

//     if (updateResult.nModified > 0) {
//       res.status(200).send({ message: "Account types updated successfully!" });
//     } else {
//       res.status(404).send({ message: "No users found to update." });
//     }
//   } catch (error) {
//     res.status(500).send({ message: "Internal Server Error", error: error });
//   }
// });


const validate = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });

  return schema.validate(data);
};

module.exports = router;
