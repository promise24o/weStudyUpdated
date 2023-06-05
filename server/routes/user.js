const cloudinary = require ("cloudinary").v2;
const {CloudinaryStorage} = require ("multer-storage-cloudinary");
const router = require ("express").Router ();
const bcrypt = require ("bcrypt");

const Token = require ("../models/Token");
const sendEmail = require ("../utils/sendEmail");
const crypto = require ("crypto");

const ejs = require ("ejs");
const fs = require ("fs");
const path = require ("path");
const puppeteer = require ("puppeteer");
const {PDFDocument, StandardFonts, rgb} = require ("pdf-lib");

// Models
const {User, validate} = require ("../models/Users");
const Admin = require ("../models/Admin");
const Post = require ("../models/Post");
const Activity = require ("../models/Activities");
const Institutions = require ("../models/Institutions");
const gpaSchema = require ("../models/Gpa");
const Story = require ("../models/Story");
const {MentorFaculty, Mentors, Schedule} = require ("../models/Mentors");
const Advert = require ("../models/Adverts");
const multer = require ("multer");
const Agenda = require ("agenda");

// Configure Cloudinary credentials
cloudinary.config ({cloud_name: "dbb2dkawt", api_key: "474957451451999", api_secret: "yWE3adlqWuUOG0l3JjqSoIPSI-Q"});

// Configure Multer to use Cloudinary as the storage engine
const storage = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/users",
        format: async (req, file) => "png",
        public_id: (req, file) => `user-${1}`
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
const storage2 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/results",
        format: async (req, file) => "png",
        public_id: (req, file) => `result-${1}`
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload2 = multer ({
    storage: storage2,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    }
});

const storage3 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: (req, file) => {
        let format;
        let resourceType;

        if (file.mimetype.includes ("image")) {
            format = "png";
            resourceType = "image";
        } else if (file.mimetype.includes ("video")) {
            format = "mp4";
            resourceType = "video";
        } else {
            throw new Error ("Invalid file type");
        }

        const randomDigit = Math.floor (Math.random () * 10); // Generate a random digit (0-9)

        const params = {
            folder: "/stories",
            format: format,
            public_id: `story-${randomDigit}`,
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
            format = "png";
            resourceType = "image";
        } else if (file.mimetype.includes ("video")) {
            format = "mp4";
            resourceType = "video";
        } else {
            throw new Error ("Invalid file type");
        }

        const randomDigit = Math.floor (Math.random () * 10); // Generate a random digit (0-9)

        const params = {
            folder: "/post",
            format: format,
            public_id: `post-${randomDigit}`,
            resource_type: resourceType
        };

        if (format === "mp4") {
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
        const {city, contact_address, gender, userId} = req.body;
        const updatedUser = await User.findOneAndUpdate ({
            _id: userId
        }, {
            $set: {
                "personal.city": city,
                "personal.contact_address": contact_address,
                "personal.gender": gender
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
    try { // check if user exists
        let mentors = await Mentors.find ().populate ("faculty").sort ({createdAt: "desc"});
        if (! mentors) {
            return res.status (400).send ({message: "No Mentor Found"});
        }
        res.status (200).send ({mentors: mentors});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

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
        const mentor = await Mentors.findOne ({_id: mentorId}).populate ("faculty").populate ({path: "rating.user", select: "firstname lastname profilePhoto"});
        res.status (200).json ({mentor});
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

        // Check if mentor exists
        const mentor = await Mentors.findById (mentorId);
        if (! mentor) {
            return res.status (404).json ({message: "Mentor not found"});
        }

        // Check if user has already rated this mentor
        const userRatingIndex = mentor.rating.findIndex ( (rating) => rating.user === userId);

        if (userRatingIndex !== -1) { // Update existing rating
            mentor.rating[userRatingIndex].review = review;
            mentor.rating[userRatingIndex].rating = rating;
            mentor.rating[userRatingIndex].createdAt = Date.now ();
        } else { // Create new rating object
            const ratingObj = {
                review,
                rating,
                user: userId,
                createdAt: Date.now ()
            };

            // Add rating to mentor's ratings array
            mentor.rating.push (ratingObj);
        }

        // Save mentor document
        const updatedMentor = await mentor.save ();
        res.status (200).json ({mentor: updatedMentor, message: "Rating submitted successfully"});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
    }
});

/**
 * @swagger
 * /users/confirm-schedule/{mentorId}/{userId}:
 *   post:
 *     summary: Confirm a meeting schedule with a mentor
 *     tags :   [User]
 *     description: Confirms a meeting schedule between a user and a mentor, and saves it in the database.
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
 *         schema:
 *           type: object
 *           properties:
 *             event_type:
 *               type: string
 *               description: Type of the event (e.g. meeting).
 *             location:
 *               type: object
 *               properties:
 *                 join_url:
 *                   type: string
 *                   description: URL to join the meeting.
 *                 status:
 *                   type: string
 *                   description: Status of the meeting (e.g. 'pending', 'approved').
 *                 type:
 *                   type: string
 *                   description: Type of the meeting (e.g. 'online', 'in-person').
 *             name:
 *               type: string
 *               description: Name of the event.
 *             start_time:
 *               type: string
 *               format: date-time
 *               description: Start time of the event in ISO format.
 *             end_time:
 *               type: string
 *               format: date-time
 *               description: End time of the event in ISO format.
 *             status:
 *               type: string
 *               description: Status of the schedule (e.g. 'confirmed', 'cancelled').
 *             created_at:
 *               type: string
 *               format: date-time
 *               description: Time when the schedule was created in ISO format.
 *             updated_at:
 *               type: string
 *               format: date-time
 *               description: Time when the schedule was last updated in ISO format.
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

// Confirm Meeting Schedule
router.post ("/confirm-schedule/:mentorId/:userId", async (req, res) => {
    try {
        const {mentorId, userId} = req.params;
        const {
            event_type,
            location,
            name,
            start_time,
            end_time,
            status,
            created_at,
            updated_at
        } = req.body;

        const schedule = new Schedule ({
            userId: userId,
            mentorId: mentorId,
            eventType: event_type,
            eventName: name,
            startTime: start_time,
            endTime: end_time,
            location: {
                joinUrl: location.join_url,
                status: location.status,
                type: location.type
            },
            createdAt: created_at,
            updatedAt: updated_at,
            status: status
        });

        await schedule.save ();

        res.status (200).json ({message: "Meeting Schedule Confirmed!"});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: "Server Error"});
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
        const schedules = await Schedule.find ({userId, mentorId});
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
        const user = await User.findById (userId);

        if (! user) {
            return res.status (404).json ({message: "User not found"});
        }

        const favoriteMentor = {
            mentor: mentorId,
            dateAdded: Date.now ()
        };

        user.favoriteMentors.push (favoriteMentor);
        const updatedUser = await user.save ();

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

        const favoriteMentorIndex = user.favoriteMentors.findIndex ( (item) => item.mentor.toString () === mentorId);

        if (favoriteMentorIndex === -1) {
            return res.status (404).json ({message: "Mentor not found in favorites"});
        }

        user.favoriteMentors.splice (favoriteMentorIndex, 1);
        const updatedUser = await user.save ();

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

    const {PDFDocument, StandardFonts, rgb} = require ("pdf-lib");

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

        const folderName = "stories";
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

// DELETE /users/stories/:userId/:itemId
router.delete ('/stories/:userId/:itemId', async (req, res) => {
    const userId = req.params.userId;
    const itemId = req.params.itemId;

    try { // Find the story with the given user ID
        const story = await Story.findOne ({id: userId});

        if (! story) {
            return res.status (404).json ({message: 'Story not found'});
        }

        // Find the index of the item with the given ID
        const itemIndex = story.items.findIndex ( (item) => item.id === itemId);

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
        const savedPost = await newPost.save ();

        res.status (200).send ({message: "Post shared successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});

// GET route to fetch all posts sorted by the latest
router.get ("/posts", async (req, res) => {
    try { // Retrieve all posts from the database, sort by 'createdAt' field in descending order, and populate the 'userId' field
        const posts = await Post.find ().sort ({createdAt: -1}).populate ("userId", "firstname lastname profilePhoto");

        res.status (200).json (posts);
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "Server error"});
    }
});

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

router.post ("/posts/:postId/like", async (req, res) => {
    const {postId} = req.params;
    const {userId} = req.body;

    try {
        const post = await Post.findById (postId);

        // Check if the post exists
        if (! post) {
            return res.status (404).json ({message: "Post not found"});
        }

        // Check if the post already has the user's like
        const isLiked = post.likes.some ( (like) => like.user.toString () === userId);

        if (isLiked) { // Unlike the post
            post.likes = post.likes.filter ( (like) => like.user.toString () !== userId);
        } else { // Like the post
            post.likes.push ({user: userId});
        }

        await post.save ();

        res.status (200).json ({message: "Post liked/unliked successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).json ({message: "Internal server error"});
    }
});

// Route to handle posting a comment
router.post ("/posts/:postId/comments", async (req, res) => {
    try { // Find the post based on the provided postId
        const post = await Post.findById (req.params.postId);

        // Create a new comment object with the user and text
        const newComment = {
            user: req.body.user,
            text: req.body.text
        };

        // Add the new comment to the post's comments array
        post.comments.push (newComment);

        // Save the updated post
        await post.save ();

        res.status (200).json ({message: "Comment posted successfully"});
    } catch (error) { // Handle any errors that occurred during the request
        console.error (error);
        res.status (500).json ({message: "Internal server error"});
    }
});

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


module.exports = router;
