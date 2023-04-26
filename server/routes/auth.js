const router = require("express").Router();
const { User } = require("../models/Users");
const Admin = require("../models/Admin");
const Activity = require("../models/Activities");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const { auth, auth2 } = require("../middleware/auth");
var express = require('express');
var app = express();
var useragent = require('express-useragent');

app.use(useragent.express());



router.get('/', function(req, res) {
    res.send("Auth API");
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login an user or admin
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
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           description: The ID of the admin
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: The name of the admin
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the admin
 *           example: admin@example.com
 *       required:
 *         - _id
 *         - name
 *         - email
 */

router.post("/login", async(req, res) => {
    try {
        // const { error } = validate(req.body);
        // if (error)
        //     return res.status(400).send({ message: error.details[0].message });
        console.log(req.body);
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
    try {
        // Remove the token from the user's document
        const user = req.user;
        user.token = null;
        await user.save();

        res.status(200).send({ message: "Logout successful" });
    } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

//Logout Admin 
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


const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password"),
    });

    return schema.validate(data);
};

module.exports = router;