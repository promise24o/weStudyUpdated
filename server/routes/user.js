const cloudinary = require ("cloudinary").v2;
const {CloudinaryStorage} = require ("multer-storage-cloudinary");
const router = require ("express").Router ();
const bcrypt = require ("bcrypt");
const mongoose = require ('mongoose');
const axios = require ('axios');


const Token = require ("../models/Token");
const sendEmail = require ("../utils/sendEmail");
const crypto = require ("crypto");

const ejs = require ("ejs");
const fs = require ("fs");
const path = require ("path");
const puppeteer = require ("puppeteer");
const {PDFDocument, StandardFonts, rgb} = require ("pdf-lib");

// Models
const {User} = require ("../models/Users");
const Post = require ("../models/Post");
const Activity = require ("../models/Activities");
const Institutions = require ("../models/Institutions");
const gpaSchema = require ("../models/Gpa");
const Story = require ("../models/Story");
const {MentorFaculty, Mentors, Schedule} = require ("../models/Mentors");
const Advert = require ("../models/Adverts");
const multer = require ("multer");
const Agenda = require ("agenda");
const MentorApplication = require ("../models/MentorApplication");
const Notification = require ("../models/Notifications");
const FriendRequest = require ("../models/FriendRequest");
const Chat = require ("../models/Chat");

// Configure Cloudinary credentials
cloudinary.config ({cloud_name: "dbb2dkawt", api_key: "474957451451999", api_secret: "yWE3adlqWuUOG0l3JjqSoIPSI-Q"});

// Configure Multer to use Cloudinary as the storage engine
const randomString = crypto.randomBytes (8).toString ('hex');
const storage = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/users",
        format: async () => "png",
        public_id: () => randomString
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload = multer ({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    }
});

// Configure Multer to use Cloudinary as the storage engine

// Create a multer instance with the storage engine and limits (if necessary)

const storage3 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: (req, file) => {
        let format;
        let resourceType;
        console.log (file);

        if (file.mimetype.includes ("image")) {
            format = "jpg";
            resourceType = "image";
        } else if (file.mimetype.includes ("video")) {
            format = "mp4";
            resourceType = "video";
        }
        // else {
        //     throw new Error ("Invalid file type");
        // }

        const randomString = crypto.randomBytes (8).toString ('hex');
        const params = {
            folder: "/stories",
            format: format,
            public_id: `${randomString}`,
            resource_type: resourceType
        };

        if (format === "mp4") {
            params.transformation = [{
                    duration: 25
                },]; // Set the maximum duration to 25 seconds for videos
            params.allowed_formats = ["mp4"]; // Allow only mp4 format for videos
        }
        return params;
    }
});

const upload3 = multer ({
    storage: storage3,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
        fieldSize: 12 * 1024 * 1024, // 10MB field size limit (adjust as needed)
    }
});

const storage4 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: (req, file) => {
        let format;
        let resourceType;

        if (file.mimetype.includes ("image")) {
            format = "jpg";
            resourceType = "image";
        } else if (file.mimetype.includes ("video")) {
            format = "mp4";
            resourceType = "video";
        }
        // else {
        //     throw new Error ("Invalid file type");
        // }

        const randomString = crypto.randomBytes (8).toString ('hex'); // Generate a random string (8 characters)
        const fileName = `${randomString}`; // Combine the random string

        const params = {
            folder: "/post",
            public_id: fileName, // Use the generated file name as the public_id
            resource_type: resourceType
        };

        if (format === "mp4") {
            params.format = format;
            params.allowed_formats = ["mp4"]; // Allow only mp4 format for videos
        }

        return params;
    }
});

const upload4 = multer ({
    storage: storage4,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
        fieldSize: 12 * 1024 * 1024, // 10MB field size limit (adjust as needed)
    }
});


router.get ("/", function (req, res) {
    res.send ("User API");
});

// router.post("/admin", async(req, res) => {
//     console.log(req.body);
//     try {
//         const salt = await bcrypt.genSalt(Number(process.env.SALT));
//         const hashPassword = await bcrypt.hash(req.body.password, salt);

//         await new Admin({
//             ...req.body,
//             password: hashPassword
//         }).save();

//         res.status(201).send({ message: "Account Created Successfully" })
//     } catch (error) {
//         res.status(500).send({ message: "Internal Server Error", error: error })
//     }
// });

router.get ("/:id/verify/:token", async (req, res) => {
    try {
        const user = await User.findOne ({_id: req.params.id});
        if (! user) {
            return res.status (404).send ({message: "This User Does not Exists"});
        }

        const token = await Token.findOne ({userId: user._id, token: req.params.token});
        if (! token) {
            return res.status (404).send ({message: "Error: Invalid Link"});
        }

        await User.updateOne ({
            _id: user._id
        }, {verified: true});
        await token.deleteOne ();

        const updatedUser = await User.findOne ({_id: user._id});

        res.status (200).send ({user: updatedUser, message: "Email Verified Successfully"});
    } catch (error) {
        if (error.code === 11000) {
            return res.status (400).send ({message: "You have already verified your email"});
        }

        console.error (error);
        res.status (500).send ({message: "Internal Server Error"});
    }
});

router.post ("/resend-verify-email-link", async (req, res) => {
    try {
        let user = await User.findOne ({email: req.body.email});

        const token = await Token.findOneAndUpdate ({
            userId: user._id
        }, {
            token: crypto.randomBytes (32).toString ("hex"),
            createdAt: Date.now ()
        }, {
            upsert: true,
            new: true
        });

        // construct the file path using the path.join() method
        const filePath = path.join (__dirname, "..", "emails", "verify_email.ejs");

        // read the HTML content from a file
        let template = fs.readFileSync (filePath, "utf8");

        const urlLink = `${
            process.env.CLIENT_BASE_URL
        }/users/${
            user._id
        }/verify/${
            token.token
        }`;

        // compile the EJS template with the url variable
        let html = ejs.render (template, {url: urlLink});

        await sendEmail (user.email, "Verify Email", html);

        res.status (201).send ({message: "Verification Email Sent Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User-related endpoints
 */

/**
 * @swagger
 * /users/institutions:
 *   get:
 *     summary: Get all institutions of a specific type
 *     tags:
 *       - User
 *     description: Returns a list of institutions of the specified type
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Type of institution to retrieve (e.g.University or Polytechnic.)
 *     responses:
 *       200:
 *         description: List of institutions successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 institutions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Institution'
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 */

router.get ("/institutions", async (req, res) => {
    try {
        let institutions = await Institutions.find ({type: req.query.type});
        res.status (201).send ({institutions: institutions});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/update-education-info:
 *   post:
 *     summary: Update user education information
 *     tags:
 *       - User
 *     requestBody:
 *       description: User education information to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of institution attended
 *               institution:
 *                 type: string
 *                 description: Name of institution attended
 *               current_level:
 *                 type: string
 *                 description: Current level of education
 *               faculty:
 *                 type: string
 *                 description: Faculty of study
 *               department:
 *                 type: string
 *                 description: Department of study
 *               course_of_study:
 *                 type: string
 *                 description: Course of study
 *               study_mode:
 *                 type: string
 *                 description: Mode of study
 *               userId:
 *                 type: string
 *                 description: User ID
 *             required:
 *               - type
 *               - institution
 *               - current_level
 *               - department
 *               - course_of_study
 *               - study_mode
 *               - userId
 *     responses:
 *       200:
 *         description: User education information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 */

router.post ("/update-education-info", async (req, res) => {
    try {
        const {
            type,
            institution,
            current_level,
            faculty,
            department,
            course_of_study,
            study_mode,
            userId
        } = req.body;
        const updatedUser = await User.findOneAndUpdate ({
            _id: userId
        }, {
            $set: {
                "education.institution_type": type,
                "education.institution": institution,
                "education.current_level": current_level,
                "education.faculty": faculty,
                "education.department": department,
                "education.course_of_study": course_of_study,
                "education.study_mode": study_mode
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Updated Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/update-personal-info:
 *   post:
 *     summary: Update personal information of a user
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               contact_address:
 *                 type: string
 *               gender:
 *                 type: string
 *               userId:
 *                 type: string
 *             example:
 *               city: Lagos
 *               contact_address: 123 Main St, Ikeja
 *               gender: Male
 *               userId: 1234567890abcdef
 *     responses:
 *       200:
 *         description: Personal information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *             example:
 *               user:
 *                 _id: 1234567890abcdef
 *                 email: johndoe@example.com
 *                 personal:
 *                   city: Lagos
 *                   contact_address: 123 Main St, Ikeja
 *                   gender: Male
 *                 education:
 *                   institution_type: University
 *                   institution: University of Lagos
 *                   current_level: 200
 *                   department: Computer Science
 *                   course_of_study: Computer Science
 *                   study_mode: Full-time
 *               message: Updated Successfully!
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 */

router.post ("/update-personal-info", async (req, res) => {
    try {
        const {
            city,
            contact_address,
            gender,
            phone,
            dob,
            userId
        } = req.body;
        const updatedUser = await User.findOneAndUpdate ({
            _id: userId
        }, {
            $set: {
                "personal.phone": phone,
                "personal.city": city,
                "personal.contact_address": contact_address,
                "personal.gender": gender,
                "personal.dob": dob
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Updated Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change user password
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                 required:
 *                   - _id
 *               password:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *             required:
 *               - user
 *               - password
 *               - newPassword
 *               - confirmPassword
 *     responses:
 *       200:
 *         description: Password change successful
 *         content:
 *           application/json:
 *             example:
 *               message: Password Change Successfully!
 *       400:
 *         description: Bad request error
 *         content:
 *           application/json:
 *             example:
 *               message: New password and confirm password do not match
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             example:
 *               message: Internal Server Error
 *               error: <error message>
 *     security:
 *       - bearerAuth: []
 */

router.post ("/change-password", async (req, res) => {
    try {
        const user = await User.findOne ({_id: req.body.user._id});
        const isPasswordCorrect = await bcrypt.compare (req.body.password, user.password);

        // Compare Passwords
        if (! isPasswordCorrect) {
            return res.status (400).send ({message: "Current password is incorrect"});
        }

        // Check Confirm Password
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status (400).send ({message: "New password and confirm password do not match"});
        }

        const salt = await bcrypt.genSalt (Number (process.env.SALT));
        user.password = await bcrypt.hash (req.body.newPassword, salt);
        await user.save ();

        res.status (200).send ({message: "Password Change Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/upload-avatar/{userId}:
 *   post:
 *     summary: Upload user avatar
 *     tags : [User]
 *     description: Upload user's avatar photo and update the user's profile in the database
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user whose avatar photo is being uploaded
 *         schema:
 *           type: string
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: The image file to upload (JPEG, PNG or GIF)
 *     responses:
 *       200:
 *         description: The updated user object with a message indicating that the photo was uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: No photo uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */

// Route to upload user avatar
router.post ("/upload-avatar/:userId", upload.single ("file"), async (req, res) => {
    const userId = req.params.userId;
    try {
        if (!req.file) {
            return res.status (400).json ({error: "No photo uploaded"});
        }

        // Update the user's photo in the database

        const result = await cloudinary.uploader.upload (req.file.path);

        const updatedUser = await User.findOneAndUpdate ({
            _id: userId
        }, {
            $set: {
                profilePhoto: result.secure_url
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Photo Uploaded Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

// router.post('/upload-avatar', upload.single('file'), async(req, res) => {

//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No photo uploaded' });
//         }

//         // Read the contents of the uploaded file
//         const filePath = req.file.path;
//         fs.readFile(filePath, async(err, data) => {
//             if (err) {
//                 return res.status(500).json({ error: 'Error reading photo' });
//             }

//             // Upload the file contents to MongoDB
//             const user = JSON.parse(req.body.user);

//             const updatedUser = await User.findOneAndUpdate({
//                 _id: user._id
//             }, {
//                 $set: {
//                     'photo.data': data,
//                     'photo.contentType': req.file.mimetype
//                 }
//             }, { new: true }).select('-password -token');
//             res.status(200).send({ user: updatedUser, message: "Photo Uploaded Successfully!" });
//         });

//     } catch (error) {
//         res.status(500).send({ message: "Internal Server Error", error: error })
//     }
// })

/**
 * @swagger
 * /users/enable-twofa:
 *   post:
 *     summary: Enable Two Factor Authentication for user.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *               password:
 *                 type: string
 *             example:
 *               user:
 *                 _id: 611a55a22a2a0900156dca47
 *               password: password123
 *     responses:
 *       200:
 *         description: 2FA enabled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Current password is incorrect or user ID not provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: object
 *                   description: Error object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Error message
 *                     stack:
 *                       type: string
 *                       description: Error stack trace
 */

router.post ("/enable-twofa", async (req, res) => {
    try {
        const user = await User.findOne ({_id: req.body.user._id});

        const isPasswordCorrect = await bcrypt.compare (req.body.password, user.password);

        // Compare Passwords
        if (! isPasswordCorrect) {
            return res.status (400).send ({message: "Current password is incorrect"});
        }
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                twofa: true
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "2FA Enabled Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/disable-twofa:
 *   post:
 *     summary: Disable two-factor authentication for the user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 description: The user object containing the user id (_id).
 *                 properties:
 *                   _id:
 *                     type: string
 *               password:
 *                 type: string
 *                 description: The user's current password.
 *             example:
 *               user:
 *                 _id: 612345678901234567890123
 *               password: pass123
 *     responses:
 *       200:
 *         description: Successfully disabled two-factor authentication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object.
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                   example: 2FA Disabled Successfully!
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: object
 *                   description: Error object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Error message
 *                     stack:
 *                       type: string
 *                       description: Error stack trace
 */

router.post ("/disable-twofa", async (req, res) => {
    try {
        const user = await User.findOne ({_id: req.body.user._id});
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                twofa: false
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "2FA Disabled Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/update-preset-parameter:
 *   post:
 *     summary: Update preset parameter for the user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: The user id (_id).
 *               preset_para:
 *                 type: boolean
 *                 description: The new preset parameter value.
 *             example:
 *               user: 612345678901234567890123
 *               preset_para: true
 *     responses:
 *       200:
 *         description: Successfully updated the preset parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object.
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                   example: Preset Parameter Updated Successfully!
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 error:
 *                   type: object
 *                   description: Error object
 *                   properties:
 *                     message:
 *                       type: string
 *                       description: Error message
 *                     stack:
 *                       type: string
 *                       description: Error stack trace
 */

router.post ("/update-preset-parameter", async (req, res) => {
    try {
        const {preset_para} = req.body;

        const user = await User.findOne ({_id: req.body.user});
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                "preset_param.status": preset_para
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Preset Parameter Updated Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/{userId}/presetParam:
 *   patch:
 *     summary: Update user preset parameter status
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preset_param:
 *                 type: object
 *                 description: The preset parameter object containing the status.
 *                 properties:
 *                   status:
 *                     type: boolean
 *             example:
 *               preset_param:
 *                 status: true
 *     responses:
 *       200:
 *         description: Successfully updated user preset parameter status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object.
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                   example: Preset Parameter Updated Successfully!
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bad Request. Please provide a valid user ID and preset parameter status.
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized. Please provide a valid token.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal Server Error. Please try again later.
 */

// Update user preset_param status
router.patch ("/:userId/presetParam", async (req, res) => {
    try {
        const userId = req.params.userId;
        const status = req.body.preset_param.status;

        const user = await User.findOne ({_id: userId});
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                "preset_param.status": status
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Preset Parameter Updated Successfully!"});
    } catch (err) {
        console.error (err.message);
        res.status (500).send ("Server error");
    }
});

/**
 * @swagger
 * /users/{userId}/preset-scale:
 *   patch:
 *     summary: Update user's grading scale for preset parameters.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           description: The user ID.
 *         description: The ID of the user to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preset_param:
 *                 type: object
 *                 description: The preset parameters object.
 *                 properties:
 *                   scale:
 *                     type: number
 *                     description: The updated grading scale.
 *             example:
 *               preset_param:
 *                 scale: 4.0
 *     responses:
 *       200:
 *         description: Successfully updated user's grading scale for preset parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object.
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                   example: Grading Scale Updated Successfully!
 *       400:
 *         description: Bad Request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Invalid User ID.
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Authorization denied. Token is invalid.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Server error. Please try again later.
 */

// Update user preset_param scale
router.patch ("/:userId/preset-scale", async (req, res) => {
    try {
        const userId = req.params.userId;
        const scale = req.body.preset_param.scale;

        const user = await User.findOne ({_id: userId});
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                "preset_param.scale": scale
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Grading Scale Updated Successfully!"});
    } catch (err) {
        console.error (err.message);
        res.status (500).send ("Server error");
    }
});

/**
 * @swagger
 * /users/{userId}/target-cgpa:
 *   patch:
 *     summary: Update target CGPA of a user.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *       - in: body
 *         name: data
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             target:
 *               type: number
 *               description: The new target CGPA of the user.
 *               example: 3.5
 *     responses:
 *       200:
 *         description: Target CGPA updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                   description: The updated user object.
 *                 message:
 *                   type: string
 *                   description: A success message.
 *                   example: Target CGPA updated successfully!
 *       400:
 *         description: Bad request. Invalid user ID or target CGPA value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Invalid user ID or target CGPA value.
 *       401:
 *         description: Unauthorized. User must be logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: User must be logged in.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Server error. Please try again later.
 */

// Update user Target GPA
router.patch ("/:userId/target-cgpa", async (req, res) => {
    try {
        const userId = req.params.userId;
        const target = req.body.data.target;

        const user = await User.findOne ({_id: userId});
        const updatedUser = await User.findOneAndUpdate ({
            _id: user._id
        }, {
            $set: {
                targetCGPA: target
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: updatedUser, message: "Target CGPA  Updated Successfully!"});
    } catch (err) {
        console.error (err.message);
        res.status (500).send ("Server error");
    }
});

/**
 * @swagger
 * /users/{userId}/preset_param/scale:
 *   delete:
 *     summary: Deletes the preset_param scale of the specified user.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to delete preset_param scale.
 *     responses:
 *       200:
 *         description: The preset_param scale is deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: The success message.
 *                   example: Grading Scale Deleted Successfully!
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message.
 *                   example: User not found.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Server error. Please try again later.
 */

// User Delete scale
router.delete ("/:userId/preset_param/scale", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById (userId).select ("-password -token");

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }
        user.preset_param.scale = undefined;
        await user.save ();

        res.status (200).send ({user: user, message: "Grading Scale Deleted Successfully!"});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});

/**
 * @swagger
 * /users/{userId}/remove-result/{resultId}:
 *   delete:
 *     summary: Delete GPA result
 *     description: Deletes a specific GPA result for a user
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user whose GPA result needs to be deleted
 *         schema:
 *           type: string
 *       - in: path
 *         name: resultId
 *         required: true
 *         description: ID of the GPA result to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                   example: Result Deleted successfully
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: GPA not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: Server error
 */

// Delete User Result
router.delete ("/:userId/remove-result/:resultId", async (req, res) => {
    const {userId, resultId} = req.params;
    try {
        const gpa = await gpaSchema.findOneAndDelete ({userId: userId, _id: resultId});
        if (! gpa) {
            return res.status (404).send ({message: "GPA not found"});
        }
        res.send ({message: "Result Deleted successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).send ({message: "Server error"});
    }
});

/**
 * @swagger
 * /{userId}/remove-grade/{gradeId}:
 *   delete:
 *     summary: Delete a specific grade from the user's preset grading scale.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose grade is to be removed.
 *       - in: path
 *         name: gradeId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the grade to be removed.
 *     responses:
 *       200:
 *         description: Grade Deleted Successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                   description: The updated user object after removing the grade.
 *                 message:
 *                   type: string
 *                   description: The success message.
 *                   example: Grade Deleted Successfully!
 *       404:
 *         description: User not found or Grade not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message.
 *                   example: User not found.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Server error. Please try again later.
 */

// Delete User Grades
router.delete ("/:userId/remove-grade/:gradeId", async (req, res) => {
    try {
        const {gradeId, userId} = req.params;
        const user = await User.findOneAndUpdate ({
            _id: userId
        }, {
            $pull: {
                "preset_param.grading": {
                    _id: gradeId
                }
            }
        }, {new: true}).select ("-password -token");

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        res.status (200).send ({user: user, message: "Grade Deleted Successfully!"});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});

/**
 * @swagger
 * /users/{userId}/add-custom-grade:
 *   post:
 *     summary: Add a custom grade to a user's preset parameters
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user
 *       - in: body
 *         name: grade
 *         description: The custom grade symbol and value to be added
 *         schema:
 *           type: object
 *           properties:
 *             grade_symbol:
 *               type: string
 *               description: The symbol for the custom grade
 *               example: A-
 *             grade_value:
 *               type: number
 *               description: The value for the custom grade
 *               example: 3.7
 *           required:
 *             - grade_symbol
 *             - grade_value
 *     responses:
 *       200:
 *         description: The updated user object with the custom grade added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A success message
 *                   example: Grade Added Successfully!
 *       400:
 *         description: Bad Request - Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message
 *                   example: User not found.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 *                   example: Server error. Please try again later.
 */

// Post user custom grade
router.post ("/:userId/add-custom-grade", async (req, res) => {
    try {
        const userId = req.params.userId;
        const {grade_symbol, grade_value} = req.body;

        const user = await User.findByIdAndUpdate (userId, {
            $push: {
                "preset_param.grading": {
                    grade_symbol,
                    grade_value
                }
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({user: user, message: "Grade Added Successfully!"});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});

/**
 * @swagger
 * /users/{id}/grades:
 *   get:
 *     summary: Get all grades for a user
 *     tags: [User]
 *     description: Returns an array of all the grades configured for a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose grades to retrieve
 *     responses:
 *       200:
 *         description: Array of grades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The ID of the grade
 *                     example: 6139d3c3540f670017b2111a
 *                   grade_symbol:
 *                     type: string
 *                     description: The symbol representing the grade
 *                     example: A
 *                   grade_value:
 *                     type: number
 *                     description: The numerical value of the grade
 *                     example: 4.0
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message
 *                   example: User not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message
 *                   example: Server Error. Please try again later.
 */

// Get all Grades for a user
router.get ("/:id/grades", async (req, res) => {
    try {
        const user = await User.findById (req.params.id);
        const grading = user.preset_param.grading;
        res.json (grading);
    } catch (err) {
        console.error (err);
        res.status (500).send ("Internal Server Error");
    }
});

/**
 * @swagger
 * /users/user-activities:
 *   get:
 *     summary: Get the recent activities of a user
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user whose activities are to be fetched
 *     responses:
 *       200:
 *         description: Recent activities of the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID of the activity
 *                       activity:
 *                         type: string
 *                         description: Description of the activity
 *                       userId:
 *                         type: string
 *                         description: ID of the user who performed the activity
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Date and time when the activity was performed
 *       400:
 *         description: No activities found for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating no activities found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message indicating internal server error
 *                 error:
 *                   type: object
 *                   description: Error details
 */

// Get all User Login Activities
router.get ("/user-activities", async (req, res) => {
    try {
        let activities = await Activity.find ({userId: req.query.user_id}).sort ({createdAt: "desc"}).limit (10);
        if (! activities) {
            return res.status (400).send ({message: "No Activities Found"});
        }
        res.status (200).send ({activities: activities});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/add-gpa:
 *   post:
 *     summary: Add or update user GPA
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               title:
 *                 type: string
 *               grade:
 *                 type: number
 *               symbol:
 *                 type: string
 *               creditUnit:
 *                 type: number
 *               user:
 *                 type: string
 *               semester:
 *                 type: string
 *               institution:
 *                 type: string
 *               level:
 *                 type: string
 *             example:
 *               code: "MTH101"
 *               title: "Calculus"
 *               grade: 75
 *               symbol: "B"
 *               creditUnit: 3
 *               user: "615349a5cc8cf81d371e8751"
 *               semester: "First"
 *               institution: "University of Lagos"
 *               level: "100 Level"
 *     responses:
 *       200:
 *         description: Course added or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPA'
 *             example:
 *               gpa:
 *                 _id: "6234f232dbd67b0ef112ccb7"
 *                 userId: "615349a5cc8cf81d371e8751"
 *                 level: "100 Level"
 *                 institution: "University of Lagos"
 *                 semester: "First"
 *                 courses:
 *                   - code: "MTH101"
 *                     title: "Calculus"
 *                     grade: 75
 *                     symbol: "B"
 *                     unit: 3
 *                     createdAt: "2023-04-27T13:14:36.820Z"
 *                 createdAt: "2023-04-27T13:14:36.820Z"
 *               message: "Course Added Successfully!"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: object
 *                   nullable: true
 */

// Add User GPA
router.post ("/add-gpa", async (req, res) => {
    let gpa = null;

    try {
        const {
            code,
            title,
            grade,
            symbol,
            creditUnit,
            user,
            semester,
            institution,
            level
        } = req.body;

        // Search for a document that matches the semester, level, and userId
        gpa = await gpaSchema.findOne ({semester, level, userId: user});

        if (gpa) { // If a document is found, update the courses array
            await gpaSchema.updateOne ({
                _id: gpa._id
            }, {
                $push: {
                    courses: {
                        code,
                        title,
                        symbol,
                        unit: creditUnit,
                        grade
                    }
                }
            });
            gpa = await gpaSchema.findOne ({semester, level, userId: user}).sort ({createdAt: "desc"});
            res.status (200).send ({gpa: gpa, message: "Course Updated Successfully!"});
        } else { // If a document is not found, create a new document with all information
            gpa = await gpaSchema.create ({
                userId: user,
                level,
                semester,
                institution,
                courses: [
                    {
                        code,
                        title,
                        symbol,
                        unit: creditUnit,
                        grade
                    },
                ]
            });
            res.status (200).send ({gpa: gpa, message: "Course Added Successfully!"});
        }
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error"});
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     GPA:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user this GPA belongs to.
 *         level:
 *           type: string
 *           description: The level of education.
 *         institution:
 *           type: string
 *           description: The institution this GPA belongs to.
 *         semester:
 *           type: string
 *           description: The semester this GPA belongs to.
 *         courses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the course.
 *               code:
 *                 type: string
 *                 description: The code of the course.
 *               unit:
 *                 type: number
 *                 description: The credit unit of the course.
 *               grade:
 *                 type: number
 *                 description: The grade obtained for the course.
 *               symbol:
 *                 type: string
 *                 description: The symbol of the grade obtained for the course.
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time the course was added to the GPA.
 *
 * /users/user-gpa:
 *   get:
 *     summary: Get a user's GPA for a particular semester and level.
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         required: true
 *         description: The level of education.
 *         schema:
 *           type: number
 *       - in: query
 *         name: semester
 *         required: true
 *         description: The semester.
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: The user's GPA for the specified semester and level.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GPA'
 *       400:
 *         description: No GPA found for the specified user, semester, and level.
 *       500:
 *         description: Internal Server Error.
 */

// Get User GPA
router.get ("/user-gpa", async (req, res) => {
    try {
        let gpa = await gpaSchema.findOne ({userId: req.query.user_id, level: req.query.level, semester: req.query.semester});
        if (! gpa) {
            return res.status (400).send ({message: "No GPA Found"});
        }
        res.status (200).send ({gpa: gpa});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/{userId}/get-result/{resultId}:
 *   get:
 *     summary: Retrieve user's result by resultId
 *     tags : [User]
 *     description: Retrieve user's result by userId and resultId
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *       - in: path
 *         name: resultId
 *         required: true
 *         description: ID of the result
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user's result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gpa:
 *                   $ref: '#/components/schemas/GPA'
 *       400:
 *         description: No GPA found for the user and resultId
 *       500:
 *         description: Internal server error occurred
 */

// Get User Result
router.get ("/:userId/get-result/:resultId", async (req, res) => {
    try {
        let gpa = await gpaSchema.findOne ({userId: req.params.userId, _id: req.params.resultId});
        if (! gpa) {
            return res.status (400).send ({message: "No GPA Found"});
        }
        res.status (200).send ({gpa: gpa});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/get-user-gpa/{userId}/{institutionType}:
 *   get:
 *     summary: Get all GPAs for a user at a specific type of institution
 *     tags : [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to get GPAs for
 *       - in: path
 *         name: institutionType
 *         schema:
 *           type: string
 *         required: true
 *         description: The type of institution to get GPAs for (e.g. university, college, etc.)
 *     responses:
 *       200:
 *         description: Returns an array of GPAs for the specified user at the specified institution type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gpa:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GPA'
 *       400:
 *         description: No GPAs found for the specified user and institution type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message explaining why no GPAs were found
 *       500:
 *         description: Internal server error occurred
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message explaining the internal server error
 *                 error:
 *                   type: string
 *                   description: The error message from the server
 *
 * components:
 *   schemas:
 *     GPA:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the GPA
 *         userId:
 *           type: string
 *           description: The ID of the user associated with the GPA
 *         level:
 *           type: string
 *           description: The academic level of the user
 *         semester:
 *           type: string
 *           description: The semester the GPA was obtained
 *         institution:
 *           type: string
 *           description: The type of institution the user attended
 *         courses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: The code for the course
 *               title:
 *                 type: string
 *                 description: The title of the course
 *               symbol:
 *                 type: string
 *                 description: The symbol of the course
 *               unit:
 *                 type: number
 *                 description: The number of units for the course
 *               grade:
 *                 type: number
 *                 description: The grade obtained for the course
 */

// Get User Results Based on Selected Institution
router.get ("/get-user-gpa/:userId/:institutionType", async (req, res) => {
    const institution = req.params.institutionType;
    try {
        let gpa = await gpaSchema.find ({userId: req.params.userId, institution: institution});
        if (! gpa) {
            return res.status (400).send ({message: "No GPA Found"});
        }
        res.status (200).send ({gpa: gpa});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/user-institution:
 *   get:
 *     summary: Get user institution logo
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: institution
 *         schema:
 *           type: string
 *         required: true
 *         description: Institution name
 *     responses:
 *       '201':
 *         description: Institution logo successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logo:
 *                   type: string
 *                   description: Institution logo URL
 *       '400':
 *         description: No institution found with the provided name
 *       '500':
 *         description: Internal server error
 */

// Get User Institution Logo
router.get ("/user-institution", async (req, res) => {
    try {
        let institution = await Institutions.findOne ({institution: req.query.institution});
        res.status (201).send ({logo: institution.logo});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /users/remove-course/{courseId}:
 *   delete:
 *     summary: Remove course based on the course ID
 *     description: Removes a course from the GPA document based on the given course ID.
 *     tags :   [User]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the course to remove.
 *       - in: body
 *         name: body
 *         description: User object and form data object.
 *         schema:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *             formData:
 *               type: object
 *               properties:
 *                 current_level:
 *                   type: number
 *                 semester:
 *                   type: number
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gpa:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Remove Course Based on the Course ID
router.delete ("/remove-course/:courseId", async (req, res) => {
    try {
        const {courseId} = req.params;
        const {user, formData} = req.body;
        const gpa = await gpaSchema.findOne ({userId: user._id, level: formData.current_level, semester: formData.semester});

        const courseIndex = gpa.courses.findIndex ( (course) => String (course._id) === courseId);

        if (courseIndex === -1) { // Course not found
            return res.status (404).json ({error: "Course not found"});
        }

        // Remove the course from the courses array
        gpa.courses.splice (courseIndex, 1);

        // Save the updated GPA document
        await gpa.save ();

        const selectedGPAs = await gpaSchema.findOne ({userId: user._id, level: formData.current_level, semester: formData.semester});

        // const selectedGPAs = selectedCourses.map(course => course.gpa);
        res.status (200).send ({gpa: selectedGPAs, message: "Course Deleted Successfully"});
    } catch (err) {
        res.status (500).json ({error: "Server error"});
    }
});

// Get all Mentors
router.get ("/mentors", async (req, res) => {
    try {
        const mentors = await Mentors.find ({status: "Approved"}).populate ("faculty").sort ({createdAt: "desc"});

        if (mentors.length === 0) {
            return res.status (404).send ({message: "No approved mentors found"});
        }

        res.status (200).send ({mentors: mentors});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

// router.put("/mentors/approve-all", async (req, res) => {
// try {
//     const updateResult = await Mentors.updateMany(
//       { bio: { $ne: null, $ne: "" } },
//       { status: "Approved" }
//     );

//     if (updateResult.nModified === 0) {
//       return res.status(404).send({ message: "No mentors with bio found" });
//     }

//     res.status(200).send({
//       message: `Status updated to 'Approved' for ${updateResult.nModified} mentors`,
//     });
// } catch (error) {
//     res.status(500).send({ message: "Internal Server Error", error: error });
// }
// });

/**
 * @swagger
 * /users/mentor/{id}:
 *   get:
 *     summary: Get a mentor based on ID
 *     description: Retrieve a mentor from the database based on the given ID.
 *     tags :   [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to retrieve.
 *     responses:
 *       200:
 *         description: Mentor retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mentor:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     specialties:
 *                       type: array
 *                       items:
 *                         type: string
 *                     availability:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// Get a Mentor based on ID
router.get ("/mentor/:id", async (req, res) => {
    try {
        const mentorId = req.params.id;
        const mentor = await Mentors.findOne ({_id: mentorId}).populate ("faculty").populate ({path: "rating.user", select: "firstname lastname profilePhoto"}).populate ({
            path: "sessions",
            model: "MentorSessions",
            populate: {
                path: "mentor",
                model: "Mentors"
            }
        });
        res.status (200).json ({mentor});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

// Get a Favorite Mentor based on ID
router.get ("/favorite-mentor/:id/:mentorId", async (req, res) => {
    try {
        const mentorId = req.params.mentorId;
        const id = req.params.id;

        const user = await User.findById ({_id: id}).populate ({
            path: "favoriteMentors.mentor",
            model: "Mentors",
            populate: [
                {
                    path: "faculty"
                }, {
                    path: "rating.user",
                    select: "firstname lastname profilePhoto"
                }, {
                    path: "sessions",
                    model: "MentorSessions",
                    populate: {
                        path: "mentor",
                        model: "Mentors"
                    }
                },
            ]
        }).exec ();

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        const favoriteMentor = user.favoriteMentors.find ( (item) => item.mentor._id.toString () === mentorId);

        if (! favoriteMentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        res.status (200).json ({mentor: favoriteMentor});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});


router.get ("/mentor/chat-status/:userId/:mentorId", async (req, res) => {
    try {
        const {userId, mentorId} = req.params;

        const user = await User.findById (userId);

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        const favoriteMentor = user.favoriteMentors.find ( (item) => item.mentor.toString () === mentorId);

        if (! favoriteMentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        const chatStatus = favoriteMentor.chatStatus;

        res.status (200).json ({status: chatStatus});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});


/**
 * @swagger
 * /users/faculty/{id}:
 *   get:
 *     summary: Get faculty name based on ID
 *     description: Returns the title of a faculty based on the given ID.
 *     tags : [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the faculty to retrieve the title for.
 *     responses:
 *       200:
 *         description: Faculty name retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 facultyName:
 *                   type: string
 *                   description: The title of the faculty.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The error message.
 */

// Get a Facult Name
router.get ("/faculty/:id", async (req, res) => {
    try {
        const facultyId = req.params.id;
        const faculty = await MentorFaculty.findOne ({_id: facultyId});
        const facultyName = faculty ? faculty.title : null;
        res.status (200).json ({facultyName});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

/**
 * @swagger
 * /users/submit-rating/{mentorId}/{userId}:
 *   post:
 *     summary: Submit a rating for a mentor
 *     description: Allows a user to submit a rating for a specific mentor.
 *     tags : [User]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the mentor to rate.
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user submitting the rating.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               review:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               profilePhoto:
 *                 type: string
 *               name:
 *                 type: string
 *             required:
 *               - review
 *               - rating
 *           example:
 *             review: "Great mentor, helped me achieve my goals."
 *             rating: 5
 *             profilePhoto: "https://example.com/profile-photo.jpg"
 *             name: "John Doe"
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Mentor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// User Submit Mentor trading
router.post ("/submit-rating/:mentorId/:userId", async (req, res) => {
    try {
        const {mentorId, userId} = req.params;
        const {review, rating} = req.body;

        // Convert userId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId (userId)

        // Check if mentor exists
        const mentor = await Mentors.findById (mentorId).populate ("rating.user", "firstname lastname profilePhoto");
        if (! mentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        // Find the user's existing rating for the mentor
        const userRating = mentor.rating.find ( (r) => r.user._id.equals (userObjectId));
        if (userRating) { // User has already rated, update the existing rating
            userRating.review = review;
            userRating.rating = rating;
            userRating.createdAt = Date.now ();
        } else { // User has not rated yet, create a new rating object
            const newRating = {
                review,
                rating,
                user: userObjectId,
                createdAt: Date.now ()
            };

            // Add the new rating to the mentor's ratings array
            mentor.rating.push (newRating);
        }

        // Save the updated mentor document
        const updatedMentor = await mentor.save ();

        // Populate user information in the updated mentor
        await updatedMentor.populate ("rating.user", "firstname lastname profilePhoto");

        res.status (200).json ({mentor: updatedMentor, message: "Rating submitted successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).json ({message: "Server Error"});
    }
});


/**
 * @swagger
 * /users/confirm-schedule/{mentorId}/{userId}:
 *   post:
 *     summary: Confirm a meeting schedule with a mentor
 *     tags:
 *       - User
 *     description: Confirms a meeting schedule between a user and a mentor and saves it in the database.
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor.
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *       - in: body
 *         name: body
 *         description: Meeting schedule details.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             selectedSession:
 *               type: object
 *               description: Selected session details.
 *             title:
 *               type: string
 *               description: Title of the meeting.
 *             notes:
 *               type: string
 *               description: Additional notes for the meeting.
 *             startTime:
 *               type: string
 *               format: date-time
 *               description: Start time of the meeting in ISO format.
 *             endTime:
 *               type: string
 *               format: date-time
 *               description: End time of the meeting in ISO format.
 *     responses:
 *       200:
 *         description: Meeting schedule confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or conflict in schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// POST /users/confirm-schedule/:mentorId/:userId
router.post ('/confirm-schedule/:mentorId/:userId', async (req, res) => {
    try {
        const {mentorId, userId} = req.params;
        const {
            selectedSession,
            title,
            notes,
            startTime,
            endTime
        } = req.body;

        // Check if the user already has a schedule with the mentor
        const existingSchedule = await Schedule.findOne ({userId, mentorId, status: 'Pending'});
        if (existingSchedule) {
            return res.status (400).json ({error: 'You already have a pending schedule with this mentor'});
        }

        // Count the number of already booked sessions for the selected session
        const bookedSessionsCount = await Schedule.countDocuments ({session: selectedSession._id});

        // Check if there are available slots in the session
        if (bookedSessionsCount >= selectedSession.slots) {
            return res.status (400).json ({error: 'No available slots for this session'});
        }

        // Check if there is an existing schedule with the same start time and end time
        const existingScheduleWithSameTime = await Schedule.findOne ({
            mentorId, session: selectedSession._id,
            // status: 'Pending',
            $and: [
                {
                    startTime: {
                        $lte: endTime
                    }
                }, {
                    endTime: {
                        $gte: startTime
                    }
                }
            ]
        });

        if (existingScheduleWithSameTime) {
            return res.status (400).json ({error: 'Another user has already booked a schedule within the same time'});
        }
        // Create a new schedule document
        const newSchedule = new Schedule ({
            userId,
            mentorId,
            session: selectedSession,
            startTime,
            endTime,
            title,
            notes,
            status: 'Pending',
            createdAt: new Date (),
            updatedAt: new Date ()
        });

        // Save the new schedule document to the database
        const savedSchedule = await newSchedule.save ();

        // Return the saved schedule to the client
        res.status (200).json ({message: 'Session booked successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Server Error'});
    }
});

/**
 * @swagger
 * /users/cancel-meeting/{userId}/{scheduleId}:
 *   post:
 *     summary: Cancel a meeting by deleting it
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         description: ID of the schedule to be canceled
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Meeting canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Meeting canceled successfully
 *       '404':
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Schedule not found
 *       '403':
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized access
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */

router.post ('/cancel-meeting/:userId/:scheduleId', async (req, res) => {
    try {
        const {userId, scheduleId} = req.params;

        // Find the schedule by scheduleId
        const schedule = await Schedule.findById (scheduleId);

        if (! schedule) {
            return res.status (404).json ({error: 'Schedule not found'});
        }

        // Check if the schedule belongs to the specified user
        if (schedule.userId.toString () !== userId) {
            return res.status (403).json ({error: 'Unauthorized access'});
        }

        // Delete the schedule
        await Schedule.findByIdAndDelete (scheduleId);

        res.status (200).json ({message: 'Meeting canceled successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Internal Server Error'});
    }
});


/**
 * @swagger
 * /users/schedules/{mentorId}/{userId}:
 *   get:
 *     summary: Get confirmed meeting schedules for a specific mentor and user
 *     tags :   [User]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         description: ID of the mentor
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       mentorId:
 *                         type: string
 *                       eventType:
 *                         type: string
 *                       eventName:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       location:
 *                         type: object
 *                         properties:
 *                           joinUrl:
 *                             type: string
 *                           status:
 *                             type: string
 *                           type:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server Error
 */

// Get Meeting Schedule Confirmed based on Mentor
router.get ("/schedules/:mentorId/:userId", async (req, res) => {
    try {
        const {userId, mentorId} = req.params;
        const schedules = await Schedule.find ({userId, mentorId}).populate ("session", "date startTime endTime slots");
        res.json ({schedules});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});

/**
 * @swagger
 * /users/favorite-mentor/{mentorId}/{userId}:
 *   post:
 *     summary: Add a mentor as a favorite mentor for a user
 *     tags :   [User]
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the mentor to add to favorites
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user who wants to add a mentor to favorites
 *     requestBody:
 *       required: false
 *       description: Request body is not required.
 *     responses:
 *       '200':
 *         description: A successful response, indicating that the mentor has been added to the user's favorites successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the user.
 *                     username:
 *                       type: string
 *                       description: The username of the user.
 *                     email:
 *                       type: string
 *                       description: The email of the user.
 *                     favoriteMentors:
 *                       type: array
 *                       description: Array of favorite mentors.
 *                       items:
 *                         type: object
 *                         properties:
 *                           mentor:
 *                             type: string
 *                             description: The ID of the favorite mentor.
 *                           dateAdded:
 *                             type: string
 *                             description: The date when the mentor was added to favorites.
 *                 message:
 *                   type: string
 *                   description: A message indicating that the mentor has been added to the user's favorites successfully.
 *       '404':
 *         description: The requested user was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating that the requested user was not found.
 *       '500':
 *         description: An error occurred while adding the mentor to the user's favorites.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: An error message indicating that an error occurred while adding the mentor to the user's favorites.
 */

// Add Mentor as Favorite Mentors
router.post ("/favorite-mentor/:mentorId/:userId", async (req, res) => {
    const {mentorId, userId} = req.params;

    try {
        const mentor = await Mentors.findById (mentorId);

        if (! mentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        const user = await User.findById (userId);

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        const favoriteMentor = {
            mentor: mentorId,
            dateAdded: Date.now ()
        };

        user.favoriteMentors.push (favoriteMentor);
        mentor.mentees.push ({user: userId, dateAdded: Date.now ()});

        const updatedUser = await user.save ();
        const updatedMentor = await mentor.save ();

        const userWithoutPasswordAndToken = await User.findById (updatedUser._id).select ("-password -token");

        return res.status (200).json ({user: userWithoutPasswordAndToken, message: "Mentor Added to Favorites"});
    } catch (error) {
        console.error (error);
        return res.status (500).json ({message: "Server error"});
    }
});


/**
 * @swagger
 * /users/favorite-mentor/{mentorId}/{userId}:
 *   delete:
 *     summary: Remove mentor from user's favorite mentors
 *     tags  :  [User]
 *     description: Removes the specified mentor from the list of favorite mentors of the user with the given ID.
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         required: true
 *         description: The ID of the mentor to be removed from favorites.
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose favorite mentors list should be updated.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The updated user object with the mentor removed from favorites.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   description: A message confirming that the mentor was removed from favorites.
 *                   example: Mentor Removed from Favorites
 *       404:
 *         description: Either the specified user or mentor was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating what went wrong.
 *                   example: User not found
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that a server error occurred.
 *                   example: Server error
 */

// Remove Mentor as Favorite Mentor
router.delete ("/favorite-mentor/:mentorId/:userId", async (req, res) => {
    const {mentorId, userId} = req.params;

    try {
        const user = await User.findById (userId);

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        const mentor = await Mentors.findById (mentorId);

        if (! mentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        const favoriteMentorIndex = user.favoriteMentors.findIndex ( (item) => item.mentor.toString () === mentorId);

        if (favoriteMentorIndex === -1) {
            return res.status (404).json ({message: "Mentor not found in favorites"});
        }

        user.favoriteMentors.splice (favoriteMentorIndex, 1);

        const menteeIndex = mentor.mentees.findIndex ( (item) => item.user.toString () === userId);

        if (menteeIndex !== -1) {
            mentor.mentees.splice (menteeIndex, 1);
        }

        const updatedUser = await user.save ();
        const updatedMentor = await mentor.save ();

        const userWithoutPasswordAndToken = await User.findById (updatedUser._id).select ("-password -token");

        return res.status (200).json ({user: userWithoutPasswordAndToken, message: "Mentor Removed from Favorites"});
    } catch (error) {
        console.error (error);
        return res.status (500).json ({message: "Server error"});
    }
});


/**
 * @swagger
 * /users/faculties:
 *   get:
 *     summary: Get all faculties
 *     tags : [User]
 *     responses:
 *       200:
 *         description: Returns a list of all faculties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 faculties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MentorFaculty'
 *       400:
 *         description: No faculty found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     MentorFaculty:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID of the faculty.
 *         name:
 *           type: string
 *           description: The name of the faculty.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the faculty was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the faculty was last updated.
 *       required:
 *         - _id
 *         - name
 *         - createdAt
 *         - updatedAt
 */
// Get all Faculties
router.get ("/faculties", async (req, res) => {
    try {
        let faculties = await MentorFaculty.find ().sort ({createdAt: "desc"});
        if (! faculties) {
            return res.status (400).send ({message: "No Faculty Found"});
        }
        res.status (200).send ({faculties: faculties});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

// Get all Averts
router.get ("/adverts", async (req, res) => {
    try {
        let ads = await Advert.find ().sort ({createdAt: "desc"});
        if (! ads) {
            return res.status (400).send ({message: "No Advert Found"});
        }
        res.status (200).send ({adverts: ads});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

// Set up Agenda job scheduler
const agenda = new Agenda ({
    db: {
        address: process.env.DATABASE_URL
    }
});

// agenda.define('generate-result-pdf', async(job) => {
//     const { userId, level, semester } = job.attrs.data;
//     console.log(userId);

//     // Get user's data from the database
//     const user = await User.findById(userId);

//     // Compile EJS template with user's data
//     const html = await ejs.renderFile(path.join(__dirname, '..', 'views', 'result_mockup.ejs'), {
//         user,
//         level,
//         semester,
//     });

//     // Launch Puppeteer
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     // Set the HTML content of the page to the EJS-compiled HTML
//     await page.setContent(html);

//     // Generate PDF file using Puppeteer
//     const filePath = path.join(__dirname, '..', 'results', `Result_${user.firstname}.pdf`);
//     await page.pdf({
//         path: filePath,
//         format: 'A4',
//         printBackground: true,
//         pageOptions: {
//             width: '1366px',
//             height: '768px'
//         },
//         margin: {
//             top: '1in',
//             bottom: '1in'
//         },
//         displayHeaderFooter: true,
//         preferCSSPageSize: true,
//         scale: 1
//     });

//     // Save PDF file to database
//     //   const pdfData = fs.readFileSync(filePath);
//     //   await User.findByIdAndUpdate(userId, {
//     //     $push: {
//     //       pdfFiles: {
//     //         data: pdfData,
//     //         name: filePath
//     //       }
//     //     }
//     //   });

//     // Close the browser
//     await browser.close();
// });

agenda.define ("generate-result-pdf", async (job) => {
    const {
        firstname,
        lastname,
        education,
        profilePhoto,
        logo,
        level,
        semester,
        gpa
    } = job.attrs.data;

    // Compile EJS template with user's data
    const html = await ejs.renderFile (path.join (__dirname, "..", "views", "result_mockup.ejs"), {
        firstname,
        lastname,
        education,
        profilePhoto,
        logo,
        level,
        semester,
        gpa
    });

    // Launch Puppeteer
    const browser = await puppeteer.launch ();
    const page = await browser.newPage ();

    // Set the HTML content of the page to the EJS-compiled HTML
    await page.setContent (html);

    const {PDFDocument} = require ("pdf-lib");

    // Generate an image of the page using Puppeteer
    const screenshotPath = path.join (__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.png`);
    await page.screenshot ({path: screenshotPath, fullPage: true});

    // Convert the image to a PDF
    const pdfPath = path.join (__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.pdf`);
    const pngImageBytes = fs.readFileSync (screenshotPath);
    const pdfDoc = await PDFDocument.create ();
    const pdfPage = pdfDoc.addPage ();
    const pngImage = await pdfDoc.embedPng (pngImageBytes);
    const {width, height} = pngImage.scale (1);
    pdfPage.setSize (width, height);
    pdfPage.drawImage (pngImage, {
        x: 0,
        y: 0,
        width,
        height
    });
    const pdfBytes = await pdfDoc.save ();
    fs.writeFileSync (pdfPath, pdfBytes);

    // Close the browser
    await browser.close ();
});

// Generating PDF Result
// router.post("/generate-pdf-result", async(req, res) => {
//     try {
//         const { userId, inputs } = req.body;
//         const level = inputs.level;
//         const semester = inputs.semester;
//         let gpa;

//         if (semester === "all") {
//             gpa = await gpaSchema.find({ level, userId: userId });
//         } else {
//             gpa = await gpaSchema.find({ semester, level, userId: userId });
//         }

//         if (!gpa || gpa.length === 0) {
//             return res.status(404).send({ message: "You do not have a Result for this Level and Semester" });
//         }

//         const { education, firstname, lastname, profilePhoto } = await User.findById(userId);

//         const { logo } = await Institutions.findOne({
//             institution: education.institution
//         }, { logo: 1 });

//         // Schedule job to generate PDF
//         // await agenda.schedule('in 1 minute', 'generate-result-pdf', { userId, level, semester });

//         await agenda.now('generate-result-pdf', {
//             firstname,
//             lastname,
//             education,
//             profilePhoto,
//             logo,
//             level,
//             semester,
//             gpa
//         });

//         res.status(200).send({ message: 'Result Generated Successfully. Click the Link to Download the Result' });

//     } catch (error) {
//         console.log(error);
//         res.status(500).send({ message: 'Internal Server Error' });
//     }
// });

router.post ("/generate-pdf-result", async (req, res) => {
    try {
        const {userId, inputs} = req.body;
        const level = inputs.level;
        const semester = inputs.semester;
        let gpa;

        if (semester === "all") {
            gpa = await gpaSchema.find ({level, userId: userId});
        } else {
            gpa = await gpaSchema.find ({semester, level, userId: userId});
        }

        if (! gpa || gpa.length === 0) {
            return res.status (404).send ({message: "You do not have a Result for this Level and Semester"});
        }

        const {education, firstname, lastname, profilePhoto} = await User.findById (userId);

        const {logo} = await Institutions.findOne ({
            institution: education.institution
        }, {logo: 1});

        const html = await ejs.renderFile (path.join (__dirname, "..", "views", "result_mockup.ejs"), {
            firstname,
            lastname,
            education,
            profilePhoto,
            logo,
            level,
            semester,
            gpa
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch ();
        const page = await browser.newPage ();

        // Set the HTML content of the page to the EJS-compiled HTML
        await page.setContent (html);

        // const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

        // Generate an image of the page using Puppeteer
        const screenshotPath = path.join (__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.jpg`);
        await page.setViewport ({
            width: 1200, // increase the width
            height: 1600, // increase the height
            deviceScaleFactor: 2, // Increase pixel density
        });
        await page.screenshot ({path: screenshotPath, fullPage: true, type: "jpeg", quality: 100});

        // Convert the image to a PDF
        // const pdfPath = path.join(__dirname, '..', 'results', `Result_${firstname}_Level_${level}_Semester_${semester}.pdf`);
        // const pngImageBytes = fs.readFileSync(screenshotPath);
        // const pdfDoc = await PDFDocument.create();
        // const pdfPage = pdfDoc.addPage();
        // const pngImage = await pdfDoc.embedPng(pngImageBytes);
        // const { width, height } = pngImage.scale(1);
        // pdfPage.setSize(width, height);
        // pdfPage.drawImage(pngImage, {
        //     x: 0,
        //     y: 0,
        //     width,
        //     height
        // });
        // const pdfBytes = await pdfDoc.save();
        // fs.writeFileSync(pdfPath, pdfBytes);

        // // Close the browser
        // await browser.close();

        const folderName = "results";
        const uploadResult = await cloudinary.uploader.upload (screenshotPath, {folder: folderName});

        const imageUrl = uploadResult.secure_url;

        const fileName = `Result_${firstname}_Level_${level}_Semester_${semester}.jpeg`;

        res.status (200).send ({url: imageUrl, filename: fileName, message: "Result Generated Successfully. Click the Link to Download the Result"});
    } catch (error) {
        console.log (error);
        res.status (500).send ({message: "Internal Server Error"});
    }
});

router.get ("/mentors/:mentorId/ratings", async (req, res) => {
    try {
        const {mentorId} = req.params;

        // Check if mentor exists
        const mentor = await Mentors.findById (mentorId);
        if (! mentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        // Get all ratings for the mentor
        const ratings = mentor.rating;

        res.status (200).json ({ratings});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});


/**
 * @swagger
 * /users/stories/{userId}:
 *   post:
 *     summary: Create or add a story for a user
 *     tags:
 *       - User
 *     description: Create a new story or add a story item to an existing story for the specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user to create or update the story for.
 *         schema:
 *           type: string
 *       - in: formData
 *         name: file
 *         required: true
 *         description: The file to upload for the story item.
 *         schema:
 *           type: file
 *       - in: formData
 *         name: data
 *         required: true
 *         description: JSON string containing additional data for the story item.
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: string
 *                 description: JSON string containing additional data for the story item.
 *                 example: '{"id": "123", "name": "Story Name", "avatar": "avatar.jpg", "link": "https://example.com", "linkText": "Read More", "fileType": "image"}'
 *     responses:
 *       200:
 *         description: The updated list of stories and a success message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stories:
 *                   type: array
 *                   description: List of stories.
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *                 message:
 *                   type: string
 *                   description: A message confirming the successful creation or update of the story.
 *                   example: Story Posted Successfully!
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that a server error occurred.
 *                   example: Internal Server Error
 */


router.post ("/stories/:userId", upload3.single ("file"), async (req, res) => {
    let story = null;
    try {
        const {
            id,
            name,
            avatar,
            link,
            linkText,
            fileType
        } = JSON.parse (req.body.data);

        story = await Story.findOne ({id: id});

        // const uploadStory = await cloudinary.uploader.upload (req.file.path, {folder: folderName});

        if (story) {
            const lastItem = story.items[story.items.length - 1];
            const lastItemId = parseInt (lastItem.id.split ("-")[1]);
            const newItemId = `${id}-${
                lastItemId + 1
            }`;

            await Story.updateOne ({
                id: id
            }, {
                $push: {
                    items: {
                        id: newItemId,
                        type: fileType,
                        src: req.file.path,
                        preview: req.file.path,
                        link,
                        linkText
                    }
                }
            });

            const stories = await Story.find ();
            res.status (200).send ({stories: stories, message: "Story Posted Successfully!"});
        } else {
            story = await Story.create ({
                id: id,
                photo: avatar,
                name: name,
                items: [
                    {
                        id: `${id}-1`,
                        type: fileType,
                        src: req.file.path,
                        preview: req.file.path,
                        link: link,
                        linkText: linkText
                    },
                ]
            });

            const stories = await Story.find ();
            res.status (200).send ({stories: stories, message: "Story Posted Successfully!"});
        }
    } catch (error) {
        console.error ("Error", error);
        res.status (500).json ({error: "Internal Server Error"});
    }
});

/**
 * @swagger
 * /users/stories:
 *   get:
 *     summary: Get all stories
 *     tags:
 *       - User
 *     description: Retrieves all stories from the database.
 *     responses:
 *       200:
 *         description: The list of stories.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Story'
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that a server error occurred.
 *                   example: Internal Server Error
 */

router.get ("/stories", async (req, res) => {
    try { // Retrieve all stories from the database
        const stories = await Story.find ();

        // Send the stories as the response
        res.status (200).json (stories);
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Internal Server Error"});
    }
});


/**
 * @swagger
 * /users/stories/{userId}:
 *   get:
 *     summary: Get user's stories
 *     tags:
 *       - User
 *     description: Retrieves the stories for the user with the specified ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose stories should be retrieved.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user's stories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Story'
 *       404:
 *         description: No stories found for the specified user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that no stories were found.
 *                   example: No stories found for the user
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that a server error occurred.
 *                   example: Internal Server Error
 */

router.get ('/stories/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user's stories by their ID
        const stories = await Story.find ({id: userId});

        if (stories.length === 0) {
            return res.status (404).json ({message: 'No stories found for the user'});
        }

        res.status (200).json ({stories});
    } catch (error) {
        res.status (500).json ({message: 'Internal Server Error', error});
    }
});

/**
 * @swagger
 * /users/stories/{userId}/{itemId}:
 *   delete:
 *     summary: Delete item from story
 *     tags:
 *       - User
 *     description: Deletes an item from the story of a user with the specified ID.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user whose story contains the item.
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         description: The ID of the item to be deleted from the story.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The item was deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A success message indicating that the item was deleted.
 *                   example: Story item deleted successfully
 *       404:
 *         description: The story or item was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the story or item was not found.
 *                   example: Story not found or Item not found in story
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that a server error occurred.
 *                   example: Internal Server Error
 */


// DELETE /users/stories/:userId/:itemId
router.delete ('/stories/:userId/:itemId', async (req, res) => {
    const userId = req.params.userId;
    const itemId = req.params.itemId;

    try { // Find the story with the given user ID
        const story = await Story.findOne ({id: userId});

        if (! story) {
            return res.status (404).json ({message: 'Story not found'});
        }

        // Find the item with the given ID
        const itemIndex = story.items.findIndex ( (item) => item._id.toString () === itemId);

        if (itemIndex === -1) {
            return res.status (404).json ({message: 'Item not found in story'});
        }

        // Remove the item from the story's items array
        story.items.splice (itemIndex, 1);

        // Save the updated story
        await story.save ();

        return res.status (200).json ({message: 'Story item deleted successfully'});
    } catch (error) {
        console.error ('Error deleting story item:', error);
        return res.status (500).json ({message: 'Internal Server Error', error: error.message});
    }
});

/**
 * @swagger
 * /users/share-post:
 *   post:
 *     summary: Share a post to live feed
 *     tags:
 *       - User
 *     description: Create and share a post with media files.
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: userId
 *         required: true
 *         type: string
 *         description: The ID of the user sharing the post.
 *       - in: formData
 *         name: content
 *         required: true
 *         type: string
 *         description: The content of the post.
 *       - in: formData
 *         name: file
 *         required: false
 *         type: file
 *         description: Media file(s) to be included in the post. Multiple files can be uploaded.
 *     responses:
 *       200:
 *         description: Post shared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating successful post sharing.
 *                   example: Post shared successfully.
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error.
 *                   example: Server error.
 */

// POST route to save a new post
router.post ("/share-post", upload4.array ("file", 10), async (req, res) => {
    try {
        const {userId, content} = req.body;
        const files = req.files;

        // Create an array of media objects with the URLs and types from Cloudinary
        const media = files.map ( (file) => ({
            url: file.path,
            type: file.mimetype.includes ("image") ? "image" : "video"
        }));

        // Create a new post instance
        const newPost = new Post ({userId, content, media});

        // Save the post to the database
        await newPost.save ();

        // Populate the userId field with additional user data
        await newPost.populate ("userId", "firstname lastname profilePhoto personal");

        res.status (200).json ({message: "Post shared successfully", post: newPost});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});


/**
 * @swagger
 * /users/posts:
 *   get:
 *     summary: Get all posts
 *     tags:
 *       - User
 *     description: Retrieve all posts from the database, sorted by 'createdAt' field in descending order, and populated with user details.
 *     responses:
 *       200:
 *         description: Successful operation. Returns all posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error.
 *                   example: Server error.
 */


// GET route to fetch all posts sorted by the latest
router.get ("/posts", async (req, res) => {
    try { // Retrieve all posts from the database, sort by 'createdAt' field in descending order, and populate the 'userId' field
        const posts = await Post.find ().sort ({createdAt: -1}).populate ("userId", "firstname lastname profilePhoto personal");

        res.status (200).json (posts);
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});


/**
 * @swagger
 * /users/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags:
 *       - User
 *     description: Deletes a post based on the provided ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the post to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the post was deleted successfully.
 *                   example: Post deleted successfully.
 *       404:
 *         description: Post not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the post was not found.
 *                   example: Post not found.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating an internal server error.
 *                   example: Internal server error.
 */

// Delete Post based on ID
router.delete ("/posts/:id", async (req, res) => {
    const {id} = req.params;
    try { // Find the post by ID
        const post = await Post.findById (id);

        // Check if the post exists
        if (! post) {
            return res.status (404).json ({message: "Post not found"});
        }
        // Delete the post
        await post.deleteOne ();
        res.json ({message: "Post deleted successfully"});
    } catch (error) {
        console.error ("Error deleting post:", error);
        res.status (500).json ({message: "Internal server error"});
    }
});

/**
 * @swagger
 * /users/posts/{postId}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags:
 *       - User
 *     description: Likes or unlikes a post based on the provided post ID and user ID.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post to be liked or unliked.
 *         schema:
 *           type: string
 *       - in: body
 *         name: userId
 *         required: true
 *         description: The ID of the user performing the like or unlike action.
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the post was liked or unliked successfully.
 *                   example: Post liked/unliked successfully.
 *       404:
 *         description: Post not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the post was not found.
 *                   example: Post not found.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating an internal server error.
 *                   example: Internal server error.
 */

router.post ('/posts/:postId/like', async (req, res) => {
    const {postId} = req.params;
    const {userId} = req.body;

    try {
        const post = await Post.findById (postId).populate ("userId", "firstname lastname profilePhoto");

        // Check if the post exists
        if (! post) {
            return res.status (404).json ({message: 'Post not found'});
        }

        // Check if the post already has the user's like
        const isLiked = post.likes.some ( (like) => like.user.toString () === userId);

        if (isLiked) { // Unlike the post
            post.likes = post.likes.filter ( (like) => like.user.toString () !== userId);

            // Delete the notification for the unliked post
            await Notification.deleteOne ({
                recipient: post.userId,
                sender: userId,
                action: {
                    $regex: 'liked your post'
                }
            });
        } else { // Like the post
            post.likes.push ({user: userId});

            // Check if the user is the owner of the post
            if (post.userId.toString () !== userId) { // Create a notification for the post owner
                const user = await User.findById (userId);
                const fullName = user ? `${
                    user.firstname
                } ${
                    user.lastname
                }` : 'Unknown User';

                const postText = post.content ? `"${
                    post.content.substring (0, 100)
                }..."` : '...';

                const notification = new Notification ({
                    recipient: post.userId, // Post owner's ID
                    sender: userId, // Liked user's ID
                    action: `${fullName} liked your post on the live feed ${postText}`,
                    isSystemNotification: false
                });

                await notification.save ();
            }
        }

        const updatedPost = await post.save ();

        res.status (200).json ({message: 'Post liked/unliked successfully', post: updatedPost});
    } catch (error) {
        console.error (error);
        res.status (500).json ({message: 'Internal server error'});
    }
});


/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags:
 *       - User
 *     description: Adds a comment to the specified post based on the provided post ID.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post to add a comment to.
 *         schema:
 *           type: string
 *       - in: body
 *         name: Comment
 *         required: true
 *         description: The comment to be added.
 *         schema:
 *           type: object
 *           properties:
 *             user:
 *               type: string
 *               description: The user who posted the comment.
 *             text:
 *               type: string
 *               description: The content of the comment.
 *     responses:
 *       200:
 *         description: Comment posted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the comment was posted successfully.
 *                   example: Comment posted successfully.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating an internal server error.
 *                   example: Internal server error.
 */

// Route to handle posting a comment
router.post ("/posts/:postId/comments", async (req, res) => {
    try { // Find the post based on the provided postId
        const post = await Post.findById (req.params.postId).populate ("userId", "firstname lastname profilePhoto");


        // Create a new comment object with the user and text
        const newComment = {
            user: req.body.user,
            text: req.body.text
        };

        // Add the new comment to the post's comments array
        post.comments.push (newComment);

        // Save the updated post
        const updatedPost = await post.save ();

        // Check if the post belongs to the user commenting
        if (post.userId.toString () !== req.body.user) { // Create a notification for the post owner
            const user = await User.findById (req.body.user);
            const fullName = user ? `${
                user.firstname
            } ${
                user.lastname
            }` : "Unknown User";
            const postText = post.content ? `"${
                post.content.substring (0, 100)
            }..."` : "...";
            const notification = new Notification ({recipient: post.userId, sender: req.body.user, action: `${fullName} commented on your post: ${postText}`, isSystemNotification: false});

            // Save the notification
            await notification.save ();
        }

        res.status (200).json ({message: "Comment posted successfully", post: updatedPost});
    } catch (error) { // Handle any errors that occurred during the request
        console.error (error);
        res.status (500).json ({message: "Internal server error"});
    }
});


/**
 * @swagger
 * /posts/{postId}:
 *   get:
 *     summary: Get a specific post
 *     tags:
 *       - User
 *     description: Retrieves a specific post based on the provided post ID.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The requested post.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: No post found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that no post was found.
 *                   example: No Post Found
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating an internal server error.
 *                   example: Internal Server Error
 */

router.get ("/posts/:postId", async (req, res) => {
    try {
        let post = await Post.findById (req.params.postId).populate ("userId", "firstname lastname profilePhoto").populate ({
            path: "comments",
            populate: {
                path: "user",
                select: "firstname lastname profilePhoto"
            }
        }).populate ({path: "comments.replies.user", select: "firstname lastname profilePhoto"});

        if (! post) {
            return res.status (400).send ({message: "No Post Found"});
        }
        res.status (200).send ({post: post});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/user-posts/:userId", async (req, res) => {
    const {userId} = req.params;

    try {
        // Retrieve posts of a particular user from the database,
        // sort by 'createdAt' field in descending order,
        // and populate the 'userId' field with 'firstname', 'lastname', and 'profilePhoto'
        const posts = await Post.find ({userId}).sort ({createdAt: -1}).populate ("userId", "firstname lastname profilePhoto");

        res.status (200).json (posts);
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});


/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/replies:
 *   post:
 *     summary: Create a reply comment
 *     tags:
 *       - User
 *     description: Creates a reply comment for a specific post and comment.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: The ID of the post.
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: The ID of the comment.
 *         schema:
 *           type: string
 *       - in: body
 *         name: replyComment
 *         required: true
 *         description: The reply comment object.
 *         schema:
 *           type: object
 *           properties:
 *             user:
 *               type: string
 *               description: The ID of the user creating the reply comment.
 *             text:
 *               type: string
 *               description: The text content of the reply comment.
 *     responses:
 *       201:
 *         description: Reply comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the successful creation of the reply comment.
 *                   example: Reply comment created successfully
 *       404:
 *         description: Post or comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the post or comment was not found.
 *                   example: Post not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: Server error
 */


// POST /posts/:postId/comments/:commentId/replies
router.post ('/posts/:postId/comments/:commentId/replies', async (req, res) => {
    try {
        const {postId, commentId} = req.params;
        const {user, text} = req.body;

        // Find the post by postId
        const post = await Post.findById (postId);

        if (! post) {
            return res.status (404).json ({error: 'Post not found'});
        }

        // Find the comment within the post by commentId
        const comment = post.comments.find ( (c) => c._id.toString () === commentId);

        if (! comment) {
            return res.status (404).json ({error: 'Comment not found'});
        }

        // Create the reply comment
        const replyComment = {
            user,
            text
        };

        // Add the reply comment to the comment's replies array
        comment.replies.push (replyComment);

        // Save the post
        await post.save ();

        res.status (201).json ({message: 'Reply comment created successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Server error'});
    }
});

/**
 * @swagger
 * /users/people-you-know/{userId}:
 *   get:
 *     summary: Get recommended people you may know
 *     tags:
 *       - User
 *     description: Retrieves a list of recommended people you may know based on specific criteria.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *       - in: query
 *         name: course_of_study
 *         description: The course of study filter.
 *         schema:
 *           type: string
 *       - in: query
 *         name: current_level
 *         description: The current level filter.
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         description: The department filter.
 *         schema:
 *           type: string
 *       - in: query
 *         name: institution
 *         description: The institution filter.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommended people retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 people:
 *                   type: array
 *                   description: An array of recommended people.
 *                   items:
 *                     type: object
 *                     properties:
 *                       firstname:
 *                         type: string
 *                         description: The first name of the recommended person.
 *                       lastname:
 *                         type: string
 *                         description: The last name of the recommended person.
 *                       profilePhoto:
 *                         type: string
 *                         description: The profile photo URL of the recommended person.
 *                       education:
 *                         type: object
 *                         description: The education details of the recommended person.
 *                         properties:
 *                           institution:
 *                             type: string
 *                             description: The institution attended by the recommended person.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the user was not found.
 *                   example: User not found
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: Internal Server Error
 */

router.get ('/people-you-know/:userId', async (req, res) => {
    try {
        const {userId} = req.params;
        const {course_of_study, current_level, department, institution} = req.query;

        // Check if the user exists
        const user = await User.findById (userId);
        if (! user) {
            return res.status (404).json ({error: 'User not found'});
        }

        const userIdObject = new mongoose.Types.ObjectId (userId);

        // Optimize the aggregation pipeline
        const pipeline = [
            {
                $match: {
                    _id: {
                        $ne: userIdObject
                    }
                }
            }, { // Exclude the user with the given userId
                $match: {
                    $or: [
                        {
                            'education.course_of_study': course_of_study
                        }, {
                            'education.current_level': current_level
                        }, {
                            'education.department': department
                        }, {
                            'education.institution': institution
                        }
                    ]
                }
            }, {
                $sample: {
                    size: 4
                }
            }, { // Select 4 random documents
                $project: {
                    firstname: 1,
                    lastname: 1,
                    profilePhoto: 1,
                    "education.institution": 1
                }
            }

            // Select the desired fields
        ];

        const users = await User.aggregate (pipeline);

        // If the number of matching documents is less than 4, adjust the number of results
        const totalCount = await User.countDocuments ({
            $or: [
                {
                    'education.course_of_study': course_of_study
                }, {
                    'education.current_level': current_level
                }, {
                    'education.department': department
                }, {
                    'education.institution': institution
                }
            ]
        });
        const adjustedSize = Math.min (users.length, totalCount);

        res.json ({
            people: users.slice (0, adjustedSize)
        });
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Internal Server Error'});
    }
});

/**
 * @swagger
 * /users/update-livefeed-settings/{userId}:
 *   post:
 *     summary: Update live feed settings
 *     tags:
 *       - User
 *     description: Update the live feed settings for a user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: liveFeedSettings
 *         required: true
 *         description: The live feed settings object.
 *         schema:
 *           type: object
 *           properties:
 *             about:
 *               type: boolean
 *               description: The flag indicating whether to show about information in the live feed.
 *             personal_details:
 *               type: boolean
 *               description: The flag indicating whether to show personal details in the live feed.
 *             edu_details:
 *               type: boolean
 *               description: The flag indicating whether to show education details in the live feed.
 *             contact_details:
 *               type: boolean
 *               description: The flag indicating whether to show contact details in the live feed.
 *             friends_list:
 *               type: boolean
 *               description: The flag indicating whether to show the friends list in the live feed.
 *     responses:
 *       200:
 *         description: Live feed settings updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The updated user object with sensitive fields excluded.
 *                 message:
 *                   type: string
 *                   description: A message indicating the successful update of live feed settings.
 *                   example: Live feed settings updated successfully
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the user was not found.
 *                   example: User not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: Server error
 */

router.post ("/update-livefeed-settings/:userId", async (req, res) => {
    const userId = req.params.userId;
    const {
        about,
        username,
        personal_details,
        edu_details,
        contact_details,
        friends_list
    } = req.body;

    try {
        const user = await User.findById (userId);
        if (! user) {
            return res.status (404).json ({error: "User not found"});
        }

        // Update the liveFeedSettings object
        user.liveFeedSettings = {
            about,
            username,
            personal_details: personal_details,
            edu_details: edu_details,
            contact_details: contact_details,
            friends_list: friends_list
        };

        // Save the updated user
        await user.save ();

        // Fetch the user again to exclude sensitive fields
        const updatedUser = await User.findById (userId).select ("-token -password");

        res.status (200).json ({user: updatedUser, message: "Live feed settings updated successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});

/**
 * @swagger
 * /user/author/{id}:
 *   get:
 *     summary: Get a post author details by ID
 *     tags:
 *       - User
 *     description: Retrieves the details of a post author by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the author.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Author details retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 author:
 *                   type: object
 *                   description: The author details.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: The ID of the author.
 *                       example: 60e7a4b573e2ab0015c2158b
 *                     name:
 *                       type: string
 *                       description: The name of the author.
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       description: The email of the author.
 *                       example: johndoe@example.com
 *                     createdAt:
 *                       type: string
 *                       description: The creation date of the author.
 *                       example: 2021-07-08T12:30:45.000Z
 *                     updatedAt:
 *                       type: string
 *                       description: The last update date of the author.
 *                       example: 2021-07-15T09:20:15.000Z
 *       404:
 *         description: Author not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the author was not found.
 *                   example: Author not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: An error occurred while fetching author details.
 */

router.get ('/author/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const author = await User.findById (id).select ('-token -password').populate ("friends.userId", "firstname lastname profilePhoto");

        if (! author) {
            return res.status (404).json ({error: 'Author not found'});
        }

        res.json ({author});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while fetching author details.'});
    }
});


/**
 * @swagger
 * /users/posts/media/{type}/{userId}:
 *   get:
 *     summary: Get post media by type and user ID
 *     tags:
 *       - User
 *     description: Retrieves the media of posts based on the specified type and user ID.
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         description: The type of media.
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post media retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: The type of media.
 *                     example: image
 *                   url:
 *                     type: string
 *                     description: The URL of the media.
 *                     example: https://example.com/media/image.jpg
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: Internal server error
 */

router.get ('/posts/media/:type/:userId', async (req, res) => {
    const {type, userId} = req.params;

    const userIdObject = new mongoose.Types.ObjectId (userId);
    try {
        const posts = await Post.find ({'media.type': type, userId: userIdObject});

        const media = posts.flatMap ( (post) => post.media);
        res.json (media);
    } catch (error) {
        console.error ('Error fetching post media:', error);
        res.status (500).json ({error: 'Internal server error'});
    }
});


/**
 * @swagger
 * /users/become-mentor/{userId}:
 *   post:
 *     summary: Submit mentor application
 *     tags:
 *       - User
 *     description: Submits a mentor application for the specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: mentorApplication
 *         required: true
 *         description: The mentor application object.
 *         schema:
 *           type: object
 *           properties:
 *             skills:
 *               type: string
 *               description: The skills of the mentor.
 *             faculty:
 *               type: string
 *               description: The faculty of the mentor.
 *             briefDescription:
 *               type: string
 *               description: A brief description of the mentor.
 *             mentorshipReason:
 *               type: string
 *               description: The reason for applying to be a mentor.
 *             linkedinProfile:
 *               type: string
 *               description: The LinkedIn profile URL of the mentor.
 *             facebookUsername:
 *               type: string
 *               description: The Facebook username of the mentor.
 *             twitterHandle:
 *               type: string
 *               description: The Twitter handle of the mentor.
 *     responses:
 *       200:
 *         description: Mentor application submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the successful submission of the mentor application.
 *                   example: Mentor application submitted successfully
 *       400:
 *         description: Bad request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that required fields are missing or empty.
 *                   example: Please fill in all required fields.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the user was not found.
 *                   example: User not found
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 *                   example: Failed to submit mentor application
 */

router.post ('/become-mentor/:userId', (req, res) => {
    const userId = req.params.userId;

    // Check if the user exists
    User.findById (userId).then ( (user) => {
        if (!user) {
            return res.status (404).json ({error: 'User not found'});
        }

        // Extract the form values from the request body
        const {
            skills,
            faculty,
            briefDescription,
            mentorshipReason,
            linkedinProfile,
            facebookUsername,
            twitterHandle,
            googleMeet
        } = req.body;

        // Check if required fields are empty
        if (!skills || !faculty || !briefDescription || !mentorshipReason) {
            return res.status (400).json ({error: 'Please fill in all required fields.'});
        }

        // Create a new mentor application instance
        const mentorApplication = new MentorApplication ({
            userId,
            skills,
            faculty,
            about: briefDescription,
            reason: mentorshipReason,
            linkedin: linkedinProfile,
            facebook: facebookUsername,
            twitterHandle,
            googleMeet
        });

        // Save the mentor application to the database
        mentorApplication.save ().then ( () => {
            res.json ({message: 'Mentor application submitted successfully'});
        }).catch ( (error) => {
            console.error (error);
            res.status (500).json ({error: 'Failed to submit mentor application'});
        });
    }).catch ( (error) => {
        console.error (error);
        res.status (500).json ({error: 'Failed to check user existence'});
    });
});

/**
 * @swagger
 * /users/notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     tags:
 *       - User
 *     description: Retrieves the notifications for a specific user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   description: An array of notifications for the user.
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the notification.
 *                       sender:
 *                         type: object
 *                         description: The sender of the notification.
 *                         properties:
 *                           firstname:
 *                             type: string
 *                             description: The first name of the sender.
 *                           lastname:
 *                             type: string
 *                             description: The last name of the sender.
 *                           profilePhoto:
 *                             type: string
 *                             description: The profile photo URL of the sender.
 *                       date:
 *                         type: string
 *                         description: The date of the notification.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 */

router.get ('/notifications/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find ({recipient: userId}).populate ("sender", "firstname lastname profilePhoto").sort ({date: -1});
        res.json ({notifications});
    } catch (error) {
        console.error (error);
        res.status (500).json ({message: error.message});
    }
});


/**
 * @swagger
 * /users/send-friend-request:
 *   post:
 *     summary: Send a friend request
 *     tags:
 *       - User
 *     description: Sends a friend request from one user to another.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *                 description: The ID of the sender user.
 *               receiverId:
 *                 type: string
 *                 description: The ID of the receiver user.
 *     responses:
 *       200:
 *         description: Friend request sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating that the friend request was sent successfully.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that a server error occurred while sending the friend request.
 */

// Route for sending a friend request
router.post ('/send-friend-request', async (req, res) => {
    try {
        const {senderId, receiverId} = req.body;

        // Check if the friend request already exists
        const existingRequest = await FriendRequest.findOne ({sender: senderId, receiver: receiverId});

        if (existingRequest) {
            return res.status (400).json ({error: 'Friend request already sent to this user.'});
        }

        // Create a new friend request
        const friendRequest = new FriendRequest ({sender: senderId, receiver: receiverId});

        // Save the friend request to the database
        const savedFriendRequest = await friendRequest.save ();

        res.status (200).json ({message: 'Request sent successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while sending the friend request.'});
    }
});


/**
 * @swagger
 * /users/friend-request/{userId}/{id}:
 *   get:
 *     summary: Get friend requests for a user
 *     tags:
 *       - User
 *     description: Retrieves all friend requests where the user is either the sender or receiver.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the second user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend requests retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friendRequests:
 *                   type: array
 *                   description: An array of friend requests.
 *                   items:
 *                     type: object
 *                     properties:
 *                       sender:
 *                         type: string
 *                         description: The ID of the sender user.
 *                       receiver:
 *                         type: string
 *                         description: The ID of the receiver user.
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                         description: The status of the friend request.
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the friend request was created.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that a server error occurred while retrieving friend requests.
 */

router.get ('/friend-request/:userId/:id', async (req, res) => {
    try {
        const {userId, id} = req.params;

        // Find friend requests where the user is the sender or receiver
        const friendRequests = await FriendRequest.findOne ({
            $or: [
                {
                    sender: userId,
                    receiver: id
                }, {
                    sender: id,
                    receiver: userId
                },
            ]
        });

        res.status (200).json ({friendRequests});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while retrieving friend requests.'});
    }
});


/**
 * @swagger
 * /users/friend-requests/{requestId}:
 *   delete:
 *     summary: Delete a friend request
 *     tags:
 *       - User
 *     description: Deletes a friend request by its ID.
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         description: The ID of the friend request to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the successful deletion.
 *       404:
 *         description: Friend request not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the friend request was not found.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 */

router.delete ('/friend-requests/:requestId', async (req, res) => {
    try {
        const {requestId} = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById (requestId);

        if (! friendRequest) {
            return res.status (404).json ({error: 'Friend request not found'});
        }

        // Delete the friend request
        await FriendRequest.deleteOne ({_id: requestId});

        res.status (200).json ({message: 'Friend request deleted successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while deleting the friend request'});
    }
});

/**
 * @swagger
 * /users/friend-requests/accept/{requestId}:
 *   put:
 *     summary: Accept a friend request
 *     tags:
 *       - User
 *     description: Accepts a friend request by updating its status to 'accepted' and adding the users as friends.
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         description: The ID of the friend request.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend request accepted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the successful acceptance of the friend request.
 *       404:
 *         description: Friend request not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that the friend request was not found.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating that a server error occurred while accepting the friend request.
 */

router.put ('/friend-requests/accept/:requestId', async (req, res) => {
    try {
        const {requestId} = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById (requestId);

        if (! friendRequest) {
            return res.status (404).json ({error: 'Friend request not found'});
        }

        // Update the status to 'accepted'
        friendRequest.status = 'accepted';

        // Save the updated friend request
        const updatedFriendRequest = await friendRequest.save ();

        // Add receiver as a friend of the sender
        await User.findByIdAndUpdate (friendRequest.sender, {
            $push: {
                friends: {
                    userId: friendRequest.receiver
                }
            }
        });

        // Add sender as a friend of the receiver
        await User.findByIdAndUpdate (friendRequest.receiver, {
            $push: {
                friends: {
                    userId: friendRequest.sender
                }
            }
        });

        // Create a notification for the friend request acceptance
        const senderUser = await User.findById (friendRequest.sender);
        const receiverUser = await User.findById (friendRequest.receiver);
        const fullName = `${
            receiverUser.firstname
        } ${
            receiverUser.lastname
        }`;
        const notificationMessage = `${fullName} has accepted your Buddy Request. You can now chat on Acadaboo.`;

        const notification = new Notification ({recipient: friendRequest.sender, sender: friendRequest.receiver, action: notificationMessage, isSystemNotification: true});

        // Save the notification to the database
        await notification.save ();

        res.status (200).json ({message: 'Friend request accepted successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while accepting the friend request'});
    }
});

/**
 * @swagger
 * /users/all-friend-requests/{userId}:
 *   get:
 *     summary: Get all pending friend requests for a user
 *     tags:
 *       - User
 *     description: Retrieves all pending friend requests for a specific user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friend requests retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friendRequests:
 *                   type: array
 *                   description: An array of pending friend requests for the user.
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the friend request.
 *                       sender:
 *                         type: object
 *                         description: The sender of the friend request.
 *                         properties:
 *                           firstname:
 *                             type: string
 *                             description: The first name of the sender.
 *                           lastname:
 *                             type: string
 *                             description: The last name of the sender.
 *                           profilePhoto:
 *                             type: string
 *                             description: The profile photo URL of the sender.
 *                       created_at:
 *                         type: string
 *                         description: The creation date of the friend request.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: A message indicating a server error occurred.
 */

router.get ('/all-friend-requests/:userId', async (req, res) => {
    try {
        const {userId} = req.params;

        // Find all friend requests where the user is the receiver and the status is 'pending'
        const friendRequests = await FriendRequest.find ({receiver: userId, status: 'pending'}).populate ('sender', 'firstname lastname profilePhoto personal')

        res.status (200).json ({friendRequests});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while retrieving friend requests'});
    }
});


/**
 * @swagger
 * /users/unfriend/{requestId}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Unfriend a user
 *     description: Unfriend a user by deleting a friend request and removing from friend lists
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         description: ID of the friend request to be unfriended
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfriended successfully
 *       404:
 *         description: Friend request not found
 *       500:
 *         description: An error occurred while unfriending
 */

router.delete ('/unfriend/:requestId', async (req, res) => {
    try {
        const {requestId} = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById (requestId);

        if (! friendRequest) {
            return res.status (404).json ({error: 'Friend request not found'});
        }

        // Delete the friend request document
        await FriendRequest.deleteOne ({_id: requestId});

        // Remove the sender from the receiver's friend list
        await User.findByIdAndUpdate (friendRequest.receiver, {
            $pull: {
                friends: {
                    userId: friendRequest.sender
                }
            }
        });

        // Remove the receiver from the sender's friend list
        await User.findByIdAndUpdate (friendRequest.sender, {
            $pull: {
                friends: {
                    userId: friendRequest.receiver
                }
            }
        });

        res.status (200).json ({message: 'Unfriended successfully'});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while unfriending'});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for user-related operations
 * 
 * /users/count-mutual-friends/{user1Id}/{user2Id}:
 *   get:
 *     summary: Count Mutual Friends
 *     description: Count the number of mutual friends between two users
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: user1Id
 *         required: true
 *         description: ID of the first user
 *         schema:
 *           type: string
 *           example: 613d6d5c58d8e56094869ea2
 *       - in: path
 *         name: user2Id
 *         required: true
 *         description: ID of the second user
 *         schema:
 *           type: string
 *           example: 613d6d5c58d8e56094869ea3
 *     responses:
 *       200:
 *         description: Mutual friends count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mutualFriendsCount:
 *                   type: number
 *                   description: Number of mutual friends between the two users
 *                   example: 3
 *       404:
 *         description: One or both users not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating which user was not found
 *       500:
 *         description: An error occurred while retrieving mutual friends count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get ('/count-mutual-friends/:user1Id/:user2Id', async (req, res) => {
    try {
        const {user1Id, user2Id} = req.params;

        // Find user1
        const user1 = await User.findById (user1Id).populate ('friends.userId');

        if (! user1) {
            return res.status (404).json ({error: 'User1 not found'});
        }

        // Find user2
        const user2 = await User.findById (user2Id).populate ('friends.userId');

        if (! user2) {
            return res.status (404).json ({error: 'User2 not found'});
        }

        // Get the list of user1's friend userIds
        const user1FriendIds = user1.friends.map ( (friend) => friend.userId.toString ());

        // Get the list of user2's friend userIds
        const user2FriendIds = user2.friends.map ( (friend) => friend.userId.toString ());

        // Calculate the mutual friends count
        const mutualFriendsCount = user1FriendIds.filter ( (friendId) => user2FriendIds.includes (friendId)).length;

        res.status (200).json ({mutualFriendsCount});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while retrieving mutual friends count'});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for user-related operations
 * 
 * /users/check-username:
 *   post:
 *     summary: Check Username Availability
 *     description: Check if the given username is available or suggest alternative usernames if it's already taken
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username to be checked
 *                 example: john_doe
 *     responses:
 *       200:
 *         description: Username availability checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taken:
 *                   type: boolean
 *                   description: Indicates if the username is taken or not
 *                 suggestedUsernames:
 *                   type: array
 *                   description: Array of suggested alternative usernames (if the given username is taken)
 *                   items:
 *                     type: string
 *                     example: john_doe_123, john_doe_456
 *       500:
 *         description: An error occurred while checking the username
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.post ('/check-username', async (req, res) => {
    try {
        const {username} = req.body;

        // Check if the username already exists in the database
        const existingUser = await User.findOne ({'liveFeedSettings.username': username});

        if (existingUser) { // Username already taken, suggest alternative usernames
            const suggestedUsernames = generateSuggestedUsernames (username);
            res.status (200).json ({taken: true, suggestedUsernames});
        } else { // Username is available
            res.status (200).json ({taken: false});
        }
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while checking the username.'});
    }
});


const generateSuggestedUsernames = (username) => {
    const suggestedUsernames = [];
    const MAX_SUFFIX = 4; // Maximum numeric suffix to be appended

    for (let i = 1; i <= MAX_SUFFIX; i++) {
        const suggestedUsername = `${username}${i}`;
        suggestedUsernames.push (suggestedUsername);
    }

    return suggestedUsernames;
};

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing user friends
 * 
 * /user/friends/{userId}:
 *   get:
 *     summary: Get User Friends
 *     description: Get all friends of a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user friends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Friend'  # Replace with the correct schema reference for the Friend model
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get ('/friends/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById (userId).populate ('friends.userId', 'firstname lastname liveFeedSettings.username liveFeedSettings.onlineStatus education.institution profilePhoto personal');

        if (! user) {
            return res.status (404).json ({message: 'User not found'});
        }

        res.json ({friends: user.friends});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: 'Server Error'});
    }
});


/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing user messages
 * 
 * /users/messages/user/{userId}:
 *   get:
 *     summary: Get User Messages
 *     description: Get all messages sent or received by a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'  # Replace with the correct schema reference for the Message model
 *       500:
 *         description: Failed to fetch messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */


// Route to get all messages of a user
router.get ('/messages/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const messages = await Chat.find ({
            $or: [
                {
                    'sender': userId
                }, {
                    'receiver': userId
                },
            ]
        }).sort ({timeSent: 1});
        res.status (200).json (messages);
    } catch (error) {
        res.status (500).json ({error: 'Failed to fetch messages'});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing chat status
 * 
 * /users/chat-status/{userId}:
 *   put:
 *     summary: Update Chat Status
 *     description: Update the chat status of a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *       - in: body
 *         name: chatStatus
 *         required: true
 *         description: The new chat status value
 *         schema:
 *           type: object
 *           properties:
 *             chatStatus:
 *               type: string
 *               example: "online"  # Replace with possible chat status values
 *     responses:
 *       200:
 *         description: Chat status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'  # Replace with the correct schema reference for the User model
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to update chat status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Route to change the chat status of a user
router.put ('/chat-status/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const {chatStatus} = req.body;
        // Update the chat status of the user
        const updatedUser = await User.findByIdAndUpdate (userId, {
            'liveFeedSettings.onlineStatus': chatStatus
        }, {new: true}).select ("-password -token").populate ('friends.userId', 'firstname lastname profilePhoto');

        if (! updatedUser) {
            return res.status (404).json ({error: 'User not found'});
        }

        res.status (200).json ({message: 'Chat status updated successfully', user: updatedUser});
    } catch (error) {
        console.log ('Error updating chat status:', error);
        res.status (500).json ({error: 'Failed to update chat status'});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing chat status
 * 
 * /users/chat-status/{userId}:
 *   get:
 *     summary: Get Chat Status
 *     description: Get the chat status of a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatStatus:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to retrieve chat status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get ('/chat-status/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Retrieve the user's chat status
        const user = await User.findById (userId).select ('liveFeedSettings.onlineStatus');

        if (! user) {
            return res.status (404).json ({error: 'User not found'});
        }

        const chatStatus = user.liveFeedSettings.onlineStatus;

        res.status (200).json ({chatStatus});
    } catch (error) {
        console.log ('Error retrieving chat status:', error);
        res.status (500).json ({error: 'Failed to retrieve chat status'});
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing chat messages
 * 
 * /users/update-message-status/{receiverId}/{senderId}:
 *   put:
 *     summary: Update Message Status
 *     description: Update the status of chat messages between two users
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: receiverId
 *         required: true
 *         description: ID of the receiver user
 *         schema:
 *           type: string
 *       - in: path
 *         name: senderId
 *         required: true
 *         description: ID of the sender user
 *         schema:
 *           type: string
 *       - in: body
 *         name: messages
 *         required: true
 *         description: Array of message objects containing messageId and status to update
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [sent, delivered, seen]
 *     responses:
 *       200:
 *         description: Message statuses updated successfully
 *       404:
 *         description: Chat not found
 *       500:
 *         description: An error occurred while updating message statuses
 */


router.put ('/update-message-status/:receiverId/:senderId', async (req, res) => {

    const {receiverId, senderId} = req.params;
    const {messages} = req.body;

    try {
        const chat = await Chat.findOne ({
            $or: [
                {
                    sender: senderId,
                    receiver: receiverId
                }, {
                    sender: receiverId,
                    receiver: senderId
                }
            ]
        });

        if (! chat) {
            return res.status (404).json ({message: 'Chat not found'});
        }

        messages.forEach ( (update) => {
            const message = chat.messages.find ( (msg) => msg._id.toString () === update.messageId);
            if (message) { // Update the status of the corresponding message
                message.status = update.status;
            }
        });

        await chat.save ();

        // Respond with a success message or status code (200 OK)
        res.json ({message: 'Message statuses updated successfully'});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: 'Error updating message statuses'});
    }
});

/**
 * @swagger
 * /users/send-message:
 *   post:
 *     tags:
 *       - User
 *     summary: Send a message
 *     description: Send a message from one user to another user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID of the sender user
 *                   model:
 *                     type: string
 *                     enum: [user, Mentors]
 *                     description: Type of the sender model (user or Mentors)
 *               receiver:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID of the receiver user
 *                   model:
 *                     type: string
 *                     enum: [user, Mentors]
 *                     description: Type of the receiver model (user or Mentors)
 *               content:
 *                 type: string
 *                 description: The content of the message
 *               timeSent:
 *                 type: string
 *                 format: date-time
 *                 description: The timestamp of when the message was sent
 *               status:
 *                 type: string
 *                 enum: [sent, delivered, seen]
 *                 default: sent
 *                 description: The status of the message
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       500:
 *         description: An error occurred while sending the message
 */

// POST route to send a message
router.post ('/send-message', async (req, res) => {
    try {
        const message = req.body;
        // Assuming the message object is sent in the request body

        // Save the message to the database using Mongoose
        const newMessage = {
            sender: message.sender._id,
            receiver: message.receiver._id,
            content: message.content,
            timeSent: message.timeSent,
            status: message.status
        };

        // Find the chat between sender A and receiver B
        let chat = await Chat.findOne ({sender: message.sender._id, receiver: message.receiver._id});

        if (! chat) { // Check if the reverse chat exists between sender B and receiver A
            chat = await Chat.findOne ({sender: message.receiver._id, receiver: message.sender._id});
        }

        if (! chat) { // Create a new chat if neither chat exists
            chat = new Chat ({
                sender: message.sender._id,
                receiver: message.receiver._id,
                senderModel: message.sender.model,
                receiverModel: message.receiver.model,
                messages: [newMessage]
            });
        } else { // Add the new message to the messages array
            chat.messages.push (newMessage);
        }

        // Save the chat document
        await chat.save ();

        // Respond with a success message or status code (200 OK)
        res.json ({message: 'Message sent successfully'});
    } catch (error) {
        console.error ('Error sending message:', error);
        res.status (500).json ({error: 'An error occurred while sending the message'});
    }
});


module.exports = router;
