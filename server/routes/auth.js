const router = require("express").Router();
const { User } = require("../models/Users");
const Admin = require("../models/Admin");
const Activity = require("../models/Activities");
const {MentorFaculty, Mentors, Schedule} = require ("../models/Mentors");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const { auth, auth2 } = require("../middleware/auth");
var express = require('express');
var app = express();
var useragent = require('express-useragent');

const Token = require("../models/Token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

const ejs = require("ejs");
const fs = require("fs");
const path = require("path");


app.use(useragent.express());


router.get('/', function(req, res) {
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

router.post("/login", async(req, res) => {
    try {
        const { error } = validate(req.body);
        if (error)
            return res.status(400).send({ message: error.details[0].message });

        const user = await User.findOne({ email: req.body.email });
        const admin = await Admin.findOne({ email: req.body.email });

        if (!user && !admin)
            return res.status(400).send({ message: "Invalid Email Address" });



        if (user) {
            const validPassword = await bcrypt.compare(req.body.password, user.password);

            if (!validPassword)
                return res.status(400).send({ message: "Invalid Password" });



            const token = await user.generateAuthToken();

            const userWithoutPassword = await User.findOne({ _id: user._id }).select('-password -token')

            const activity = await new Activity({
                userId: user._id,
                browser: req.useragent.browser,
                ip_address: req.socket.remoteAddress,
                os: req.useragent.os,
                source: req.useragent.source,
                createdAt: Date.now()
            }).save();

            res.status(200).send({
                data: {
                    token: token,
                    accountType: "user",
                    user: userWithoutPassword
                },
                message: "Login Successfully!"
            });

        } else {
            const validPassword = await bcrypt.compare(req.body.password, admin.password);
            if (!validPassword)
                return res.status(400).send({ message: "Invalid Password" });



            const token = await admin.generateAuthToken();

            const adminWithoutPassword = await Admin.findOne({ _id: admin._id }).select('-password -token')

            res.status(200).send({
                data: {
                    token: token,
                    accountType: "admin",
                    admin: adminWithoutPassword
                },
                message: "Login Successfully!"
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


router.post("/register", async(req, res) => {
    try {
        // const { error } = validate(req.body);
        // if (error)
        //     return res.status(400).send({ message: error.details[0].message });


        let user = await User.findOne({ email: req.body.email });
        if (user)
            return res.status(409).send({ message: "A User with that email already exists!" });

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        user = await new User({
            ...req.body,
            password: hashPassword,
            accountType: "user"
        }).save();
        const token = await new Token({ userId: user._id, token: crypto.randomBytes(32).toString("hex") }).save();

        // construct the file path using the path.join() method
        const filePath = path.join(__dirname, "..", "emails", "verify_email.ejs");

        // read the HTML content from a file
        let template = fs.readFileSync(filePath, "utf8");

        const urlLink = `${
            process.env.CLIENT_BASE_URL
        }/users/${
            user._id
        }/verify/${
            token.token
        }`;

        // compile the EJS template with the url variable
        let html = ejs.render(template, { url: urlLink });

        await sendEmail(user.email, "Verify Email", html);

        res.status(201).send({ message: "Account Created Successfully! Visit Email to Verify Account" });
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
router.post("/logout", auth, async(req, res) => {
    try { // Remove the token from the user's document
        const user = req.user;
        user.token = null;
        await user.save();

        res.status(200).send({ message: "Logout successful" });
    } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Logout Admin
router.post("/admin-logout", auth2, async(req, res) => {
    const adminId = req.body.id;

    try { // Remove the token from the user's document
        const user = await Admin.findOne({ _id: adminId })

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
router.get('/user/:token', auth, async(req, res) => {
    try {
        const user = await User.findOne({ token: req.params.token }).select('-password -token');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route to get New Password for User
router.post('/request-password', async(req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(404).send({ message: "A User with this Email does not Exists!" });

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?';
        const randomPassword = Array.from({
            length: 12
        }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
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
router.post('/register-mentor', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validate the input
    const { error } = validate({ email, password });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const mentor = new Mentors({
      fullname,
      email,
      password,
      status: 'Pending', // Default status for new mentors
      source: 'Registration', // Source as "Registration"
    });

    const savedMentor = await mentor.save();
    res.status(200).json(savedMentor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while registering the mentor' });
  }
});


const validate = (data) => {
    const schema = Joi.object({ email: Joi.string().email().required().label("Email"), password: Joi.string().required().label("Password") });

    return schema.validate(data);
};

module.exports = router;