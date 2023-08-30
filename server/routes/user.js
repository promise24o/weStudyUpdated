const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const Token = require("../models/Token");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const moment = require('moment');
const OneSignal = require('@onesignal/node-onesignal');
const B2 = require('backblaze-b2');
const axios = require('axios');


const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// Models
const { User } = require("../models/Users");
const Post = require("../models/Post");
const Activity = require("../models/Activities");
const Institutions = require("../models/Institutions");
const gpaSchema = require("../models/Gpa");
const Story = require("../models/Story");
const { MentorFaculty, Mentors, Schedule } = require("../models/Mentors");
const Advert = require("../models/Adverts");
const multer = require("multer");
const Agenda = require("agenda");
const MentorApplication = require("../models/MentorApplication");
const Notification = require("../models/Notifications");
const FriendRequest = require("../models/FriendRequest");
const Chat = require("../models/Chat");
const { Reels, ReelsBookmark } = require("../models/Reels");
const { EventCategory, Event, Bookmark, EventBookmark, ReportEvent, EventNotification } = require("../models/Events");
const { ListingCategory, Listing, ListingBookmark, ReportListing, MarketplaceMessage, ListingUserFollowing, MarketplaceRecentActivity, ListingNotification } = require("../models/MarketPlace");
const { DonorApplication, DonorNotification, RaiseApplication, RaiseCategory } = require("../models/Donors");
const BankDetails = require("../models/BankDetails");


const applicationKeyId = process.env.BACKBLAZE_APP_KEY_ID;
const applicationKey = process.env.BACKBLAZE_APP_KEY;

const b2 = new B2({
    applicationKeyId: applicationKeyId,
    applicationKey: applicationKey
});

// async function GetBucket() {
//     try {
//         await b2.authorize();  
//         let response = await b2.getBucket({ bucketName: 'acadaboo' });
//         console.log(response.data);
//     } catch (err) {
//         console.log('Error getting bucket:', err);
//     }
// }

// Create a multer storage engine
const storage10 = multer.memoryStorage();

const upload10 = multer({
    storage: storage10,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});


// Configure Cloudinary credentials
cloudinary.config({ cloud_name: process.env.CLOUD_NAME, api_key: process.env.CLOUD_API, api_secret: process.env.CLOUD_SECRET });

// Configure Multer to use Cloudinary as the storage engine
const randomString = crypto.randomBytes(8).toString('hex');

const storage6 = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "/events",
        format: async () => "jpg",
        public_id: () => randomString
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload6 = multer({
    storage: storage6,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    }
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "/users",
        format: async () => "png",
        public_id: () => randomString
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage3 = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let format;
        let resourceType;

        if (file.mimetype.includes("image")) {
            format = "jpg";
            resourceType = "image";
        } else if (file.mimetype.includes("video")) {
            format = "mp4";
            resourceType = "video";
        }
        // else {
        //     throw new Error ("Invalid file type");
        // }

        const randomString = crypto.randomBytes(8).toString('hex'); // Generate a random string (8 characters)
        const fileName = `${randomString}`; // Combine the random string

        const params = {
            folder: "/stories",
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


const upload3 = multer({
    storage: storage3,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
        fieldSize: 12 * 1024 * 1024, // 10MB field size limit (adjust as needed)
    }
});

const storage4 = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        let format;
        let resourceType;

        if (file.mimetype.includes("image")) {
            format = "jpg";
            resourceType = "image";
        } else if (file.mimetype.includes("video")) {
            format = "mp4";
            resourceType = "video";
        }
        // else {
        //     throw new Error ("Invalid file type");
        // }

        const randomString = crypto.randomBytes(8).toString('hex'); // Generate a random string (8 characters)
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

const upload4 = multer({
    storage: storage4,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
        fieldSize: 12 * 1024 * 1024, // 10MB field size limit (adjust as needed)
    }
});

const storage5 = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: () => {
        let format;
        let resourceType;

        format = "mp4";
        resourceType = "video";

        const randomString = crypto.randomBytes(8).toString('hex');
        const params = {
            folder: "/reels",
            format: format,
            public_id: `${randomString}`,
            resource_type: resourceType
        };

        params.transformation = [{
            duration: 25
        },]; // Set the maximum duration to 25 seconds for videos
        params.allowed_formats = ["mp4"]; // Allow only mp4 format for videos

        return params;
    }
});



const upload5 = multer({
    storage: storage5,
    limits: {
        fileSize: 20 * 1024 * 1024, // 10MB file size limit
        fieldSize: 20 * 1024 * 1024, // 10MB field size limit (adjust as needed)
    }
});



router.get("/", function (req, res) {
    res.send("User API");
});


// Setup OneSignal 
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;


const app_key_provider = {
    getToken() {
        return ONESIGNAL_API_KEY;
    }
};


const configuration = OneSignal.createConfiguration({
    authMethods: {
        app_key: {
            tokenProvider: app_key_provider
        }
    }
});

const client = new OneSignal.DefaultApi(configuration);

// Set up Agenda job scheduler
const agenda = new Agenda({
    db: {
        address: process.env.DATABASE_URL
    }
});


// Define job for sending notifications to goingParticipants
agenda.define('send-notification', async (job) => {
    const { event, action } = job.attrs.data;

    const eventDoc = await Event.findById(event);
    if (!eventDoc) {
        console.error(`Event ${event} not found.`);
        return;
    }

    const recipients = [
        ...eventDoc.goingParticipants.map(participant => participant.user.toString()),
        ...eventDoc.interestedParticipants.map(participant => participant.user.toString())
    ];

    // Remove duplicates from the recipients array
    const uniqueRecipients = recipients.filter((userId, index) => recipients.indexOf(userId) === index);

    // Iterate through the unique recipients array and send notifications
    for (const userId of uniqueRecipients) {

        // Create and save a new event notification for each recipient
        const newNotification = new EventNotification({
            recipient: userId,
            event: eventDoc._id,
            action,
            date: new Date(),
            isRead: false,
            isSystemNotification: true
        });
        await newNotification.save();
    }

    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.included_segments = ['All'];
    notification.contents = {
        en: action
    };
    await client.createNotification(notification);

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


router.get("/:id/verify/:token", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id });
        if (!user) {
            return res.status(404).send({ message: "This User Does not Exists" });
        }

        const token = await Token.findOne({ userId: user._id, token: req.params.token });
        if (!token) {
            return res.status(404).send({ message: "Error: Invalid Link" });
        }

        await User.updateOne({
            _id: user._id
        }, { verified: true });
        await token.deleteOne();

        const updatedUser = await User.findOne({ _id: user._id });

        res.status(200).send({ user: updatedUser, message: "Email Verified Successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).send({ message: "You have already verified your email" });
        }

        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.post("/resend-verify-email-link", async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });

        const token = await Token.findOneAndUpdate({
            userId: user._id
        }, {
            token: crypto.randomBytes(32).toString("hex"),
            createdAt: Date.now()
        }, {
            upsert: true,
            new: true
        });

        // construct the file path using the path.join() method
        const filePath = path.join(__dirname, "..", "emails", "verify_email.ejs");

        // read the HTML content from a file
        let template = fs.readFileSync(filePath, "utf8");

        const urlLink = `${process.env.CLIENT_BASE_URL
            }/users/${user._id
            }/verify/${token.token
            }`;

        // compile the EJS template with the url variable
        let html = ejs.render(template, { url: urlLink });

        await sendEmail(user.email, "Verify Email", html);

        res.status(201).send({ message: "Verification Email Sent Successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.get("/institutions", async (req, res) => {
    try {
        let institutions = await Institutions.find({ type: req.query.type });
        res.status(201).send({ institutions: institutions });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/update-education-info", async (req, res) => {
    try {
        const {
            type,
            institution,
            current_level,
            faculty,
            department,
            course_of_study,
            study_mode,
            userId,
            accountType
        } = req.body;

        let updatedUser;

        if (accountType === "high-school") {
            const {
                highSchool,
                currentClass,
                subjectMajor,
                pJambYear,
                pInstitutionType,
                pInstitution,
                pFaculty,
                pDepartment,
                pCourse,
                pStudyMode
            } = req.body;
            updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        "highSchoolEducation.highSchool": highSchool,
                        "highSchoolEducation.currentClass": currentClass,
                        "highSchoolEducation.subjectMajor": subjectMajor,
                        "highSchoolEducation.pJambYear": pJambYear,
                        "highSchoolEducation.pInstitutionType": pInstitutionType,
                        "highSchoolEducation.pInstitution": pInstitution,
                        "highSchoolEducation.pFaculty": pFaculty,
                        "highSchoolEducation.pDepartment": pDepartment,
                        "highSchoolEducation.pCourse": pCourse,
                        "highSchoolEducation.pStudyMode": pStudyMode
                    }
                },
                { new: true }
            ).select("-password -token");
        } else if (accountType === "jambite") {
            const {
                highSchool,
                graduationYear,
                subjectMajor,
                pJambYear,
                pInstitutionType,
                pInstitution,
                pFaculty,
                pDepartment,
                pCourse,
                pStudyMode
            } = req.body;
            updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        "jambiteEducation.highSchool": highSchool,
                        "jambiteEducation.graduationYear": graduationYear,
                        "jambiteEducation.subjectMajor": subjectMajor,
                        "jambiteEducation.pJambYear": pJambYear,
                        "jambiteEducation.pInstitutionType": pInstitutionType,
                        "jambiteEducation.pInstitution": pInstitution,
                        "jambiteEducation.pFaculty": pFaculty,
                        "jambiteEducation.pDepartment": pDepartment,
                        "jambiteEducation.pCourse": pCourse,
                        "jambiteEducation.pStudyMode": pStudyMode
                    }
                },
                { new: true }
            ).select("-password -token");
        } else {
            updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        "education.institution_type": type,
                        "education.institution": institution,
                        "education.current_level": current_level,
                        "education.faculty": faculty,
                        "education.department": department,
                        "education.course_of_study": course_of_study,
                        "education.study_mode": study_mode
                    }
                },
                { new: true }
            ).select("-password -token");
        }

        res.status(200).send({ user: updatedUser, message: "Updated Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/update-personal-info", async (req, res) => {
    try {
        const {
            city,
            contact_address,
            gender,
            phone,
            dob,
            userId
        } = req.body;
        const updatedUser = await User.findOneAndUpdate({
            _id: userId
        }, {
            $set: {
                "personal.phone": phone,
                "personal.city": city,
                "personal.contact_address": contact_address,
                "personal.gender": gender,
                "personal.dob": dob
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Updated Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/change-password", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });
        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

        // Compare Passwords
        if (!isPasswordCorrect) {
            return res.status(400).send({ message: "Current password is incorrect" });
        }

        // Check Confirm Password
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).send({ message: "New password and confirm password do not match" });
        }

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        await user.save();

        res.status(200).send({ message: "Password Change Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.post("/upload-avatar/:userId", upload10.single("file"), async (req, res) => {
    const userId = req.params.userId;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No photo uploaded" });
        }

        // Upload the avatar image to Backblaze B2
        const fileName = `avatars/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const fileBuffer = req.file.buffer;

        await b2.authorize();

        const response = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const uploadResponse = await b2.uploadFile({
            uploadUrl: response.data.uploadUrl,
            uploadAuthToken: response.data.authorizationToken,
            fileName: fileName,
            data: fileBuffer,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;
        const uploadedFileName = uploadResponse.data.fileName;
        const avatarUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

        // Update the user's profile photo URL in the database
        const updatedUser = await User.findOneAndUpdate({
            _id: userId
        }, {
            $set: {
                profilePhoto: avatarUrl
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Photo Uploaded Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/enable-twofa", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

        // Compare Passwords
        if (!isPasswordCorrect) {
            return res.status(400).send({ message: "Current password is incorrect" });
        }
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                twofa: true
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "2FA Enabled Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/disable-twofa", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                twofa: false
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "2FA Disabled Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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

router.post("/update-preset-parameter", async (req, res) => {
    try {
        const { preset_para } = req.body;

        const user = await User.findOne({ _id: req.body.user });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                "preset_param.status": preset_para
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Preset Parameter Updated Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.patch("/:userId/presetParam", async (req, res) => {
    try {
        const userId = req.params.userId;
        const status = req.body.preset_param.status;

        const user = await User.findOne({ _id: userId });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                "preset_param.status": status
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Preset Parameter Updated Successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
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
router.patch("/:userId/preset-scale", async (req, res) => {
    try {
        const userId = req.params.userId;
        const scale = req.body.preset_param.scale;

        const user = await User.findOne({ _id: userId });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                "preset_param.scale": scale
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Grading Scale Updated Successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
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
router.patch("/:userId/target-cgpa", async (req, res) => {
    try {
        const userId = req.params.userId;
        const target = req.body.data.target;

        const user = await User.findOne({ _id: userId });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                targetCGPA: target
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: updatedUser, message: "Target CGPA  Updated Successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
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
router.delete("/:userId/preset_param/scale", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).select("-password -token");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.preset_param.scale = undefined;
        await user.save();

        res.status(200).send({ user: user, message: "Grading Scale Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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
router.delete("/:userId/remove-result/:resultId", async (req, res) => {
    const { userId, resultId } = req.params;
    try {
        const gpa = await gpaSchema.findOneAndDelete({ userId: userId, _id: resultId });
        if (!gpa) {
            return res.status(404).send({ message: "GPA not found" });
        }
        res.send({ message: "Result Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
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
router.delete("/:userId/remove-grade/:gradeId", async (req, res) => {
    try {
        const { gradeId, userId } = req.params;
        const user = await User.findOneAndUpdate({
            _id: userId
        }, {
            $pull: {
                "preset_param.grading": {
                    _id: gradeId
                }
            }
        }, { new: true }).select("-password -token");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).send({ user: user, message: "Grade Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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
router.post("/:userId/add-custom-grade", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { grade_symbol, grade_value } = req.body;

        const user = await User.findByIdAndUpdate(userId, {
            $push: {
                "preset_param.grading": {
                    grade_symbol,
                    grade_value
                }
            }
        }, { new: true }).select("-password -token");

        res.status(200).send({ user: user, message: "Grade Added Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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
router.get("/:id/grades", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const grading = user.preset_param.grading;
        res.json(grading);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
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
router.get("/user-activities", async (req, res) => {
    try {
        let activities = await Activity.find({ userId: req.query.user_id }).sort({ createdAt: "desc" }).limit(10);
        if (!activities) {
            return res.status(400).send({ message: "No Activities Found" });
        }
        res.status(200).send({ activities: activities });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.post("/add-gpa", async (req, res) => {
    let gpa = null;

    try {
        const {
            code,
            title,
            grade,
            symbol,
            creditUnit,
            user,
            accountType,
            semester,
            institution,
            level
        } = req.body;

        // Search for a document that matches the semester, level, and userId
        gpa = await gpaSchema.findOne({ semester, institution, level, userId: user, accountType });

        if (gpa) { // If a document is found, update the courses array
            await gpaSchema.updateOne({
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
            gpa = await gpaSchema.findOne({ semester, level, userId: user }).sort({ createdAt: "desc" });
            res.status(200).send({ gpa: gpa, message: "Course Updated Successfully!" });
        } else { // If a document is not found, create a new document with all information
            gpa = await gpaSchema.create({
                userId: user,
                level,
                semester,
                accountType,
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
            res.status(200).send({ gpa: gpa, message: "Course Added Successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
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
router.get("/user-gpa", async (req, res) => {
    try {
        let gpa = await gpaSchema.findOne({
            userId: req.query.user_id, level: req.query.level,
            semester: req.query.semester, accountType: req.query.accountType
        });

        if (!gpa) {
            return res.status(400).send({ message: "No GPA Found" });
        }
        res.status(200).send({ gpa: gpa });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.get("/:userId/get-result/:resultId", async (req, res) => {
    try {
        let gpa = await gpaSchema.findOne({ userId: req.params.userId, _id: req.params.resultId });
        if (!gpa) {
            return res.status(400).send({ message: "No GPA Found" });
        }
        res.status(200).send({ gpa: gpa });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.get("/get-user-gpa/:userId/:institutionType", async (req, res) => {
    const institution = req.params.institutionType;
    try {
        let gpa = await gpaSchema.find({ userId: req.params.userId, institution: institution });
        if (!gpa) {
            return res.status(400).send({ message: "No GPA Found" });
        }
        res.status(200).send({ gpa: gpa });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});


router.get("/get-user-result/:userId/:institutionType/:accountType", async (req, res) => {
    const userId = req.params.userId;
    const institutionType = req.params.institutionType;
    const accountType = req.params.accountType;

    try {
        let query = {
            userId: userId,
            accountType: accountType
        };

        if (accountType === "undergraduate") {
            query.institution = institutionType;
        }

        let gpa = await gpaSchema.find(query);

        if (!gpa || gpa.length === 0) {
            return res.status(400).send({ message: "No GPA Found" });
        }

        res.status(200).send({ gpa: gpa });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.get("/user-institution", async (req, res) => {
    try {
        let institution = await Institutions.findOne({ institution: req.query.institution });
        res.status(201).send({ logo: institution.logo });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.delete("/remove-course/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { user, formData } = req.body;
        const gpa = await gpaSchema.findOne({ userId: user._id, level: formData.current_level, semester: formData.semester });

        const courseIndex = gpa.courses.findIndex((course) => String(course._id) === courseId);

        if (courseIndex === -1) { // Course not found
            return res.status(404).json({ error: "Course not found" });
        }

        // Remove the course from the courses array
        gpa.courses.splice(courseIndex, 1);

        // Save the updated GPA document
        await gpa.save();

        const selectedGPAs = await gpaSchema.findOne({ userId: user._id, level: formData.current_level, semester: formData.semester });

        // const selectedGPAs = selectedCourses.map(course => course.gpa);
        res.status(200).send({ gpa: selectedGPAs, message: "Course Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get all Mentors
router.get("/mentors", async (req, res) => {
    try {
        const mentors = await Mentors.find({ status: "Approved" }).populate("faculty").sort({ createdAt: "desc" });

        if (mentors.length === 0) {
            return res.status(404).send({ message: "No approved mentors found" });
        }

        res.status(200).send({ mentors: mentors });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
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
router.get("/mentor/:id", async (req, res) => {
    try {
        const mentorId = req.params.id;
        const mentor = await Mentors.findOne({ _id: mentorId }).populate("faculty").populate({ path: "rating.user", select: "firstname lastname profilePhoto" }).populate({
            path: "sessions",
            model: "MentorSessions",
            populate: {
                path: "mentor",
                model: "Mentors"
            }
        });
        res.status(200).json({ mentor });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a Favorite Mentor based on ID
router.get("/favorite-mentor/:id/:mentorId", async (req, res) => {
    try {
        const mentorId = req.params.mentorId;
        const id = req.params.id;

        const user = await User.findById({ _id: id }).populate({
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
        }).exec();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const favoriteMentor = user.favoriteMentors.find((item) => item.mentor._id.toString() === mentorId);

        if (!favoriteMentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        res.status(200).json({ mentor: favoriteMentor });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get("/mentor/chat-status/:userId/:mentorId", async (req, res) => {
    try {
        const { userId, mentorId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const favoriteMentor = user.favoriteMentors.find((item) => item.mentor.toString() === mentorId);

        if (!favoriteMentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const chatStatus = favoriteMentor.chatStatus;

        res.status(200).json({ status: chatStatus });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
router.get("/faculty/:id", async (req, res) => {
    try {
        const facultyId = req.params.id;
        const faculty = await MentorFaculty.findOne({ _id: facultyId });
        const facultyName = faculty ? faculty.title : null;
        res.status(200).json({ facultyName });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
router.post("/submit-rating/:mentorId/:userId", async (req, res) => {
    try {
        const { mentorId, userId } = req.params;
        const { review, rating } = req.body;

        // Convert userId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId)

        // Check if mentor exists
        const mentor = await Mentors.findById(mentorId).populate("rating.user", "firstname lastname profilePhoto");
        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        // Find the user's existing rating for the mentor
        const userRating = mentor.rating.find((r) => r.user._id.equals(userObjectId));
        if (userRating) { // User has already rated, update the existing rating
            userRating.review = review;
            userRating.rating = rating;
            userRating.createdAt = Date.now();
        } else { // User has not rated yet, create a new rating object
            const newRating = {
                review,
                rating,
                user: userObjectId,
                createdAt: Date.now()
            };

            // Add the new rating to the mentor's ratings array
            mentor.rating.push(newRating);
        }

        // Save the updated mentor document
        const updatedMentor = await mentor.save();

        // Populate user information in the updated mentor
        await updatedMentor.populate("rating.user", "firstname lastname profilePhoto");

        res.status(200).json({ mentor: updatedMentor, message: "Rating submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
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
router.post('/confirm-schedule/:mentorId/:userId', async (req, res) => {
    try {
        const { mentorId, userId } = req.params;
        const {
            selectedSession,
            title,
            notes,
            startTime,
            endTime
        } = req.body;

        // Check if the user already has a schedule with the mentor
        const existingSchedule = await Schedule.findOne({ userId, mentorId, status: 'Pending' });
        if (existingSchedule) {
            return res.status(400).json({ error: 'You already have a pending schedule with this mentor' });
        }

        // Count the number of already booked sessions for the selected session
        const bookedSessionsCount = await Schedule.countDocuments({ session: selectedSession._id });

        // Check if there are available slots in the session
        if (bookedSessionsCount >= selectedSession.slots) {
            return res.status(400).json({ error: 'No available slots for this session' });
        }

        // Check if there is an existing schedule with the same start time and end time
        const existingScheduleWithSameTime = await Schedule.findOne({
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
            return res.status(400).json({ error: 'Another user has already booked a schedule within the same time' });
        }
        // Create a new schedule document
        const newSchedule = new Schedule({
            userId,
            mentorId,
            session: selectedSession,
            startTime,
            endTime,
            title,
            notes,
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Save the new schedule document to the database

        // Return the saved schedule to the client
        res.status(200).json({ message: 'Session booked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
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

router.post('/cancel-meeting/:userId/:scheduleId', async (req, res) => {
    try {
        const { userId, scheduleId } = req.params;

        // Find the schedule by scheduleId
        const schedule = await Schedule.findById(scheduleId);

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        // Check if the schedule belongs to the specified user
        if (schedule.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Delete the schedule
        await Schedule.findByIdAndDelete(scheduleId);

        res.status(200).json({ message: 'Meeting canceled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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
router.get("/schedules/:mentorId/:userId", async (req, res) => {
    try {
        const { userId, mentorId } = req.params;
        const schedules = await Schedule.find({ userId, mentorId }).populate("session", "date startTime endTime slots");
        res.json({ schedules });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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
router.post("/favorite-mentor/:mentorId/:userId", async (req, res) => {
    const { mentorId, userId } = req.params;

    try {
        const mentor = await Mentors.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const favoriteMentor = {
            mentor: mentorId,
            dateAdded: Date.now()
        };

        user.favoriteMentors.push(favoriteMentor);
        mentor.mentees.push({ user: userId, dateAdded: Date.now() });

        const updatedUser = await user.save();

        const userWithoutPasswordAndToken = await User.findById(updatedUser._id).select("-password -token");

        return res.status(200).json({ user: userWithoutPasswordAndToken, message: "Mentor Added to Favorites" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
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
router.delete("/favorite-mentor/:mentorId/:userId", async (req, res) => {
    const { mentorId, userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const mentor = await Mentors.findById(mentorId);

        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const favoriteMentorIndex = user.favoriteMentors.findIndex((item) => item.mentor.toString() === mentorId);

        if (favoriteMentorIndex === -1) {
            return res.status(404).json({ message: "Mentor not found in favorites" });
        }

        user.favoriteMentors.splice(favoriteMentorIndex, 1);

        const menteeIndex = mentor.mentees.findIndex((item) => item.user.toString() === userId);

        if (menteeIndex !== -1) {
            mentor.mentees.splice(menteeIndex, 1);
        }

        const updatedUser = await user.save();

        const userWithoutPasswordAndToken = await User.findById(updatedUser._id).select("-password -token");

        return res.status(200).json({ user: userWithoutPasswordAndToken, message: "Mentor Removed from Favorites" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
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
router.get("/faculties", async (req, res) => {
    try {
        let faculties = await MentorFaculty.find().sort({ createdAt: "desc" });
        if (!faculties) {
            return res.status(400).send({ message: "No Faculty Found" });
        }
        res.status(200).send({ faculties: faculties });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});

// Get all Averts
router.get("/adverts", async (req, res) => {
    try {
        let ads = await Advert.find().sort({ createdAt: "desc" });
        if (!ads) {
            return res.status(400).send({ message: "No Advert Found" });
        }
        res.status(200).send({ adverts: ads });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});





agenda.define("generate-result-pdf", async (job) => {
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
    const html = await ejs.renderFile(path.join(__dirname, "..", "views", "result_mockup.ejs"), {
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
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content of the page to the EJS-compiled HTML
    await page.setContent(html);

    const { PDFDocument } = require("pdf-lib");

    // Generate an image of the page using Puppeteer
    const screenshotPath = path.join(__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Convert the image to a PDF
    const pdfPath = path.join(__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.pdf`);
    const pngImageBytes = fs.readFileSync(screenshotPath);
    const pdfDoc = await PDFDocument.create();
    const pdfPage = pdfDoc.addPage();
    const pngImage = await pdfDoc.embedPng(pngImageBytes);
    const { width, height } = pngImage.scale(1);
    pdfPage.setSize(width, height);
    pdfPage.drawImage(pngImage, {
        x: 0,
        y: 0,
        width,
        height
    });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);

    // Close the browser
    await browser.close();
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

router.post("/generate-pdf-result", async (req, res) => {
    try {
        const { userId, inputs } = req.body;
        const level = inputs.level;
        const semester = inputs.semester;
        const institution = "";

        let gpa;

        if (semester === "all") {
            gpa = await gpaSchema.find({ level, userId: userId });
        } else {
            gpa = await gpaSchema.find({ semester, level, userId: userId });
        }

        if (!gpa || gpa.length === 0) {
            return res.status(404).send({ message: "You do not have a Result for this Level and Semester" });
        }

        const {
            education,
            highSchoolEducation,
            jambiteEducation,
            firstname,
            lastname,
            profilePhoto,
            accountType
        } = await User.findById(userId);

        let educationDetails = null;
        if (accountType === "undergraduate") {
            educationDetails = education;
        } else if (accountType === "high-school") {
            educationDetails = highSchoolEducation;
        } else if (accountType === "jambite") {
            educationDetails = jambiteEducation;
        }

        let institutionProperty = "institution";

        if (accountType === "high-school" || accountType === "jambite") {
            institutionProperty = "pInstitution";
        }

        // Use bracket notation to access the property dynamically
        const { logo } = await Institutions.findOne({
            institution: educationDetails[institutionProperty]
        }, { logo: 1 });


        const html = await ejs.renderFile(path.join(__dirname, "..", "views", "result_mockup.ejs"), {
            firstname,
            lastname,
            accountType,
            education: educationDetails,
            profilePhoto,
            logo,
            level,
            semester,
            gpa
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Set the HTML content of the page to the EJS-compiled HTML
        await page.setContent(html);

        // const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

        // Generate an image of the page using Puppeteer
        const screenshotPath = path.join(__dirname, "..", "results", `Result_${firstname}_Level_${level}_Semester_${semester}.jpg`);
        await page.setViewport({
            width: 1200, // increase the width
            height: 1600, // increase the height
            deviceScaleFactor: 2, // Increase pixel density
        });
        await page.screenshot({ path: screenshotPath, fullPage: true, type: "jpeg", quality: 100 });

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
        const uploadResult = await cloudinary.uploader.upload(screenshotPath, { folder: folderName });

        const imageUrl = uploadResult.secure_url;

        const fileName = `Result_${firstname}_Level_${level}_Semester_${semester}.jpeg`;

        res.status(200).send({ url: imageUrl, filename: fileName, message: "Result Generated Successfully. Click the Link to Download the Result" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

router.get("/mentors/:mentorId/ratings", async (req, res) => {
    try {
        const { mentorId } = req.params;

        // Check if mentor exists
        const mentor = await Mentors.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        // Get all ratings for the mentor
        const ratings = mentor.rating;

        res.status(200).json({ ratings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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


router.post("/stories/:userId", upload10.single("file"), async (req, res) => {
    try {
        const {
            id,
            name,
            avatar,
            link,
            linkText,
            fileType
        } = req.body;

        // Check if the file size exceeds the limit
        if (req.file.size > 20 * 1024 * 1024) {
            return res.status(400).json({ error: "File size exceeds limit (20MB)" });
        }

        let story = await Story.findOne({ id: id });

        const fileName = `stories/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const fileBuffer = req.file.buffer;

        await b2.authorize();

        const response = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const uploadResponse = await b2.uploadFile({
            uploadUrl: response.data.uploadUrl,
            uploadAuthToken: response.data.authorizationToken,
            fileName: fileName,
            data: fileBuffer,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;
        const uploadedFileName = uploadResponse.data.fileName;
        const fileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

        if (story) {
            const lastItem = story.items[story.items.length - 1];
            const lastItemId = parseInt(lastItem.id.split("-")[1]);
            const newItemId = `${id}-${lastItemId + 1}`;

            await Story.updateOne({
                id: id
            }, {
                $push: {
                    items: {
                        id: newItemId,
                        type: fileType,
                        src: fileUrl,
                        preview: fileUrl,
                        link,
                        linkText
                    }
                }
            });

            const stories = await Story.find();
            res.status(200).send({ stories: stories, message: "Story Posted Successfully!" });
        } else {
            story = await Story.create({
                id: id,
                photo: avatar,
                name: name,
                items: [
                    {
                        id: `${id}-1`,
                        type: fileType,
                        src: fileUrl,
                        preview: fileUrl,
                        link: link,
                        linkText: linkText
                    },
                ]
            });

            const stories = await Story.find();
            res.status(200).send({ stories: stories, message: "Story Posted Successfully!" });
        }
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


/**
 * @swagger
 * /users/create-reels/{user}:
 *   post:
 *     tags:
 *       - User
 *     summary: Create a new reel
 *     description: Upload a video reel along with a description for a user.
 *     parameters:
 *       - name: user
 *         in: path
 *         description: The user ID for which the reel will be created.
 *         required: true
 *         schema:
 *           type: string
 *       - name: file
 *         in: formData
 *         description: The video file to be uploaded.
 *         required: true
 *         type: file
 *       - name: data
 *         in: formData
 *         description: JSON data including description.
 *         required: true
 *         type: string
 *         example: '{"description": "A cool video reel"}'
 *     consumes:
 *       - multipart/form-data
 *     responses:
 *       200:
 *         description: Reel posted successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: Reels Posted Successfully!
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */

router.post("/create-reels/:user", upload10.single("file"), async (req, res) => {
    const userId = req.params.user;
    try {
        const {
            description
        } = JSON.parse(req.body.data);

        // Generate a sanitized filename
        const sanitizedFilename = req.file.originalname.replace(/\s+/g, '_');
        const fileName = `reels/${Date.now()}_${sanitizedFilename}`;

        // Upload the file to Backblaze B2
        await b2.authorize();
        const response = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const uploadResponse = await b2.uploadFile({
            uploadUrl: response.data.uploadUrl,
            uploadAuthToken: response.data.authorizationToken,
            fileName: fileName,
            data: req.file.buffer,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;
        const uploadedFileName = uploadResponse.data.fileName;
        const fileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

        const reels = await Reels.create({
            user: userId,
            video: fileUrl,  
            description
        });

        res.status(200).send({ message: "Reels Posted Successfully!" });

    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


/**
 * @swagger
 * /users/reels:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all reels
 *     description: Retrieve a list of all video reels along with user and comment information.
 *     responses:
 *       200:
 *         description: Success response with the list of reels.
 *         content:
 *           application/json:
 *             example:
 *               - _id: "617a8c0d0540a289f76d857a"
 *                 user:
 *                   _id: "617a8c0d0540a289f76d8579"
 *                   firstname: "John"
 *                   lastname: "Doe"
 *                   profilePhoto: "profile.jpg"
 *                   liveFeedSettings: true
 *                 video: "uploads/video.mp4"
 *                 description: "A cool video reel"
 *                 comments:
 *                   - _id: "617a8c0d0540a289f76d857b"
 *                     user:
 *                       _id: "617a8c0d0540a289f76d8579"
 *                       firstname: "Jane"
 *                       lastname: "Smith"
 *                       profilePhoto: "profile.jpg"
 *                       liveFeedSettings: true
 *                     comment: "Awesome video!"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               message: "Server Error"
 */

router.get('/reels', async (req, res) => {
    try {
        const reels = await Reels.find()
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto liveFeedSettings',
            })
            .populate({
                path: 'comments.user',
                select: 'firstname lastname profilePhoto liveFeedSettings',
            }).sort({ createdAt: -1 })
            .exec();
        res.json(reels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @swagger
 * /users/update-reel-view/{reelId}:
 *   put:
 *     tags:
 *       - User
 *     summary: Update reel views
 *     description: Update the views of a reel by adding the user who viewed it.
 *     parameters:
 *       - name: reelId
 *         in: path
 *         description: The ID of the reel to update views for
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: body
 *         description: The ID of the user who viewed the reel
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *     responses:
 *       200:
 *         description: Reel views updated successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: Reel views updated successfully.
 *       404:
 *         description: Reel not found.
 *         content:
 *           application/json:
 *             example:
 *               message: Reel not found.
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             example:
 *               message: An error occurred.
 */
router.put('/update-reel-view/:reelId', async (req, res) => {
    const { reelId } = req.params;
    const { userId } = req.body;

    try {
        const reel = await Reels.findById(reelId);

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        reel.views.push({ user: userId });
        reel.save();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
    }
});

/**
 * @swagger
 * /users/delete-reel/{reelId}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete a reel
 *     description: Delete a reel by its ID.
 *     parameters:
 *       - name: reelId
 *         in: path
 *         description: The ID of the reel to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reel deleted successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: Reel deleted successfully.
 *       404:
 *         description: Reel not found.
 *         content:
 *           application/json:
 *             example:
 *               message: Reel not found.
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             example:
 *               message: An error occurred.
 */
router.delete('/delete-reel/:reelId', async (req, res) => {
    const { reelId } = req.params;

    try {
        const deleteReel = await Reels.findByIdAndDelete(reelId);

        if (!deleteReel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        return res.json({ message: 'Reel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred' });
    }
});


/**
 * @swagger
 * /users/reels/like/{reelId}:
 *   post:
 *     summary: Like a reel
 *     description: Like a reel by providing the reel ID and user ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: reelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the reel.
 *       - in: body
 *         name: userId
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               description: ID of the user who is liking the reel.
 *         required: true
 *     responses:
 *       200:
 *         description: Reel liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: You have already liked this reel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       404:
 *         description: Reel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to like/unlike a reel
router.post('/reels/like/:reelId', async (req, res) => {
    const { reelId } = req.params;
    const { userId } = req.body;

    try {
        const reel = await Reels.findById(reelId).populate({
            path: 'user',
            select: 'firstname lastname profilePhoto liveFeedSettings',
        })
            .populate({
                path: 'comments.user',
                select: 'firstname lastname profilePhoto liveFeedSettings',
            })
            .exec();;

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        // Check if the user has already liked the reel
        const existingLike = reel.likes.find(like => like.user.toString() === userId);

        if (existingLike) {
            // User has already liked the reel, so remove the like
            reel.likes = reel.likes.filter(like => like.user.toString() !== userId);
            await reel.save();
            res.json({ message: 'Reel unliked successfully', reel });
        } else {
            // User has not liked the reel, so add the like
            reel.likes.push({ user: userId });
            await reel.save();
            res.json({ message: 'Reel liked successfully', reel });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/reels/comments/like/{commentId}:
 *   post:
 *     summary: Like or unlike a comment on a reel
 *     description: Like or unlike a comment on a reel. If already liked, remove the like.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the comment to like or unlike.
 *       - in: body
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user liking the comment.
 *     responses:
 *       200:
 *         description: Comment liked/unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post('/reels/comments/like/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { userId } = req.body;

    try {
        const reel = await Reels.findOne({ 'comments._id': commentId }).populate({
            path: 'user',
            select: 'firstname lastname profilePhoto liveFeedSettings',
        })
            .populate({
                path: 'comments.user',
                select: 'firstname lastname profilePhoto liveFeedSettings',
            })
            .exec();;;

        if (!reel) {
            return res.status(404).json({ message: 'Comment or Reel not found' });
        }

        const comment = reel.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user has already liked the comment
        const existingLike = comment.likes.find(like => like.user.toString() === userId);

        if (existingLike) {
            // User has already liked the comment, so remove the like
            comment.likes = comment.likes.filter(like => like.user.toString() !== userId);
        } else {
            // User has not liked the comment, so add the like
            comment.likes.push({ user: userId });
        }

        await reel.save();
        res.json({ reel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/reels/user/{userId}:
 *   get:
 *     summary: Get all reels of a particular user
 *     description: Get all reels created by a specific user.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user whose reels to retrieve.
 *     responses:
 *       200:
 *         description: List of reels created by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reels:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reel'  # Reference to the Reel schema
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Get all reels of a particular user
router.get('/reels/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userReels = await Reels.find({ user: userId });

        res.json({ reels: userReels });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /reels/bookmarks/{userId}:
 *   get:
 *     summary: Get user bookmarked reels
 *     description: Get reels that are bookmarked by a specific user.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user whose bookmarked reels to retrieve.
 *     responses:
 *       200:
 *         description: List of bookmarked reels for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarkedReels:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reel'  # Reference to the Reel schema
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Get user bookmarked reels
router.get('/reels/bookmarks/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const bookmarkedReels = await ReelsBookmark.find({ user: userId }).populate('reel');
        res.json({ reels: bookmarkedReels });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/reels/bookmark/{reelId}:
 *   post:
 *     summary: Bookmark a reel
 *     description: Bookmark a reel for the user. If already bookmarked, remove the bookmark.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: reelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the reel to bookmark.
 *     requestBody:
 *       description: User ID for bookmarking the reel.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user bookmarking the reel.
 *             example:
 *               userId: 1234567890
 *     responses:
 *       200:
 *         description: Reel bookmarked/unbookmarked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Reel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.post('/reels/bookmark/:reelId', async (req, res) => {
    const { reelId } = req.params;
    const { userId } = req.body;

    try {
        const reel = await Reels.findById(reelId);

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        const bookmark = await ReelsBookmark.findOne({ user: userId, reel: reelId });

        if (bookmark) {
            // User has bookmarked the reel, so remove the bookmark
            await ReelsBookmark.findByIdAndRemove(bookmark._id);
            res.json({ message: 'Reel removed from bookmark' });
        } else {
            // User has not bookmarked the reel, so add the bookmark
            const newBookmark = new ReelsBookmark({ user: userId, reel: reelId });
            await newBookmark.save();
            res.json({ message: 'Reel added to bookmark' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/reels/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment on a reel
 *     description: Delete a comment on a reel by its commentId.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Reel or comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Delete a comment on a reel
router.delete('/reels/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        const reel = await Reels.findOne({ 'comments._id': commentId }).populate({
            path: 'user',
            select: 'firstname lastname profilePhoto liveFeedSettings',
        }).populate({ path: 'comments.user', select: 'firstname lastname profilePhoto liveFeedSettings' }).exec();;

        if (!reel) {
            return res.status(404).json({ message: 'Reel or comment not found' });
        }

        // Find the comment index and remove it
        const commentIndex = reel.comments.findIndex(comment => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        reel.comments.splice(commentIndex, 1);
        await reel.save();

        res.json({ message: 'Comment deleted successfully', reel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/reels/comments/{reelId}:
 *   post:
 *     summary: Add a comment on a reel
 *     description: Add a comment on a reel by a user.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: reelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the reel to add a comment on.
 *     requestBody:
 *       description: Comment details.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user adding the comment.
 *               text:
 *                 type: string
 *                 description: Comment text.
 *             example:
 *               userId: 1234567890
 *               text: "Great reel!"
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 comment:
 *                   type: object
 *                   description: Added comment details
 *                   properties:
 *                     user:
 *                       type: string
 *                       description: ID of the user who added the comment
 *                     text:
 *                       type: string
 *                       description: Comment text
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Comment creation timestamp
 *       404:
 *         description: Reel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

router.post('/reels/comments/:reelId', async (req, res) => {
    const { reelId } = req.params;
    const { user, text } = req.body;

    try {
        const reel = await Reels.findById(reelId).populate({
            path: 'user',
            select: 'firstname lastname profilePhoto liveFeedSettings',
        }).populate({ path: 'comments.user', select: 'firstname lastname profilePhoto liveFeedSettings' }).exec();

        if (!reel) {
            return res.status(404).json({ message: 'Reel not found' });
        }

        const newComment = {
            user: user,
            text: text,
            createdAt: new Date(),
        };

        reel.comments.push(newComment);
        await reel.save();

        const updatedReel = await Reels.findById(reelId).populate({
            path: 'user',
            select: 'firstname lastname profilePhoto liveFeedSettings',
        }).populate({ path: 'comments.user', select: 'firstname lastname profilePhoto liveFeedSettings' }).exec();

        res.json({ message: 'Comment added successfully', reel: updatedReel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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

router.get("/stories", async (req, res) => {
    try { // Retrieve all stories from the database
        const stories = await Story.find();

        // Send the stories as the response
        res.status(200).json(stories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
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

router.get('/stories/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user's stories by their ID
        const stories = await Story.find({ id: userId });

        if (stories.length === 0) {
            return res.status(404).json({ message: 'No stories found for the user' });
        }

        res.status(200).json({ stories });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
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
router.delete('/stories/:userId/:itemId', async (req, res) => {
    const userId = req.params.userId;
    const itemId = req.params.itemId;

    try { // Find the story with the given user ID
        const story = await Story.findOne({ id: userId });

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Find the item with the given ID
        const itemIndex = story.items.findIndex((item) => item._id.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in story' });
        }

        // Remove the item from the story's items array
        story.items.splice(itemIndex, 1);

        // Save the updated story
        await story.save();

        return res.status(200).json({ message: 'Story item deleted successfully' });
    } catch (error) {
        console.error('Error deleting story item:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
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
router.post("/share-post", upload10.array("file", 10), async (req, res) => {
    try {
        const { userId, content } = req.body;
        const files = req.files;

        const media = [];

        for (const file of files) {
            const fileName = `posts/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
            const fileBuffer = file.buffer;

            await b2.authorize();

            const response = await b2.getUploadUrl({
                bucketId: process.env.BACKBLAZE_BUCKET_ID,
            });

            const uploadResponse = await b2.uploadFile({
                uploadUrl: response.data.uploadUrl,
                uploadAuthToken: response.data.authorizationToken,
                fileName: fileName,
                data: fileBuffer,
            });

            const bucketName = process.env.BACKBLAZE_BUCKET;
            const uploadedFileName = uploadResponse.data.fileName;
            const fileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

            media.push({
                url: fileUrl,
                type: file.mimetype.includes("image") ? "image" : "video"
            });
        }

        const newPost = new Post({ userId, content, media });

        await newPost.save();

        // Populate the userId field with additional user data
        await newPost.populate("userId", "firstname lastname profilePhoto personal");

        res.status(200).json({ message: "Post shared successfully", post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
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
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [
            array[i], array[j]
        ] = [
                array[j], array[i]
            ];
    }
    return array;
};

router.get("/posts", async (req, res) => {
    try {
        // Retrieve all posts from the database, sort by 'createdAt' field in descending order,
        // and populate the 'userId' field
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "userId", select: "firstname lastname profilePhoto personal verification", // Include the verification field in the populated user data
            populate: {
                path: "verification", // Populate the verification field within the user data
                model: "VerificationBadge", // Replace "VerificationBadge" with the correct model name if different
            }
        });

        // Separate new posts from older posts
        const newPosts = [];
        const olderPosts = [];
        const currentTime = new Date();

        posts.forEach((post) => { // Define a threshold duration to consider a post as new (e.g., 24 hours)
            const thresholdDuration = 24 * 60 * 60 * 1000;
            // 24 hours in milliseconds

            // Check if the post is newer than the threshold
            const timeDifference = currentTime - post.createdAt;
            if (timeDifference < thresholdDuration) {
                newPosts.push(post);
            } else {
                olderPosts.push(post);
            }
        });

        // Shuffle the older posts array randomly
        const shuffledOlderPosts = shuffleArray(olderPosts);

        // Concatenate the new posts at the beginning of the shuffled older posts array
        const shuffledPosts = [
            ...newPosts,
            ...shuffledOlderPosts
        ];

        // Check if the userId in each post is valid before sending the response
        const populatedPosts = await Promise.all(shuffledPosts.map(async (post) => {
            if (mongoose.isValidObjectId(post.userId)) {
                return post;
            }
            return null; // Return null for posts with userId: null
        }));

        const filteredPosts = populatedPosts.filter((post) => post !== null);

        res.status(200).json(filteredPosts);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get("/posts-by-type", async (req, res) => {
    const page = req.query.page || 1; // Get the page number from the query parameter (default to page 1 if not provided)
    const limit = 10; // Define the number of posts to return per page
    const skip = (page - 1) * limit; // Calculate the number of posts to skip based on the page number

    const type = req.query.type || 'video'; // Get the media type from the query parameter (default to 'video' if not provided)

    try {
        // Retrieve posts from the database based on the media type,
        // sort by 'createdAt' field in descending order, and populate the 'userId' field
        const posts = await Post.find({ 'media.type': type }).sort({ createdAt: -1 }).populate('userId', 'firstname lastname profilePhoto personal').limit(limit).skip(skip);

        // Separate new posts from older posts
        const newPosts = [];
        const olderPosts = [];
        const currentTime = new Date();

        posts.forEach((post) => { // Define a threshold duration to consider a post as new (e.g., 24 hours)
            const thresholdDuration = 24 * 60 * 60 * 1000;
            // 24 hours in milliseconds

            // Check if the post is newer than the threshold
            const timeDifference = currentTime - post.createdAt;
            if (timeDifference < thresholdDuration) {
                newPosts.push(post);
            } else {
                olderPosts.push(post);
            }
        });

        // Shuffle the older posts array randomly
        const shuffledOlderPosts = shuffleArray(olderPosts);

        // Concatenate the new posts at the beginning of the shuffled older posts array
        const shuffledPosts = [
            ...newPosts,
            ...shuffledOlderPosts
        ];
        const populatedPosts = await Promise.all(shuffledPosts.map(async (post) => {
            if (mongoose.isValidObjectId(post.userId)) {
                return post;
            }
            return null; // Return null for posts with userId: null
        }));

        const filteredPosts = populatedPosts.filter((post) => post !== null);

        res.status(200).json(filteredPosts);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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
router.delete("/posts/:id", async (req, res) => {
    const { id } = req.params;
    try { // Find the post by ID
        const post = await Post.findById(id);

        // Check if the post exists
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        // Delete the post
        await post.deleteOne();
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Internal server error" });
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

router.post('/posts/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.body;

    try {
        const post = await Post.findById(postId).populate("userId", "firstname lastname profilePhoto");

        // Check if the post exists
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the post already has the user's like
        const isLiked = post.likes.some((like) => like.user.toString() === userId);

        if (isLiked) { // Unlike the post
            post.likes = post.likes.filter((like) => like.user.toString() !== userId);

            // Delete the notification for the unliked post
            await Notification.deleteOne({
                recipient: post.userId,
                sender: userId,
                action: {
                    $regex: 'liked your post'
                }
            });
        } else { // Like the post
            post.likes.push({ user: userId });

            // Check if the user is the owner of the post
            if (post.userId.toString() !== userId) { // Create a notification for the post owner
                const user = await User.findById(userId);
                const fullName = user ? `${user.firstname
                    } ${user.lastname
                    }` : 'Unknown User';

                const postText = post.content ? `"${post.content.substring(0, 100)
                    }..."` : '...';

                const notification = new Notification({
                    recipient: post.userId, // Post owner's ID
                    sender: userId, // Liked user's ID
                    action: `${fullName} liked your post on the live feed ${postText}`,
                    isSystemNotification: false
                });

                await notification.save();
            }
        }

        const updatedPost = await post.save();

        res.status(200).json({ message: 'Post liked/unliked successfully', post: updatedPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
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
router.post("/posts/:postId/comments", async (req, res) => {
    try { // Find the post based on the provided postId
        const post = await Post.findById(req.params.postId).populate("userId", "firstname lastname profilePhoto");


        // Create a new comment object with the user and text
        const newComment = {
            user: req.body.user,
            text: req.body.text
        };

        // Add the new comment to the post's comments array
        post.comments.push(newComment);

        // Save the updated post
        const updatedPost = await post.save();

        // Check if the post belongs to the user commenting
        if (post.userId.toString() !== req.body.user) { // Create a notification for the post owner
            const user = await User.findById(req.body.user);
            const fullName = user ? `${user.firstname
                } ${user.lastname
                }` : "Unknown User";
            const postText = post.content ? `"${post.content.substring(0, 100)
                }..."` : "...";
            const notification = new Notification({ recipient: post.userId, sender: req.body.user, action: `${fullName} commented on your post: ${postText}`, isSystemNotification: false });

            // Save the notification
            await notification.save();
        }

        res.status(200).json({ message: "Comment posted successfully", post: updatedPost });
    } catch (error) { // Handle any errors that occurred during the request
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
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

router.get("/posts/:postId", async (req, res) => {
    try {
        let post = await Post.findById(req.params.postId).populate({
            path: "userId",
            select: "firstname lastname profilePhoto personal verification",
            populate: {
                path: "verification",
                model: "VerificationBadge",
            }
        }).populate({
            path: "comments",
            populate: {
                path: "user",
                select: "firstname lastname profilePhoto"
            }
        }).populate({
            path: "comments.replies.user",
            select: "firstname lastname profilePhoto",
            populate: {
                path: "verification",
                model: "VerificationBadge",
            }
        });

        // Filter out null populated values
        post.userId = post.userId || null;
        post.comments = post.comments.filter(comment => comment.user !== null);
        post.comments.forEach(comment => {
            comment.replies = comment.replies.filter(reply => reply.user !== null);
        });

        if (!post) {
            return res.status(400).send({ message: "No Post Found" });
        }
        res.status(200).send({ post: post });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});


router.get("/user-posts/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        // Retrieve posts of a particular user from the database,
        // sort by 'createdAt' field in descending order,
        // and populate the 'userId' field with 'firstname', 'lastname', and 'profilePhoto'
        const posts = await Post.find({ userId }).sort({ createdAt: -1 }).populate({
            path: "userId", select: "firstname lastname profilePhoto personal verification", // Include the verification field in the populated user data
            populate: {
                path: "verification", // Populate the verification field within the user data
                model: "VerificationBadge", // Replace "VerificationBadge" with the correct model name if different
            }
        });


        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
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
router.post('/posts/:postId/comments/:commentId/replies', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { user, text } = req.body;

        // Find the post by postId
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Find the comment within the post by commentId
        const comment = post.comments.find((c) => c._id.toString() === commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Create the reply comment
        const replyComment = {
            user,
            text
        };

        // Add the reply comment to the comment's replies array
        comment.replies.push(replyComment);

        // Save the post
        await post.save();

        res.status(201).json({ message: 'Reply comment created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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

router.get('/people-you-know/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { course_of_study, current_level, department, institution } = req.query;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userIdObject = new mongoose.Types.ObjectId(userId);

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

        const users = await User.aggregate(pipeline);

        // If the number of matching documents is less than 4, adjust the number of results
        const totalCount = await User.countDocuments({
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
        const adjustedSize = Math.min(users.length, totalCount);

        res.json({
            people: users.slice(0, adjustedSize)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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

router.post("/update-livefeed-settings/:userId", async (req, res) => {
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
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
        await user.save();

        // Fetch the user again to exclude sensitive fields
        const updatedUser = await User.findById(userId).select("-token -password");

        res.status(200).json({ user: updatedUser, message: "Live feed settings updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
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

router.get('/author/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const author = await User.findById(id).select('-token -password').populate("friends.userId", "firstname lastname profilePhoto").populate("verification");

        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.json({ author });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching author details.' });
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

router.get('/posts/media/:type/:userId', async (req, res) => {
    const { type, userId } = req.params;

    const userIdObject = new mongoose.Types.ObjectId(userId);
    try {
        const posts = await Post.find({ 'media.type': type, userId: userIdObject });

        const media = posts.flatMap((post) => post.media);
        res.json(media);
    } catch (error) {
        console.error('Error fetching post media:', error);
        res.status(500).json({ error: 'Internal server error' });
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

router.post('/become-mentor/:userId', async (req, res) => {
    const userId = req.params.userId;

    try { // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
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
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        // Check if the user already has an application
        let mentorApplication = await MentorApplication.findOne({ userId });

        if (mentorApplication) { // If application exists, update it
            mentorApplication.skills = skills;
            mentorApplication.faculty = faculty;
            mentorApplication.about = briefDescription;
            mentorApplication.reason = mentorshipReason;
            mentorApplication.linkedin = linkedinProfile;
            mentorApplication.facebook = facebookUsername;
            mentorApplication.twitterHandle = twitterHandle;
            mentorApplication.googleMeet = googleMeet;
        } else { // If application does not exist, create a new one
            mentorApplication = new MentorApplication({
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
        }

        // Save the mentor application to the database
        await mentorApplication.save();

        // Update the isMentorStatus of the user to "Application Submitted"
        user.isMentorStatus = "Application Submitted";
        await user.save();

        res.json({ message: 'Mentor application submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit mentor application' });
    }
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

router.get('/notifications/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find({ recipient: userId }).populate("sender", "firstname lastname profilePhoto").sort({ date: -1 });
        res.json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/notifications-short/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await Notification.find({ recipient: userId }).populate("sender", "firstname lastname profilePhoto").sort({ date: -1 }).limit(3);
        res.json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
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
router.post('/send-friend-request', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        // Check if the friend request already exists
        const existingRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });

        if (existingRequest) {
            return res.status(400).json({ error: 'Friend request already sent to this user.' });
        }

        // Create a new friend request
        const friendRequest = new FriendRequest({ sender: senderId, receiver: receiverId });

        // Save the friend request to the database
        const savedFriendRequest = await friendRequest.save();

        res.status(200).json({ message: 'Request sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while sending the friend request.' });
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

router.get('/friend-request/:userId/:id', async (req, res) => {
    try {
        const { userId, id } = req.params;

        // Find friend requests where the user is the sender or receiver
        const friendRequests = await FriendRequest.findOne({
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

        res.status(200).json({ friendRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving friend requests.' });
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

router.delete('/friend-requests/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Delete the friend request
        await FriendRequest.deleteOne({ _id: requestId });

        res.status(200).json({ message: 'Friend request deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the friend request' });
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

router.put('/friend-requests/accept/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Update the status to 'accepted'
        friendRequest.status = 'accepted';

        // Save the updated friend request
        const updatedFriendRequest = await friendRequest.save();

        // Add receiver as a friend of the sender
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { // Use $addToSet instead of $push
                friends: {
                    userId: friendRequest.receiver
                }
            }
        });

        // Add sender as a friend of the receiver
        await User.findByIdAndUpdate(friendRequest.receiver, {
            $addToSet: { // Use $addToSet instead of $push
                friends: {
                    userId: friendRequest.sender
                }
            }
        });

        // Create a notification for the friend request acceptance
        const receiverUser = await User.findById(friendRequest.receiver);
        const fullName = `${receiverUser.firstname
            } ${receiverUser.lastname
            }`;
        const notificationMessage = `${fullName} has accepted your Buddy Request. You can now chat on Acadaboo.`;

        const notification = new Notification({ recipient: friendRequest.sender, sender: friendRequest.receiver, action: notificationMessage, isSystemNotification: true });

        // Save the notification to the database
        await notification.save();

        res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while accepting the friend request' });
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

router.get('/all-friend-requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all friend requests where the user is either the receiver or the sender and the status is 'pending'
        const friendRequests = await FriendRequest.find({
            $or: [
                {
                    receiver: userId
                }, {
                    sender: userId
                }
            ],
            status: 'pending'
        }).populate('sender', 'firstname lastname profilePhoto personal').populate('receiver', 'firstname lastname profilePhoto personal');

        // Filter out friend requests without populated sender or receiver
        const filteredFriendRequests = friendRequests.filter(request => request.sender && request.receiver);

        res.status(200).json({ friendRequests: filteredFriendRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving friend requests' });
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

router.delete('/unfriend/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the friend request by ID
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Delete the friend request document
        await FriendRequest.deleteOne({ _id: requestId });

        // Remove the sender from the receiver's friend list
        await User.findByIdAndUpdate(friendRequest.receiver, {
            $pull: {
                friends: {
                    userId: friendRequest.sender
                }
            }
        });

        // Remove the receiver from the sender's friend list
        await User.findByIdAndUpdate(friendRequest.sender, {
            $pull: {
                friends: {
                    userId: friendRequest.receiver
                }
            }
        });

        res.status(200).json({ message: 'Unfriended successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while unfriending' });
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

router.get('/count-mutual-friends/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the friend request
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ error: 'Friend request not found' });
        }

        // Find the receiver and sender of the friend request and populate their friends field
        const receiver = await User.findById(friendRequest.receiver).populate('friends');
        const sender = await User.findById(friendRequest.sender).populate('friends');

        // Get the list of sender's friend userIds
        const senderFriendIds = sender.friends.map((friend) => friend.userId.toString());

        // Get the list of receiver's friend userIds
        const receiverFriendIds = receiver.friends.map((friend) => friend.userId.toString());

        // Calculate the mutual friends count
        const mutualFriendsCount = senderFriendIds.filter((friendId) => receiverFriendIds.includes(friendId)).length;
        res.status(200).json({ mutualFriendsCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving mutual friends count' });
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

router.post('/check-username', async (req, res) => {
    try {
        const { username } = req.body;

        // Check if the username already exists in the database
        const existingUser = await User.findOne({ 'liveFeedSettings.username': username });

        if (existingUser) { // Username already taken, suggest alternative usernames
            const suggestedUsernames = generateSuggestedUsernames(username);
            res.status(200).json({ taken: true, suggestedUsernames });
        } else { // Username is available
            res.status(200).json({ taken: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while checking the username.' });
    }
});


const generateSuggestedUsernames = (username) => {
    const suggestedUsernames = [];
    const MAX_SUFFIX = 4; // Maximum numeric suffix to be appended

    for (let i = 1; i <= MAX_SUFFIX; i++) {
        const suggestedUsername = `${username}${i}`;
        suggestedUsernames.push(suggestedUsername);
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

router.get('/friends/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('friends.userId', 'firstname lastname liveFeedSettings.username liveFeedSettings.onlineStatus education.institution profilePhoto personal');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Filter out friends where userId wasn't successfully populated
        const filteredFriends = user.friends.filter(friend => friend.userId);

        res.json({ friends: filteredFriends });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
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
// router.get ('/messages/user/:userId', async (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const messages = await Chat.find ({
//             $or: [
//                 {
//                     'sender': userId
//                 }, {
//                     'receiver': userId
//                 },
//             ]
//         }).sort ({timeSent: 1});
//         res.status (200).json (messages);
//     } catch (error) {
//         res.status (500).json ({error: 'Failed to fetch messages'});
//     }
// });


router.get('/messages/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find all chat messages where the user is either the sender or receiver
        const messages = await Chat.find({
            $or: [
                {
                    sender: userId
                }, {
                    receiver: userId
                }
            ]
        }).sort({ timeSent: 1 });

        // Create an array to store promises for populating sender and receiver details
        const populatePromises = messages.map(async (message) => { // Determine the model type (user or mentor) for both sender and receiver
            const senderModel = message.senderModel;
            const receiverModel = message.receiverModel;

            // Find the sender details based on the senderModel
            const senderDetails = senderModel === 'user' ? await User.findById(message.sender, 'firstname lastname profilePhoto') : await Mentors.findById(message.sender, 'fullname avatar');

            // Find the receiver details based on the receiverModel
            const receiverDetails = receiverModel === 'user' ? await User.findById(message.receiver, 'firstname lastname profilePhoto') : await Mentors.findById(message.receiver, 'fullname avatar');

            // Update the message object with populated sender and receiver details
            message.sender = senderDetails;
            message.receiver = receiverDetails;
            return message;
        });

        // Wait for all the populate promises to resolve
        const populatedMessages = await Promise.all(populatePromises);

        res.status(200).json(populatedMessages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing chat messages
 * 
 * /chat/{id}/messages:
 *   get:
 *     summary: Get Chat Messages
 *     description: Get all messages of a chat
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the chat
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
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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

router.get('/chat/:id/messages', async (req, res) => {
    const chatId = req.params.id;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const messages = chat.messages;

        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing user-related operations
 * 
 * /users/delete-message/{messageId}:
 *   delete:
 *     summary: Delete a message by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the message to delete
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

router.delete('/delete-message/:messageId', async (req, res) => {
    const messageId = new mongoose.Types.ObjectId(req.params.messageId)
    try {
        // Find the chat by messageId and update the specific message's deleted field to true
        const chat = await Chat.findOneAndUpdate(
            { 'messages._id': messageId },
            { $set: { 'messages.$.deleted': true } },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ error: 'Message not found' });
        }

        return res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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
router.put('/chat-status/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { chatStatus } = req.body;
        // Update the chat status of the user
        const updatedUser = await User.findByIdAndUpdate(userId, {
            'liveFeedSettings.onlineStatus': chatStatus
        }, { new: true }).select("-password -token").populate('friends.userId', 'firstname lastname profilePhoto');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Chat status updated successfully', user: updatedUser });
    } catch (error) {
        console.log('Error updating chat status:', error);
        res.status(500).json({ error: 'Failed to update chat status' });
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

router.get('/chat-status/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Retrieve the user's chat status
        const user = await User.findById(userId).select('liveFeedSettings.onlineStatus');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const chatStatus = user.liveFeedSettings.onlineStatus;

        res.status(200).json({ chatStatus });
    } catch (error) {
        console.log('Error retrieving chat status:', error);
        res.status(500).json({ error: 'Failed to retrieve chat status' });
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


router.put('/update-message-status/:receiverId/:senderId', async (req, res) => {

    const { receiverId, senderId } = req.params;
    const { messages } = req.body;

    try {
        const chat = await Chat.findOne({
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

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        messages.forEach((update) => {
            const message = chat.messages.find((msg) => msg._id.toString() === update.messageId);
            if (message) { // Update the status of the corresponding message
                message.status = update.status;
            }
        });

        await chat.save();

        // Respond with a success message or status code (200 OK)
        res.json({ message: 'Message statuses updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating message statuses' });
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing user-related operations
 * 
 * /users/send-message:
 *   post:
 *     summary: Send a message
 *     tags: [User]
 *     requestBody:
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
 *                 example:
 *                   _id: sender_id_here
 *               receiver:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                 example:
 *                   _id: receiver_id_here
 *               hasMedia:
 *                 type: boolean
 *                 example: true
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     file:
 *                       type: string
 *                     type:
 *                       type: string
 *                 example:
 *                   - name: media_file.jpg
 *                     file: base64_encoded_file_here
 *                     type: image/jpeg
 *               content:
 *                 type: string
 *                 example: Hello, this is a text message
 *               timeSent:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-08-15T12:00:00Z
 *               status:
 *                 type: string
 *                 example: sent
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       500:
 *         description: Server error
 */

// POST route to send a message
// router.post('/send-message', async (req, res) => {
//     try {
//         const message = req.body;

//         // Save the message to the database using Mongoose
//         const newMessage = {
//             sender: message.sender._id,
//             receiver: message.receiver._id,
//             content: message.content,
//             timeSent: message.timeSent,
//             status: message.status
//         };

//         // Find the chat between sender A and receiver B
//         let chat = await Chat.findOne({ sender: message.sender._id, receiver: message.receiver._id });

//         if (!chat) { // Check if the reverse chat exists between sender B and receiver A
//             chat = await Chat.findOne({ sender: message.receiver._id, receiver: message.sender._id });
//         }

//         if (!chat) { // Create a new chat if neither chat exists
//             chat = new Chat({
//                 sender: message.sender._id,
//                 receiver: message.receiver._id,
//                 senderModel: message.sender.model,
//                 receiverModel: message.receiver.model,
//                 messages: [newMessage]
//             });
//         } else { // Add the new message to the messages array
//             chat.messages.push(newMessage);
//         }

//         // Save the chat document
//         await chat.save();

//         // Respond with a success message or status code (200 OK)
//         res.json({ message: 'Message sent successfully' });
//     } catch (error) {
//         console.error('Error sending message:', error);
//         res.status(500).json({ error: 'An error occurred while sending the message' });
//     }
// });

router.post('/send-message', async (req, res) => {
    try {
        const message = req.body;
        console.log(message)
        
        // Assuming the message object is sent in the request body

        // Determine the message type
        const messageType = message.hasMedia ? 'media' : 'text';

        // Save the message to the database using Mongoose
        const newMessage = {
            sender: message.sender._id,
            receiver: message.receiver._id,
            timeSent: message.timeSent,
            status: message.status,
            messageType: messageType
        };

        if (messageType === 'media') {
            newMessage.media = [];
            // Iterate through each media file and upload to Backblaze B2
            for (const mediaFile of message.media) {
                const fileName = `chats/${Date.now()}_${mediaFile.name.replace(/\s+/g, '_')}`;
                const fileBuffer = mediaFile.file;

                await b2.authorize();

                const response = await b2.getUploadUrl({
                    bucketId: process.env.BACKBLAZE_BUCKET_ID,
                });

                const uploadResponse = await b2.uploadFile({
                    uploadUrl: response.data.uploadUrl,
                    uploadAuthToken: response.data.authorizationToken,
                    fileName: fileName,
                    data: fileBuffer,
                });

                const bucketName = process.env.BACKBLAZE_BUCKET;
                const uploadedFileName = uploadResponse.data.fileName;
                const mediaUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

                // Add the media object to the media array of the chat's first message
                newMessage.newMessage.push({
                    mediaUrl: mediaUrl,
                    mimeType: mediaFile.type,
                });
            }

        } else if (messageType === 'text') {
            newMessage.content = message.content;
        }

        // Find the chat between sender A and receiver B
        let chat = await Chat.findOne({ sender: message.sender._id, receiver: message.receiver._id });

        if (!chat) { // Check if the reverse chat exists between sender B and receiver A
            chat = await Chat.findOne({ sender: message.receiver._id, receiver: message.sender._id });
        }

        if (!chat) { // Create a new chat if neither chat exists
            chat = new Chat({
                sender: message.sender._id,
                receiver: message.receiver._id,
                senderModel: message.sender.model,
                receiverModel: message.receiver.model,
                messages: [newMessage]
            });
        } else { // Add the new message to the messages array
            chat.messages.push(newMessage);
        }

        // Save the chat document
        await chat.save();

        // Respond with a success message or status code (200 OK)
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
});


/**
 * @swagger
 * /users/mark-as-read/{userId}:
 *   put:
 *     tags:
 *       - User
 *     summary: Mark all notifications as read for a specific user
 *     description: Mark all notifications as read for a user with the specified userId.
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user whose notifications will be marked as read
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully.
 *       500:
 *         description: An error occurred while marking notifications as read.
 */
// Route to mark all notifications of a particular user as read
router.put('/mark-as-read/:userId', async (req, res) => {
    const userId = req.params.userId;

    try { // Update all notifications where the recipient matches the userId
        await Notification.updateMany({
            recipient: userId
        }, {
            $set: {
                isRead: true
            }
        });
        res.status(200).json({ message: 'All notifications marked as read successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while marking notifications as read.' });
    }
});

/**
 * @swagger
 * /users/search/people-app/{query}:
 *   get:
 *     tags:
 *       - User
 *     summary: Search for users by firstname, lastname, or username
 *     description: Retrieve a list of users that match the given search query.
 *     parameters:
 *       - name: query
 *         in: path
 *         description: The search query to find users by firstname, lastname, or username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response with the list of users matching the search query.
 *         schema:
 *           type: array
 *           items:
 *             $ref: "#/definitions/User"
 *       500:
 *         description: An error occurred while searching for users.
 */

router.get('/search/people/:query', async (req, res) => {
    const { query } = req.params;

    try {
        const searchResults = await User.find({
            $or: [
                {
                    $or: [
                        {
                            firstname: {
                                $regex: query,
                                $options: 'i'
                            }
                        }, {
                            lastname: {
                                $regex: query,
                                $options: 'i'
                            }
                        },
                    ]
                }, { // Case-insensitive search for both firstname and lastname
                    'liveFeedSettings.username': {
                        $regex: query,
                        $options: 'i'
                    }
                }, // Case-insensitive search for username
            ]
        }).select('-password -token').populate("verification");

        res.json(searchResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching for users' });
    }
});

router.get('/search/people-app/:query', async (req, res) => {
    const { query } = req.params;

    try {
        const searchResults = await User.find({
            $or: [
                {
                    $or: [
                        {
                            firstname: {
                                $regex: query,
                                $options: 'i'
                            }
                        }, {
                            lastname: {
                                $regex: query,
                                $options: 'i'
                            }
                        },
                    ]
                }, { // Case-insensitive search for both firstname and lastname
                    'liveFeedSettings.username': {
                        $regex: query,
                        $options: 'i'
                    }
                }, // Case-insensitive search for username
            ]
        }).select('firstname lastname profilePhoto'); // Only select the specified fields

        res.json(searchResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching for users' });
    }
});


/**
 * @swagger
 * /users/search/posts/{query}:
 *   get:
 *     tags:
 *       - User
 *     summary: Search for posts by content or comments
 *     description: Retrieve a list of posts that match the given search query in their content or comments.
 *     parameters:
 *       - name: query
 *         in: path
 *         description: The search query to find posts by content or comments
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response with the list of posts matching the search query.
 *         schema:
 *           type: array
 *           items:
 *             $ref: "#/definitions/Post"
 *       500:
 *         description: An error occurred while searching for posts.
 */

router.get('/search/posts/:query', async (req, res) => {
    const { query } = req.params;

    try {
        const posts = await Post.find({
            $or: [
                {
                    content: {
                        $regex: query,
                        $options: 'i'
                    }
                }, { // Case-insensitive search for content
                    'comments.text': {
                        $regex: query,
                        $options: 'i'
                    }
                }, // Case-insensitive search for comments
            ]
        }).populate('userId', 'firstname lastname profilePhoto');

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching for posts' });
    }
});


/**
 * @swagger
 * /users/update-account-type/{userId}:
 *   post:
 *     tags:
 *       - User
 *     summary: Update user's account type
 *     description: Update the account type of a user.
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The ID of the user to update the account type for.
 *         required: true
 *         schema:
 *           type: string
 *       - name: selectedAccountType
 *         in: body
 *         description: The selected account type to update.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             selectedAccountType:
 *               type: string
 *               enum: [undergraduate, highschool, jambite] 
 *               description: The selected account type to update to.
 *     responses:
 *       200:
 *         description: Success response with updated user and message.
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             user:
 *               $ref: "#/definitions/User"  # Define User schema here
 *       400:
 *         description: Invalid input or missing parameters.
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *       500:
 *         description: An error occurred while updating the account type.
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 */


router.post('/update-account-type/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const selectedAccountType = req.body.type;
        // Update the user's account type in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { accountType: selectedAccountType },
            { new: true }
        ).select("-password -token").populate('friends.userId', 'firstname lastname profilePhoto');

        return res.status(200).json({
            message: 'Account type updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing events
 * 
 * /event-categories:
 *   get:
 *     summary: Get Event Categories
 *     description: Get all event categories
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved event categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventCategory'  # Replace with the correct schema reference for the EventCategory model
 *       400:
 *         description: No Categories Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to fetch event categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: object
 */

router.get("/event-categories", async (req, res) => {
    try { // check if user exists
        let eventCategories = await EventCategory.find().sort({ createdAt: "desc" });
        if (!eventCategories) {
            return res.status(400).send({ message: "No Categories Found" });
        }
        res.status(200).send({ categories: eventCategories });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing events
 * 
 * /users/create-event:
 *   post:
 *     summary: Create Event
 *     description: Create a new event
 *     tags: [User]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Event banner image
 *       - in: formData
 *         name: data
 *         type: string
 *         required: true
 *         description: JSON data containing event details
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

// Schedule the job to run 10 minutes before the event's start time
const scheduleEventNotifications = async (event) => {
    // const existingJobs = await agenda.jobs({ 'data.event': event._id });

    // if (existingJobs.length === 0) {
    const eventStartTime = moment(event.startTime, 'HH:mm');
    const notificationTime = eventStartTime.subtract(2, 'minutes');

    const timeDiffInMinutes = notificationTime.diff(moment(), 'minutes');
    await agenda.schedule(`in ${timeDiffInMinutes} minutes`, 'send-notification', {
        event: event._id,
        action: `2 minutes before event "${event.title}" starts`
    });


    // }
};



// router.post('/create-event', upload6.single('file'), async (req, res) => {
//     try {
//         const eventData = JSON.parse(req.body.data); // Parse the JSON data
//         const { user, title, details, category, startDate, startTime, endDate, endTime, attendanceType, location, eventLink } = eventData;

//         // Create a new Event object
//         const event = new Event({
//             user,
//             banner_image: req.file.path,
//             title,
//             details,
//             category,
//             startDate,
//             startTime,
//             endDate,
//             endTime,
//             location,
//             attendanceType,
//             eventLink
//         });

//         // Save the event to the database
//         const savedEvent = await event.save();

//         res.status(201).json({ message: 'Event created successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// });

router.post('/create-event', upload10.single('file'), async (req, res) => {
    try {
        const eventData = JSON.parse(req.body.data); // Parse the JSON data
        const { user, title, details, category, startDate, startTime, endDate, endTime, attendanceType, location, eventLink } = eventData;

        // Generate a sanitized filename
        const sanitizedFilename = req.file.originalname.replace(/\s+/g, '_');
        const fileName = `events/${Date.now()}_${sanitizedFilename}`;

        // Upload the file to Backblaze B2
        await b2.authorize();
        const response = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const uploadResponse = await b2.uploadFile({
            uploadUrl: response.data.uploadUrl,
            uploadAuthToken: response.data.authorizationToken,
            fileName: fileName,
            data: req.file.buffer,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;
        const uploadedFileName = uploadResponse.data.fileName;
        const fileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

        // Create a new Event object
        const event = new Event({
            user,
            banner_image: fileUrl, // Use the B2 file URL
            title,
            details,
            category,
            startDate,
            startTime,
            endDate,
            endTime,
            location,
            attendanceType,
            eventLink
        });

        // Save the event to the database
        const savedEvent = await event.save();

        res.status(201).json({ message: 'Event created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing events
 * 
 * /users/events:
 *   get:
 *     summary: Get All Events
 *     description: Get all events with populated fields
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'  # Replace with the correct schema reference for the Event model
 *       500:
 *         description: Failed to fetch events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 * 
 * components:
 *   schemas:
 *     Event:  # Define the schema for the Event model
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         banner_image:
 *           type: string
 *         category:
 *           $ref: '#/components/schemas/EventCategory'
 *         details:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endDate:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 *         interestedParticipants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InterestedParticipant'
 *         goingParticipants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GoingParticipant'
 *         user:
 *           $ref: '#/components/schemas/User'
 *         visibility:
 *           type: boolean
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *     EventCategory:  # Define the schema for the EventCategory model
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         banner_image:
 *           type: string
 *     InterestedParticipant:  # Define the schema for the InterestedParticipant model
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         dateAdded:
 *           type: string
 *           format: date-time
 *     GoingParticipant:  # Define the schema for the GoingParticipant model
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         dateAdded:
 *           type: string
 *           format: date-time
 *     Comment:  # Define the schema for the Comment model
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         text:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */


router.get('/events', async (req, res) => {
    try {
        const events = await Event.find()
            .populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing events
 * 
 * /users/event/{id}:
 *   delete:
 *     summary: Delete Event
 *     description: Delete an event by its ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the event to delete
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.delete('/event/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        // Check if the event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Delete the event
        await Event.findByIdAndDelete(eventId);

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});


/**
 * @swagger
 * /users/events/notifications/{userId}:
 *   get:
 *     summary: Get event notifications for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: List of event notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       recipient:
 *                         type: string
 *                       sender:
 *                         type: string
 *                       event:
 *                         type: string
 *                       action:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       isRead:
 *                         type: boolean
 *                       isSystemNotification:
 *                         type: boolean
 *       500:
 *         description: Server error.
 */

// Route to get all event notifications of a user
router.get('/events/notifications/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const notifications = await EventNotification.find({
            recipient: userId
        }).sort({ date: -1 });

        res.json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/notifications/unread/{userId}:
 *   get:
 *     summary: Count unread event notifications for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: Count of unread event notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *       500:
 *         description: Server error.
 */

// Route to count the number of unread notifications for a user
router.get('/events/notifications/unread/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const unreadCount = await EventNotification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/notifications/mark-read/{userId}:
 *   put:
 *     summary: Mark all event notifications as read for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: All event notifications marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       500:
 *         description: Server error.
 */

// Route to mark all event notifications as read for a user
router.put('/events/notifications/mark-read/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        await EventNotification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/event/{id}:
 *   get:
 *     summary: Get Event by ID
 *     description: Retrieve an event by its ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
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

router.get('/event/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        // Retrieve the event by its ID
        const event = await Event.findById(eventId).populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto personal education',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto personal education',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto personal education',
            })
            .exec();;

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @swagger
 * /users/add-interested/{eventId}:
 *   post:
 *     summary: Add or Remove User from Interested Participants
 *     description: Add or remove a user as an interested participant for an event
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *       - in: body
 *         name: userId
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User is already an interested participant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Add a user as an interested participant
router.post('/add-interested/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const userIndex = event.interestedParticipants.findIndex(participant => participant.user.equals(userId));

        if (userIndex !== -1) {
            event.interestedParticipants.splice(userIndex, 1); // Remove the user from the interested participants
            await event.save();
            return res.json({ message: 'Removed from interested participants' });
        }

        // If the user is not already an interested participant, add them
        event.interestedParticipants.push({ user: userId });
        await event.save();

        await scheduleEventNotifications(event);

        res.json({ message: 'Added as an interested participant' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/add-going/{eventId}:
 *   post:
 *     summary: Add or Remove User from Going Participants
 *     description: Add or remove a user as a going participant for an event
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *       - in: body
 *         name: userId
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User is already a going participant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
// Add a user as a going participant
router.post('/add-going/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if the user is already a going participant
        const userIndex = event.goingParticipants.findIndex(participant => participant.user.equals(userId));

        if (userIndex !== -1) {
            event.goingParticipants.splice(userIndex, 1); // Remove the user from the going participants
            await event.save();
            return res.json({ message: 'User removed from going participants' });
        }

        event.goingParticipants.push({ user: userId });
        await event.save();

        await scheduleEventNotifications(event);

        res.json({ message: 'User added as a going participant' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /event/bookmark/{eventId}:
 *   post:
 *     summary: Add or Remove Event Bookmark
 *     description: Add or remove an event from bookmarks for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *       - in: body
 *         name: userId
 *         schema:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
// Route to add or remove an event as a bookmark
router.post('/event/bookmark/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.body;

    try {
        const event = await Event.findById(eventId).populate('category').populate({
            path: 'user',
            select: 'firstname lastname profilePhoto education personal',
        })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();;
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const bookmark = await EventBookmark.findOne({ user: userId, event: eventId });

        if (bookmark) {
            await EventBookmark.deleteOne({ user: userId, event: eventId });
            return res.json({ message: 'Event removed from bookmarks' });
        } else {
            await EventBookmark.create({ user: userId, event: eventId });
            return res.json({ message: 'Event saved to bookmarks' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/event/is-bookmarked/{eventId}:
 *   get:
 *     summary: Check if Event is Bookmarked
 *     description: Check if an event is bookmarked by a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the event
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isBookmarked:
 *                   type: boolean
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// Route to check if an event is bookmarked by a user
router.get('/event/is-bookmarked/:eventId', async (req, res) => {
    const { eventId } = req.params;
    const { userId } = req.query;

    try {
        const bookmark = await EventBookmark.findOne({ user: userId, event: eventId });

        if (bookmark) {
            return res.json({ isBookmarked: true });
        } else {
            return res.json({ isBookmarked: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/event/report:
 *   post:
 *     summary: Report an event
 *     description: Report an event for violating community guidelines or other issues.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: ID of the event to be reported
 *               userId:
 *                 type: string
 *                 description: ID of the user reporting the event
 *               reason:
 *                 type: string
 *                 description: Reason for reporting the event (e.g., "Nudity", "Harassment", etc.)
 *               explanation:
 *                 type: string
 *                 description: Explanation provided by the user for the report
 *             required:
 *               - eventId
 *               - userId
 *               - reason
 *     responses:
 *       200:
 *         description: Event reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *       400:
 *         description: User has already reported this event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to allow users to report an event
router.post('/event/report', async (req, res) => {
    const { eventId, userId, reason, explanation } = req.body;

    try {
        // Check if the user has reported the event before
        const existingReport = await ReportEvent.findOne({ event: eventId, user: userId });

        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this event' });
        }

        // Create a new report
        const report = new ReportEvent({
            event: eventId,
            user: userId,
            reason: reason,
            explanation: explanation,
            dateReported: new Date()
        });

        // Save the report
        await report.save();

        res.json({ message: 'Event reported successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/bookmarks/{userId}:
 *   get:
 *     summary: Get user's bookmarked events
 *     description: Get a list of events bookmarked by the user.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: List of bookmarked events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarks:
 *                   type: array
 *                   description: List of bookmarked events.
 *                   items:
 *                     type: object
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get user's bookmarked events
router.get('/events/bookmarks/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find all bookmarks of the user
        const bookmarks = await EventBookmark.find({ user: userId })
            .populate({
                path: 'event',
                populate: [
                    { path: 'user', select: 'firstname lastname profilePhoto education personal' },
                    { path: 'category' },
                    { path: 'interestedParticipants.user', select: 'firstname lastname profilePhoto education personal' },
                    { path: 'goingParticipants.user', select: 'firstname lastname profilePhoto education personal' },
                ]
            });

        // Extract event details from bookmarks
        const bookmarkedEvents = bookmarks.map(bookmark => bookmark.event);

        res.json({ bookmarks: bookmarkedEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/interested/{userId}:
 *   get:
 *     summary: Get events user is interested in
 *     description: Get a list of events that the user is interested in based on user ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: List of events user is interested in retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interestedEvents:
 *                   type: array
 *                   description: List of events user is interested in.
 *                   items:
 *                     type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get events user is interested in based on user ID
router.get('/events/interested/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const interestedEvents = await Event.find({
            'interestedParticipants.user': user._id
        }).populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();

        res.json({ interestedEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/past-attended/{userId}:
 *   get:
 *     summary: Get past events attended by a user
 *     description: Get a list of past events attended by the user based on user ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: List of past events attended by the user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendedEvents:
 *                   type: array
 *                   description: List of past events attended by the user.
 *                   items:
 *                     type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get past events attended by a user based on user ID
router.get('/events/past-attended/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentTime = new Date();

        const pastAttendedEvents = await Event.find({
            $and: [
                {
                    $or: [
                        { 'interestedParticipants.user': user._id },
                        { 'goingParticipants.user': user._id }
                    ]
                },
                {
                    $or: [
                        { startDate: { $lt: currentTime } },
                        { endDate: { $lt: currentTime } }
                    ]
                }
            ]
        }).populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();

        res.json({ pastAttendedEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/going/{userId}:
 *   get:
 *     summary: Get events user is going to
 *     description: Get a list of events that the user is going to based on user ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: List of events user is going to retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 goingEvents:
 *                   type: array
 *                   description: List of events user is going to.
 *                   items:
 *                     type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get events user is going to based on user ID
router.get('/events/going/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const goingEvents = await Event.find({
            'goingParticipants.user': user._id
        }).populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();

        res.json({ goingEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/hosted/{userId}:
 *   get:
 *     summary: Get events hosted by a user
 *     description: Get a list of events that are hosted by the user based on user ID.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user.
 *     responses:
 *       200:
 *         description: List of events hosted by the user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hostedEvents:
 *                   type: array
 *                   description: List of events hosted by the user.
 *                   items:
 *                     type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get events hosted by a user based on user ID
router.get('/events/hosted/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hostedEvents = await Event.find({ user: user._id }).populate('category')
            .populate({
                path: 'user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'interestedParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .populate({
                path: 'goingParticipants.user',
                select: 'firstname lastname profilePhoto education personal',
            })
            .exec();

        res.json({ hostedEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/events/{category}:
 *   get:
 *     summary: Get events under a specific category
 *     description: Get a list of events that belong to a specific category.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category title.
 *     responses:
 *       200:
 *         description: List of events under the category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   description: List of events under the category.
 *                   items:
 *                     type: object
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

// Route to get events under a specific category
router.get('/events/category/:category', async (req, res) => {
    const { category } = req.params;

    try {
        const categoryExists = await EventCategory.findOne({ title: category });
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const eventsUnderCategory = await Event.find({ category: categoryExists._id });

        res.json({ events: eventsUnderCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/events/filter:
 *   get:
 *     summary: Get events filtered by location and/or startDate
 *     description: Get a list of events filtered by location and/or startDate.
 *     tags: [User]
 *     parameters:
 *       - name: location
 *         in: query
 *         description: Filter events by location
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         description: Filter events by startDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved filtered events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'  # Reference to your Event schema
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */


// Route to get events filtered by location and startDate
router.get('/events/filter', async (req, res) => {
    const { location, startDate } = req.query;
    try {
        let query = {};

        if (location) {
            query.location = { $regex: new RegExp(location, 'i') };
        }

        if (startDate) {
            query.startDate = startDate;
        }

        let filteredEvents;

        if (Object.keys(query).length === 0) {
            filteredEvents = await Event.find();
        } else {
            filteredEvents = await Event.find(query);
        }

        res.json({ events: filteredEvents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * tags:
 *   name: User
 *   description: APIs for managing listings
 * 
 * /users/marketplace/listing-categories:
 *   get:
 *     summary: Get Listing Categories
 *     description: Get all listing categories
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved listing categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ListingCategory'  # Replace with the correct schema reference for the ListingCategory model
 *       400:
 *         description: No Categories Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to fetch listing categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: object
 */
router.get("/marketplace/listing-categories", async (req, res) => {
    try {
        let listingCategories = await ListingCategory.find().sort({ createdAt: "desc" });
        if (!listingCategories) {
            return res.status(400).send({ message: "No Categories Found" });
        }
        res.status(200).send({ categories: listingCategories });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});

/**
 * @swagger
 * /users/marketplace/create-listing/{listingType}:
 *   post:
 *     summary: Create a new listing
 *     description: Create a new listing based on the listing type
 *     tags: [User]
 *     parameters:
 *       - name: listingType
 *         in: path
 *         required: true
 *         description: The type of listing (itemsForSale, housingAndResources, academicAssistance, jobListing)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Upload files
 *               data:
 *                 type: string
 *                 description: JSON data containing listing information
 *             required:
 *               - files
 *               - data
 *     responses:
 *       200:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

router.post("/marketplace/create-listing/:listingType", upload10.array("files"), async (req, res) => {
    try {
        const listing = req.params.listingType;

        if (listing === "itemsForSale") {
            const {
                user,
                title,
                condition,
                price,
                category,
                location,
                listingType,
                description
            } = JSON.parse(req.body.data);

            // Check if the file size exceeds the limit
            if (req.files.some(file => file.size > 20 * 1024 * 1024)) {
                return res.status(400).json({ error: "File size exceeds limit (20MB)" });
            }

            const media = [];
            for (const mediaFile of req.files) {
                const fileName = `marketplace/${Date.now()}_${mediaFile.originalname.replace(/\s+/g, '_')}`;
                const fileBuffer = mediaFile.buffer;

                await b2.authorize();

                const response = await b2.getUploadUrl({
                    bucketId: process.env.BACKBLAZE_BUCKET_ID,
                });

                const uploadResponse = await b2.uploadFile({
                    uploadUrl: response.data.uploadUrl,
                    uploadAuthToken: response.data.authorizationToken,
                    fileName: fileName,
                    data: fileBuffer,
                });

                const bucketName = process.env.BACKBLAZE_BUCKET;
                const uploadedFileName = uploadResponse.data.fileName;
                const mediaUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

                media.push({
                    url: mediaUrl,
                });
            }
            // Create a new listing for itemsForSale
            const newItemListing = await Listing.create({
                user,
                title,
                visibility: true,
                listingType,
                location,
                itemsForSale: {
                    category,
                    condition,
                    description,
                    price,
                    media
                }
            });
           
            // Send notifications to all followers of the seller
            const followers = await ListingUserFollowing.find({ seller: user }).populate('follower');
            const sellerDetails = await User.findById(user)

            const notificationMessage = `A seller you follow, ${sellerDetails.firstname + ' ' + sellerDetails.lastname} has created a new Listing on the marketplace - ${title.toUpperCase()}`;

            for (const follower of followers) {
                await ListingNotification.create({
                    recipient: follower.follower,
                    sender: user,
                    listing: newItemListing._id,
                    action: "created",
                    isSystemNotification: true,
                    message: notificationMessage
                });
            }
            return res.status(200).json({ message: "Listing created successfully" });
        }
        if (listing === "housingAndResources") {
            const {
                user,
                title,
                condition,
                category,
                location,
                listingType,
                description,
                preferences,
                payment,
                durationOfStay,
                amount,
                termsAndConditions
            } = JSON.parse(req.body.data);

            // Check if the file size exceeds the limit
            if (req.files.some(file => file.size > 20 * 1024 * 1024)) {
                return res.status(400).json({ error: "File size exceeds limit (20MB)" });
            }

            const media = [];
            for (const mediaFile of req.files) {
                const fileName = `marketplace/${Date.now()}_${mediaFile.originalname.replace(/\s+/g, '_')}`;
                const fileBuffer = mediaFile.buffer;

                await b2.authorize();

                const response = await b2.getUploadUrl({
                    bucketId: process.env.BACKBLAZE_BUCKET_ID,
                });

                const uploadResponse = await b2.uploadFile({
                    uploadUrl: response.data.uploadUrl,
                    uploadAuthToken: response.data.authorizationToken,
                    fileName: fileName,
                    data: fileBuffer,
                });

                const bucketName = process.env.BACKBLAZE_BUCKET;
                const uploadedFileName = uploadResponse.data.fileName;
                const mediaUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

                media.push({
                    url: mediaUrl,
                });
            }

            // Create a new listing for housingAndResources
            const newItemListing = await Listing.create({
                user,
                title,
                visibility: true,
                listingType,
                location,
                housingAndResources: {
                    category,
                    condition,
                    description,
                    preferences,
                    payment,
                    durationOfStay,
                    amount,
                    termsAndConditions,
                    media
                }
            });

            // Send notifications to all followers of the seller
            const followers = await ListingUserFollowing.find({ seller: user }).populate('follower');
            const sellerDetails = await User.findById(user)

            const notificationMessage = `A seller you follow, ${sellerDetails.firstname + ' ' + sellerDetails.lastname} has created a new Listing on the marketplace - ${title.toUpperCase()}`;

            for (const follower of followers) {
                await ListingNotification.create({
                    recipient: follower.follower,
                    sender: user,
                    listing: newItemListing._id,
                    action: "created",
                    isSystemNotification: true,
                    message: notificationMessage
                });
            }

            return res.status(200).json({ message: "Listing created successfully" });
        }
        if (listing === "academicAssistance") {
            const {
                user,
                title,
                category,
                location,
                listingType,
                description,
                payment,
                amount,
            } = JSON.parse(req.body.data);

            // Check if the file size exceeds the limit
            if (req.files.some(file => file.size > 20 * 1024 * 1024)) {
                return res.status(400).json({ error: "File size exceeds limit (20MB)" });
            }

            const media = [];
            for (const mediaFile of req.files) {
                const fileName = `marketplace/${Date.now()}_${mediaFile.originalname.replace(/\s+/g, '_')}`;
                const fileBuffer = mediaFile.buffer;

                await b2.authorize();

                const response = await b2.getUploadUrl({
                    bucketId: process.env.BACKBLAZE_BUCKET_ID,
                });

                const uploadResponse = await b2.uploadFile({
                    uploadUrl: response.data.uploadUrl,
                    uploadAuthToken: response.data.authorizationToken,
                    fileName: fileName,
                    data: fileBuffer,
                });

                const bucketName = process.env.BACKBLAZE_BUCKET;
                const uploadedFileName = uploadResponse.data.fileName;
                const mediaUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

                media.push({
                    url: mediaUrl,
                });
            }

            // Create a new listing for housingAndResources
            const newItemListing = await Listing.create({
                user,
                title,
                visibility: true,
                listingType,
                location,
                academicAssistance: {
                    category,
                    description,
                    payment,
                    amount,
                    media
                }
            });

            // Send notifications to all followers of the seller
            const followers = await ListingUserFollowing.find({ seller: user }).populate('follower');
            const sellerDetails = await User.findById(user)

            const notificationMessage = `A seller you follow, ${sellerDetails.firstname + ' ' + sellerDetails.lastname} has created a new Listing on the marketplace - ${title.toUpperCase()}`;

            for (const follower of followers) {
                await ListingNotification.create({
                    recipient: follower.follower,
                    sender: user,
                    listing: newItemListing._id,
                    action: "created",
                    isSystemNotification: true,
                    message: notificationMessage
                });
            }

            return res.status(200).json({ message: "Listing created successfully" });
        }
        if (listing === "jobListing") {
            const {
                user,
                title,
                category,
                location,
                listingType,
                description,
                deadline,
                link,
                organization,
            } = JSON.parse(req.body.data);

            // Check if the file size exceeds the limit
            if (req.files.some(file => file.size > 20 * 1024 * 1024)) {
                return res.status(400).json({ error: "File size exceeds limit (20MB)" });
            }

            const media = [];
            for (const mediaFile of req.files) {
                const fileName = `marketplace/${Date.now()}_${mediaFile.originalname.replace(/\s+/g, '_')}`;
                const fileBuffer = mediaFile.buffer;

                await b2.authorize();

                const response = await b2.getUploadUrl({
                    bucketId: process.env.BACKBLAZE_BUCKET_ID,
                });

                const uploadResponse = await b2.uploadFile({
                    uploadUrl: response.data.uploadUrl,
                    uploadAuthToken: response.data.authorizationToken,
                    fileName: fileName,
                    data: fileBuffer,
                });

                const bucketName = process.env.BACKBLAZE_BUCKET;
                const uploadedFileName = uploadResponse.data.fileName;
                const mediaUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

                media.push({
                    url: mediaUrl,
                });
            }

            // Create a new listing for housingAndResources
            const newItemListing = await Listing.create({
                user,
                title,
                visibility: true,
                listingType,
                location,
                jobListing: {
                    category,
                    description,
                    deadline,
                    link,
                    organization,
                    media
                }
            });

            // Send notifications to all followers of the seller
            const followers = await ListingUserFollowing.find({ seller: user }).populate('follower');
            const sellerDetails = await User.findById(user)

            const notificationMessage = `A seller you follow, ${sellerDetails.firstname + ' ' + sellerDetails.lastname} has created a new Listing on the marketplace - ${title.toUpperCase()}`;

            for (const follower of followers) {
                await ListingNotification.create({
                    recipient: follower.follower,
                    sender: user,
                    listing: newItemListing._id,
                    action: "created",
                    isSystemNotification: true,
                    message: notificationMessage
                });
            }

            return res.status(200).json({ message: "Listing created successfully" });
        }

    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /users/marketplace/notifications/{userId}:
 *   get:
 *     summary: Get marketplace notifications for a user (buyer)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: List of marketplace notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ListingNotification'
 *       500:
 *         description: Server error.
 */

// Route to get all marketplace notifications of a user (buyer)
router.get('/marketplace/notifications/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const notifications = await ListingNotification.find({
            recipient: userId
        }).sort({ date: -1 });

        res.json({ notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/listings:
 *   get:
 *     summary: Get Listings
 *     description: Get all listings sorted by creation date
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'  # Reference to your Listing schema
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

router.get('/marketplace/listings', async (req, res) => {
    try {
        // Get all listings and populate the user field
        const listings = await Listing.find()
            .populate('user', 'firstname lastname profilePhoto education personal createdAt')
            .populate({
                path: 'itemsForSale.category housingAndResources.category academicAssistance.category jobListing.category',
                model: 'ListingCategory',
            })
            .sort({ createdAt: -1 });


        const sortedListings = shuffleArray(listings);

        res.status(200).json({ listings: sortedListings });
    } catch (error) {
        console.error('Error getting listings:', error);
        res.status(500).json({ error: 'An error occurred while fetching listings' });
    }
});

/**
 * @swagger
 * /users/marketplace/bookmark:
 *   post:
 *     summary: Add or Remove Marketplace Listing from Bookmarks
 *     description: Add or remove a marketplace listing from user's bookmarks
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User's ObjectId
 *               listing:
 *                 type: string
 *                 description: Listing's ObjectId
 *     responses:
 *       200:
 *         description: Successfully added or removed listing from bookmarks
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
 *                 error:
 *                   type: string
 */

// Add or remove a listing from user's bookmarks
router.post('/marketplace/bookmark', async (req, res) => {
    const { user, listing } = req.body;

    try {
        // Check if the user has already bookmarked the listing
        const existingBookmark = await ListingBookmark.findOne({ user, listing });

        if (existingBookmark) {
            // If bookmark exists, remove it
            await ListingBookmark.deleteOne({ user, listing });
            res.status(200).json({ message: 'Listing removed from bookmarks' });
        } else {
            // If bookmark doesn't exist, add it
            const newBookmark = new ListingBookmark({ user, listing });
            await newBookmark.save();
            res.status(201).json({ message: 'Listing added to bookmarks' });
        }
    } catch (error) {
        console.error('Error adding/removing bookmark:', error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
});


/**
 * @swagger
 * /users/marketplace/is-bookmarked/{listingId}:
 *   get:
 *     summary: Check if a listing is bookmarked by a user
 *     description: Check if a listing is bookmarked by a user based on the listing ID and user ID.
 *     tags: [User]
 *     parameters:
 *       - name: listingId
 *         in: path
 *         description: The ID of the listing
 *         required: true
 *         schema:
 *           type: string
 *       - name: user
 *         in: query
 *         description: The ID of the user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully checked if the listing is bookmarked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isBookmarked:
 *                   type: boolean
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/marketplace/is-bookmarked/:listingId', async (req, res) => {
    const { listingId } = req.params;
    const { user } = req.query;

    try {
        const bookmark = await ListingBookmark.findOne({ user, listing: listingId });

        if (bookmark) {
            return res.json({ isBookmarked: true });
        } else {
            return res.json({ isBookmarked: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/marketplace/bookmarks/{userId}:
 *   get:
 *     summary: Get listing bookmarks of a user
 *     description: Get listing bookmarks of a user based on the user ID.
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: The ID of the user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user's listing bookmarks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ListingBookmark'  # Reference to your ListingBookmark schema
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/marketplace/bookmarks/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const bookmarks = await ListingBookmark.find({ user: userId })
            .populate({
                path: 'listing',
                populate: [
                    { path: 'user', select: 'firstname lastname profilePhoto education personal createdAt' },
                    { path: 'itemsForSale.category housingAndResources.category academicAssistance.category', model: 'ListingCategory' }
                ]
            });

        // Filter out bookmarks with null listing
        const filteredBookmarks = bookmarks.filter(bookmark => bookmark.listing);

        res.status(200).json({ bookmarks: filteredBookmarks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/listing/{id}:
 *   get:
 *     summary: Get a marketplace listing by ID
 *     tags: [User]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the listing to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the retrieved listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       '404':
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Listing not found
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error
 */
router.get('/marketplace/listing/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Assuming you have a Listing model defined
        const listing = await Listing.findById(id).populate('user', 'firstname lastname profilePhoto education personal createdAt')
            .populate({
                path: 'itemsForSale.category housingAndResources.category academicAssistance.category',
                model: 'ListingCategory',
            })

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.status(200).json({ listing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/marketplace/listing/is-bookmarked/{listingId}:
 *   get:
 *     summary: Check if a marketplace listing is bookmarked by a user
 *     tags: [User]
 *     parameters:
 *       - name: listingId
 *         in: path
 *         description: ID of the listing to check for bookmark
 *         required: true
 *         schema:
 *           type: string
 *       - name: userId
 *         in: query
 *         description: ID of the user to check if they bookmarked the listing
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with bookmark status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isBookmarked:
 *                   type: boolean
 *                   example: true (or) false
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error
 */

// Route to check if an event is bookmarked by a user
router.get('/marketplace/listing/is-bookmarked/:listingId', async (req, res) => {
    const { listingId } = req.params;
    const { userId } = req.query;

    try {
        const bookmark = await ListingBookmark.findOne({ user: userId, listing: listingId });

        if (bookmark) {
            return res.json({ isBookmarked: true });
        } else {
            return res.json({ isBookmarked: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/marketplace/listing/bookmark/{listingId}:
 *   post:
 *     summary: Bookmark or unbookmark a marketplace listing
 *     tags: [User]
 *     parameters:
 *       - name: listingId
 *         in: path
 *         description: ID of the listing to bookmark/unbookmark
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user bookmarking/unbookmarking the listing
 *     responses:
 *       '200':
 *         description: Successful response with bookmark status message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing saved to bookmarks (or) Listing removed from bookmarks
 *       '404':
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Listing not found
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error
 */

router.post('/marketplace/listing/bookmark/:listingId', async (req, res) => {
    const { listingId } = req.params;
    const { userId } = req.body;

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        const bookmark = await ListingBookmark.findOne({ user: userId, listing: listingId });

        if (bookmark) {
            await ListingBookmark.deleteOne({ user: userId, listing: listingId });
            return res.json({ message: 'Listing removed from bookmarks' });
        } else {
            await ListingBookmark.create({ user: userId, listing: listingId });
            return res.json({ message: 'Listing saved to bookmarks' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /users/marketplace/listing/report:
 *   post:
 *     summary: Report a marketplace listing
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: ID of the listing to report
 *               userId:
 *                 type: string
 *                 description: ID of the user reporting the listing
 *               reason:
 *                 type: string
 *                 description: Reason for reporting the listing
 *               explanation:
 *                 type: string
 *                 description: Explanation for reporting the listing
 *     responses:
 *       '200':
 *         description: Successful response with report confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing reported successfully
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error
 */

router.post('/marketplace/listing/report', async (req, res) => {
    const { listingId, userId, reason, explanation } = req.body;

    try {
        // Check if the user has reported the listing before
        const existingReport = await ReportListing.findOne({ listing: listingId, user: userId });

        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this listing' });
        }

        // Create a new report
        const report = new ReportListing({
            listing: listingId,
            user: userId,
            reason: reason,
            explanation: explanation,
            dateReported: new Date()
        });

        // Save the report
        await report.save();

        res.json({ message: 'Listing reported successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/send-message:
 *   post:
 *     summary: Send a message in the marketplace
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *                 description: ID of the sender user
 *               recipientId:
 *                 type: string
 *                 description: ID of the recipient user
 *               listingId:
 *                 type: string
 *                 description: ID of the listing associated with the message
 *               content:
 *                 type: string
 *                 description: Content of the message
 *     responses:
 *       '200':
 *         description: Successful response with message sent confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *       '500':
 *         description: An error occurred while sending the message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while sending the message
 */

router.post('/marketplace/send-message', async (req, res) => {
    try {
        const { senderId, recipientId, listingId, content } = req.body;

        // Save the message to the database using Mongoose
        const newMessage = {
            sender: senderId,
            receiver: recipientId,
            content: content,
            timeSent: new Date(),
            status: 'sent'
        };

        // Find or create the chat between sender and receiver
        let chat = await MarketplaceMessage.findOne({
            $or: [
                { sender: senderId, receiver: recipientId, listing:listingId },
                { sender: recipientId, receiver: senderId, listing: listingId }
            ]
        });

        if (!chat) { // Create a new chat if it doesn't exist
            chat = new MarketplaceMessage({
                sender: senderId,
                receiver: recipientId,
                listing: listingId,
                messages: [newMessage]
            });
        } else { // Add the new message to the messages array
            chat.messages.push(newMessage);
        }

        // Save the chat document
        await chat.save();

        // Respond with a success message or status code (200 OK)
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
});


/**
 * @swagger
 * /users/marketplace/listing/delete/{listingId}:
 *   delete:
 *     summary: Delete a marketplace listing by ID
 *     tags: [User]
 *     parameters:
 *       - name: listingId
 *         in: path
 *         description: ID of the listing to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with delete message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Listing deleted successfully
 *       '404':
 *         description: Listing not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Listing not found
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while deleting the listing
 */

router.delete('/marketplace/listing/delete/:listingId', async (req, res) => {
    const { listingId } = req.params;

    try {
        // Check if the listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Delete the listing
        await Listing.findByIdAndDelete(listingId);

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ error: 'An error occurred while deleting the listing' });
    }
});

/**
 * @swagger
 * /users/marketplace/follow-seller:
 *   post:
 *     summary: Follow or unfollow a seller's listing
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followerId:
 *                 type: string
 *                 description: ID of the follower user
 *               sellerId:
 *                 type: string
 *                 description: ID of the seller user
 *     responses:
 *       '200':
 *         description: Successful response with follow/unfollow status message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Followed successfully
 *       '500':
 *         description: An error occurred while following/unfollowing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while following/unfollowing
 */

// Follow or Unfollow a seller
router.post('/marketplace/follow-seller', async (req, res) => {
    const { followerId, sellerId } = req.body;

    try {
        // Check if the user is already following the seller
        const existingFollowing = await ListingUserFollowing.findOne({ follower: followerId, seller: sellerId });

        if (existingFollowing) {
            // If already following, remove the following relationship
            await ListingUserFollowing.findOneAndDelete({ follower: followerId, seller: sellerId });
            res.json({ message: 'Unfollowed successfully' });
        } else {
            // If not following, create the following relationship
            const newFollowing = new ListingUserFollowing({
                follower: followerId,
                seller: sellerId,
                dateFollowed: new Date()
            });
            await newFollowing.save();
            res.json({ message: 'Followed successfully' });
        }
    } catch (error) {
        console.error('Error following/unfollowing:', error);
        res.status(500).json({ error: 'An error occurred while following/unfollowing' });
    }
});

/**
 * @swagger
 * /users/marketplace/check-follow:
 *   get:
 *     summary: Check if a user is following a seller's listing
 *     tags:
 *       - User
 *     parameters:
 *       - name: followerId
 *         in: query
 *         description: ID of the follower user
 *         required: true
 *         schema:
 *           type: string
 *       - name: sellerId
 *         in: query
 *         description: ID of the seller user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the follow status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         description: An error occurred while checking follow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while checking follow
 */

// Check if a user is following a seller's listing
router.get('/marketplace/check-follow', async (req, res) => {
    const { followerId, sellerId } = req.query;
    try {
        // Check if the user is following the seller's listing

        const isFollowing = await ListingUserFollowing.findOne({ follower: followerId, seller: sellerId });

        if (isFollowing) {
            return res.json({ isFollowing: true });
        } else {
            return res.json({ isFollowing: false });
        }

        res.json({ isFollow: isFollowing });
    } catch (error) {
        console.error('Error checking follow:', error);
        res.status(500).json({ error: 'An error occurred while checking follow' });
    }
});

/**
 * @swagger
 * /users/marketplace/followings/{userId}:
 *   get:
 *     summary: Get followings of a user
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user whose followings to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the list of followings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserFollowing'
 *       '500':
 *         description: An error occurred while fetching followings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching followings
 */

// Get all followings of a particular user
router.get('/marketplace/followings/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find all followings of the user
        const followings = await ListingUserFollowing.find({ follower: userId })
            .populate([
                { path: 'seller', select: 'firstname lastname personal email education profilePhoto' },
                { path: 'follower', select: 'firstname lastname personal education profilePhoto' }
            ]);
        res.json({ followings });
    } catch (error) {
        console.error('Error fetching followings:', error);
        res.status(500).json({ error: 'An error occurred while fetching followings' });
    }
});

/**
 * @swagger
 * /users/marketplace/followers/{userId}:
 *   get:
 *     summary: Get followers of a user
 *     tags:
 *       - User
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user whose followers to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the list of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserFollowing'
 *       '500':
 *         description: An error occurred while fetching followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching followers
 */

// Get all followers of a particular user
router.get('/marketplace/followers/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find all followers of the user
        const followers = await ListingUserFollowing.find({ seller: userId })
            .populate([
                { path: 'seller', select: 'firstname lastname personal education profilePhoto' },
                { path: 'follower', select: 'firstname lastname personal email profilePhoto' }
            ]);
        res.json({ followers });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'An error occurred while fetching followers' });
    }
});


/**
 * @swagger
 * /users/marketplace/{followerId}/unfollow/{sellerId}:
 *   delete:
 *     summary: Unfollow a seller
 *     tags:
 *       - User
 *     parameters:
 *       - name: followerId
 *         in: path
 *         description: ID of the follower user
 *         required: true
 *         schema:
 *           type: string
 *       - name: sellerId
 *         in: path
 *         description: ID of the seller user
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unfollowed successfully
 *       '404':
 *         description: Following not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Following not found
 *       '500':
 *         description: An error occurred while unfollowing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while unfollowing
 */

// Remove a following
router.delete('/marketplace/:followerId/unfollow/:sellerId', async (req, res) => {
    const { followerId, sellerId } = req.params;

    try {
        // Check if the following exists for the given follower and seller
        const existingFollowing = await ListingUserFollowing.findOneAndDelete({
            $or: [
                { follower: followerId, seller: sellerId },
                { follower: sellerId, seller: followerId } // Check if it exists in reversed order
            ]
        });

        if (existingFollowing) {
            res.json({ message: 'Unfollowed successfully' });
        } else {
            res.status(404).json({ error: 'Following not found' });
        }
    } catch (error) {
        console.error('Error unfollowing:', error);
        res.status(500).json({ error: 'An error occurred while unfollowing' });
    }
});


/**
 * @swagger
 * /users/marketplace/recent-activity:
 *   post:
 *     summary: Store recent activity when a user visits a listing
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *                 example: 64e2b85115fab064054606db
 *               listingId:
 *                 type: string
 *                 description: ID of the listing visited by the user
 *                 example: 641317483c47e297bedf065f
 *     responses:
 *       '200':
 *         description: Successful response indicating that the recent activity is stored or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recent activity stored successfully
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while storing recent activity
 */

// Route to store recent activity when a user visits a listing
router.post('/marketplace/recent-activity', async (req, res) => {
    const { userId, listingId } = req.body;

    try {
        const currentDateTime = new Date();

        // Upserting the recent activity
        const result = await MarketplaceRecentActivity.findOneAndUpdate(
            { user: userId, listing: listingId },
            { $set: { dateVisited: currentDateTime } },
            { upsert: true, new: true } // Setting "new" to true returns the updated document
        );

        if (result) {
            if (result._id) {
                res.json({ message: 'Recent activity stored or updated successfully' });
            } else {
                res.status(500).json({ error: 'An error occurred while storing recent activity' });
            }
        } else {
            res.status(500).json({ error: 'An error occurred while storing recent activity' });
        }
    } catch (error) {
        console.error('Error storing recent activity:', error);
        res.status(500).json({ error: 'An error occurred while storing recent activity' });
    }
});


/**
 * @swagger
 * /users/marketplace/recent-activity/{userId}:
 *   get:
 *     summary: Get recent activity of a user
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user to retrieve recent activity for
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the user's recent activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceRecentActivity'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching recent activity
 */

router.get('/marketplace/recent-activity/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find recent activity records for the user
        const recentActivity = await MarketplaceRecentActivity.find({ user: userId })
            .populate({
                path: 'listing',
                populate: [
                    { path: 'user', select: 'firstname lastname profilePhoto education personal createdAt' },
                    { path: 'itemsForSale.category housingAndResources.category academicAssistance.category', model: 'ListingCategory' }
                ]
            }).sort({ dateVisited:-1});
        res.json({ recentActivity });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'An error occurred while fetching recent activity' });
    }
});

/**
 * @swagger
 * /users/marketplace/clicked-listings/{userId}:
 *   get:
 *     summary: Get the count of clicked listings for a user
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user whose clicked listings count is to be retrieved
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the count of clicked listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clickedListingsCount:
 *                   type: integer
 *                   description: The count of clicked listings for the user
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching clicked listings
 */

router.get('/marketplace/clicked-listings/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Populate the listing field in the recent activities
        const populatedRecentActivities = await MarketplaceRecentActivity.find()
            .populate({
                path: 'listing',
                populate: [
                    { path: 'user', select: 'firstname lastname profilePhoto education personal createdAt' },
                    { path: 'itemsForSale.category housingAndResources.category academicAssistance.category', model: 'ListingCategory' }
                ]
            });

        // Count the number of listings where the user._id matches the provided userId
        let clickedListingsCount = 0;
        populatedRecentActivities.forEach(activity => {
            if (activity.listing && activity.listing.user._id.toString() === userId) {
                clickedListingsCount++;
            }
        });

        res.json({ clickedListingsCount });
    } catch (error) {
        console.error('Error fetching clicked listings:', error);
        res.status(500).json({ error: 'An error occurred while fetching clicked listings' });
    }
});

router.get('/marketplace/saved-listings/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find all bookmarks for the user
        const bookmarks = await ListingBookmark.find({ user: userId })
            .populate({
                path: 'listing',
                populate: [
                    { path: 'user', select: 'firstname lastname profilePhoto education personal createdAt' },
                    { path: 'itemsForSale.category housingAndResources.category academicAssistance.category', model: 'ListingCategory' }
                ]
            });

        // Count the number of saved listings for the user
        const savedListingsCount = bookmarks.length;

        res.json({ savedListingsCount });
    } catch (error) {
        console.error('Error fetching saved listings:', error);
        res.status(500).json({ error: 'An error occurred while fetching saved listings' });
    }
});

/**
 * @swagger
 * /users/marketplace/seller-followers/count/{sellerId}:
 *   get:
 *     summary: Count the number of followers for a seller
 *     tags: [User]
 *     parameters:
 *       - name: sellerId
 *         in: path
 *         description: ID of the seller whose followers count to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the count of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followersCount:
 *                   type: number
 *                   example: 10
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching followers count
 */
router.get('/marketplace/seller-followers/count/:sellerId', async (req, res) => {
    const { sellerId } = req.params;

    try {
        // Count the number of followers for the seller
        const followersCount = await ListingUserFollowing.countDocuments({ seller: sellerId });

        res.json({ followersCount });
    } catch (error) {
        console.error('Error fetching followers count:', error);
        res.status(500).json({ error: 'An error occurred while fetching followers count' });
    }
});

/**
 * @swagger
 * /users/marketplace/listings/{userId}:
 *   get:
 *     summary: Get listings for a specific user
 *     tags: [User]
 *     parameters:
 *       - name: userId
 *         in: path
 *         description: ID of the user whose listings to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the user's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching listings
 */
router.get('/marketplace/listings/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Get listings for the specific user and populate the required fields
        const listings = await Listing.find({ user: userId })
            .populate('user', 'firstname lastname profilePhoto education personal createdAt')
            .populate({
                path: 'jobListing.category itemsForSale.category housingAndResources.category academicAssistance.category',
                model: 'ListingCategory',
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ listings });
    } catch (error) {
        console.error('Error getting listings:', error);
        res.status(500).json({ error: 'An error occurred while fetching listings' });
    }
});


/**
 * @swagger
 * /users/marketplace/seller/{sellerId}/followers:
 *   get:
 *     summary: Get followers of a specific seller
 *     tags: [User]
 *     parameters:
 *       - name: sellerId
 *         in: path
 *         description: ID of the seller whose followers to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with the seller's followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching followers
 */
router.get('/marketplace/seller/:sellerId/followers', async (req, res) => {
    const { sellerId } = req.params;
    try {
        // Find all followers of the seller
        const followers = await ListingUserFollowing.find({ seller: sellerId })
            .populate('follower', 'firstname lastname personal education profilePhoto');
        res.json({ followers });
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'An error occurred while fetching followers' });
    }
});


/**
 * @swagger
 * /users/marketplace/category/{category}:
 *   get:
 *     summary: Get marketplace items by category
 *     tags: [User]
 *     parameters:
 *       - name: category
 *         in: path
 *         description: Title of the category to retrieve items from
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response with items under the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceItem'
 *       '404':
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.get('/marketplace/category/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const categoryExists = await ListingCategory.findOne({ title: { $regex: new RegExp(category, "i") } });

        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const listingType = categoryExists.listingType;

        const itemsUnderCategory = await Listing.find({
            'listingType': listingType,
            [`${listingType}.category`]: categoryExists._id
        }).populate('user', 'firstname lastname profilePhoto education personal createdAt')
            .populate({
                path: 'itemsForSale.category housingAndResources.category academicAssistance.category jobListing.category',
                model: 'ListingCategory',
            })
            .sort({ createdAt: -1 });

        const sortedListings = shuffleArray(itemsUnderCategory);;

        res.json({sortedListings});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/notifications/unread/{userId}:
 *   get:
 *     summary: Count unread marketplace notifications for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: Count of unread marketplace notifications retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *       500:
 *         description: Server error.
 */

// Route to count the number of unread marketplace notifications for a user
router.get('/marketplace/notifications/unread/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const unreadCount = await ListingNotification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/notifications/mark-read/{userId}:
 *   put:
 *     summary: Mark all marketplace notifications as read for a user
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID.
 *     responses:
 *       200:
 *         description: All marketplace notifications marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *       500:
 *         description: Server error.
 */

// Route to mark all marketplace notifications as read for a user
router.put('/marketplace/notifications/mark-read/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        await ListingNotification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /users/marketplace/messages/buyer/{userId}:
 *   get:
 *     summary: Get messages where the user is the buyer
 *     description: Retrieves messages where the specified user is the buyer.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user who is the buyer.
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceMessage'
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

// Route to get all messages where the user is the buyer
router.get('/marketplace/messages/buyer/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      const messages = await MarketplaceMessage.find({ 'receiver': userId })
      .populate('sender receiver listing')
      .sort('messages.timeSent');

    res.json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /users/marketplace/messages/seller/{userId}:
 *   get:
 *     summary: Get messages where the user is the seller
 *     description: Retrieves messages where the specified user is the seller.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user who is the seller.
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceMessage'
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

// Route to get all messages where the user is the seller
router.get('/marketplace/messages/seller/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const messages = await MarketplaceMessage.find({ 'sender': userId })
            .populate('sender receiver listing')
            .sort('messages.timeSent');

        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
 


/**
 * @swagger
 * /users/raise/become-donor/{userId}:
 *   post:
 *     summary: Submit or update a donor application
 *     description: Submits or updates a donor application for the specified donor.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the donor to submit or update the application for.
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Identification file to upload.
 *       - in: formData
 *         name: dob
 *         type: string
 *         required: true
 *         description: Date of Birth of the donor.
 *       - in: formData
 *         name: contactAddress
 *         type: string
 *         required: true
 *         description: Contact address of the donor.
 *       - in: formData
 *         name: phoneNo
 *         type: string
 *         required: true
 *         description: Phone number of the donor.
 *       - in: formData
 *         name: sourceOfFunds
 *         type: string
 *         required: true
 *         description: Source of funds for the donation.
 *       - in: formData
 *         name: donationPurpose
 *         type: string
 *         required: true
 *         description: Purpose of the donation.
 *       - in: formData
 *         name: backgroundAffiliations
 *         type: string
 *         required: true
 *         description: Background affiliations of the donor.
 *       - in: formData
 *         name: organization
 *         type: string
 *         required: true
 *         description: Organization of the donor.
 *       - in: formData
 *         name: linkedinProfile
 *         type: string
 *         description: LinkedIn profile URL of the donor.
 *       - in: formData
 *         name: facebookUsername
 *         type: string
 *         description: Facebook username of the donor.
 *       - in: formData
 *         name: twitterHandle
 *         type: string
 *         description: Twitter handle of the donor.
 *       - in: formData
 *         name: amlAcknowledge
 *         type: boolean
 *         required: true
 *         description: Anti-Money Laundering (AML) acknowledgment.
 *     responses:
 *       200:
 *         description: Donor application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donor:
 *                   type: object
 *                 message:
 *                   type: string
 *       201:
 *         description: Donor application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donor:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: No photo uploaded or required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Donor not found
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

router.post('/raise/become-donor/:userId', upload10.single('file'), async (req, res) => {
    const userId = req.params.userId;

    try {
      
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!req.file) {
            return res.status(400).json({ error: "No photo uploaded" });
        }

        // Upload the avatar image to Backblaze B2
        const fileName = `donorsIdentity/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const fileBuffer = req.file.buffer;

        await b2.authorize();

        const response = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const uploadResponse = await b2.uploadFile({
            uploadUrl: response.data.uploadUrl,
            uploadAuthToken: response.data.authorizationToken,
            fileName: fileName,
            data: fileBuffer,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;
        const uploadedFileName = uploadResponse.data.fileName;
        const identificationFile = `https://f005.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
        
        // Check if an existing donor application exists for the user
        const existingApplication = await DonorApplication.findOne({ user: userId });

        const {
            dob,
            contactAddress,
            phoneNo,
            sourceOfFunds,
            donationPurpose,
            backgroundAffiliations,
            organization,
            linkedinProfile,
            facebookUsername,
            twitterHandle,
            amlAcknowledge
        } = req.body;

        const donorApplicationData = {
            user: userId,
            applicationSource: 'user',
            dob,
            contactAddress,
            phoneNo,
            sourceOfFunds,
            donationPurpose,
            backgroundAffiliations,
            organization,
            linkedinProfile,
            facebookUsername,
            twitterHandle,
            amlAcknowledge: amlAcknowledge === 'true',  
            identificationFile,
        };

        if (existingApplication) {
            // Update existing donor application
            existingApplication.set(donorApplicationData);
            await existingApplication.save();

            //update the user account data
            existingUser.isDonorStatus = "Application Submitted";
            existingUser.save();

            const user = await User.findById(userId)
                .select("-password -token")
                .populate("friends.userId", "firstname lastname profilePhoto");

            res.status(200).json({
                message: "Donor application updated successfully!",
                user: user
            });
        } else {
            // Create a new donor application
            const newDonorApplication = new DonorApplication(donorApplicationData);
            await newDonorApplication.save();


            //update the user account data
            existingUser.isDonorStatus = "Application Submitted";
            existingUser.save();

            const user = await User.findById(userId)
                .select("-password -token")
                .populate("friends.userId", "firstname lastname profilePhoto");

            res.status(200).json({
                message: "Donor application updated successfully!",
                user:user
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "An error occurred while processing the donor application.",
        });
    }
});

/**
 * @swagger
 * /users/raise/notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     description: Retrieves notifications for the specified user.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to retrieve notifications for.
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DonorNotification'
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

// Route to get notifications for a user
router.get('/raise/notifications/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const notifications = await DonorNotification.find({ recipient: userId })
            .sort({ date: -1 })
            .populate('recipient', '-password -token');  

        res.status(200).json({ notifications });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching notifications.' });
    }
});

/**
 * @swagger
 * /users/raise/apply-for-raise/{userId}:
 *   post:
 *     summary: Apply for a raise
 *     description: Submit an application for a raise with necessary details and files.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user applying for the raise.
 *       - in: formData
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Title of the raise application.
 *       - in: formData
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category of the raise application.
 *       - in: formData
 *         name: reason
 *         schema:
 *           type: string
 *         required: true
 *         description: Reason for applying for the raise.
 *       - in: formData
 *         name: amountRequest
 *         schema:
 *           type: number
 *         required: true
 *         description: Amount being requested in the raise.
 *       - in: formData
 *         name: displayPersonalDetails
 *         schema:
 *           type: boolean
 *         description: Whether to display personal details in the raise application.
 *       - in: formData
 *         name: dob
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date of birth of the applicant.
 *       - in: formData
 *         name: phoneNo
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number of the applicant.
 *       - in: formData
 *         name: contactAddress
 *         schema:
 *           type: string
 *         required: true
 *         description: Contact address of the applicant.
 *       - in: formData
 *         name: semesterResultFile
 *         type: file
 *         description: Semester result file to upload.
 *         required: true
 *       - in: formData
 *         name: identificationFile
 *         type: file
 *         description: Identification file to upload.
 *         required: true
 *     responses:
 *       201:
 *         description: Raise application submitted successfully
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
 *                 error:
 *                   type: string
 */

// POST route to apply for a raise
router.post('/raise/apply-for-raise/:userId', upload10.fields([{ name: 'semesterResultFile' }, { name: 'bannerImageFile' }, { name: 'identificationFile' }]), async (req, res) => {
    const userId = req.params.userId;

    // Create a new raise application using the schema and request body
    const raiseApplication = new RaiseApplication({
        user: userId,
        title: req.body.title,
        category: req.body.category,
        reason: req.body.reason,
        amountRequest: req.body.amountRequest,
        displayPersonalDetails: req.body.displayPersonalDetails,
        dob: req.body.dob,
        phoneNo: req.body.phoneNo,
        contactAddress: req.body.contactAddress,
        semesterResultFile: null, // We'll set this value later
        identificationFile: null, // We'll set this value later
        bannerImageFile: null, // We'll set this value later
    });

    try {
        // Upload the files to Backblaze B2
        const semesterResultFileBuffer = req.files['semesterResultFile'][0].buffer;
        const identificationFileBuffer = req.files['identificationFile'][0].buffer;
        const bannerImageFileBuffer = req.files['bannerImageFile'][0].buffer;

        const semesterResultFileName = `raise/semesterResult/${userId}_${Date.now()}_${req.files['semesterResultFile'][0].originalname.replace(/\s+/g, '_')}`;
        const identificationFileName = `raise/identification/${userId}_${Date.now()}_${req.files['identificationFile'][0].originalname.replace(/\s+/g, '_')}`;
        const bannerImageFileName = `raise/banner/${userId}_${Date.now()}_${req.files['bannerImageFile'][0].originalname.replace(/\s+/g, '_')}`;

        await b2.authorize();

        const response1 = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const response2 = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const response3 = await b2.getUploadUrl({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
        });

        const bucketName = process.env.BACKBLAZE_BUCKET;

        const uploadResult1 = await b2.uploadFile({
            uploadUrl: response1.data.uploadUrl,
            uploadAuthToken: response1.data.authorizationToken,
            fileName: semesterResultFileName,
            data: semesterResultFileBuffer,
        });

        const uploadResult2 = await b2.uploadFile({
            uploadUrl: response2.data.uploadUrl,
            uploadAuthToken: response2.data.authorizationToken,
            fileName: identificationFileName,
            data: identificationFileBuffer,
        });

        const uploadResult3 = await b2.uploadFile({
            uploadUrl: response3.data.uploadUrl,
            uploadAuthToken: response3.data.authorizationToken,
            fileName: bannerImageFileName,
            data: bannerImageFileBuffer,
        });

        const semesterResultFileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadResult1.data.fileName}`;
        const identificationFileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadResult2.data.fileName}`;
        const bannerImageFileUrl = `https://f005.backblazeb2.com/file/${bucketName}/${uploadResult3.data.fileName}`;

        // Update the raise application with file URLs
        raiseApplication.semesterResultFile = semesterResultFileUrl;
        raiseApplication.identificationFile = identificationFileUrl;
        raiseApplication.bannerImageFile = bannerImageFileUrl;

        // Save the raise application to the database
        const savedApplication = await raiseApplication.save();
        res.status(201).json({message:"Raise Application submitted successfully"});
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while processing the raise application.' });
    }
});


/**
 * @swagger
 * /users/raise/get-user-applications/{userId}:
 *   get:
 *     summary: Get all raise applications of a user
 *     description: Retrieves all raise applications submitted by the specified user.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to retrieve raise applications for.
 *     responses:
 *       200:
 *         description: Raise applications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 raiseApplications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RaiseApplication'
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
router.get('/raise/get-user-applications/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const raiseApplications = await RaiseApplication.find({ user: userId }).populate("user").populate("category");
        res.status(200).json({ raiseApplications });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while fetching raise applications.' });
    }
});

/**
 * @swagger
 * /users/raise/get-user-applications/{userId}:
 *   get:
 *     summary: Get all raise applications of a user
 *     description: Retrieves all raise applications submitted by the specified user.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to retrieve raise applications for.
 *     responses:
 *       200:
 *         description: Raise applications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 raiseApplications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RaiseApplication'
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
router.get('/raise/categories', async (req, res) => {
    try {
        // Retrieve all categories from the database
        const categories = await RaiseCategory.find();

        res.status(200).json({ categories });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred while retrieving categories' });
    }
});

/**
 * @swagger
 * /users/raise/get-application/{id}:
 *   get:
 *     summary: Get a specific raise application
 *     description: Retrieves a specific raise application by its ID.
 *     tags:
 *       - User
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the raise application to retrieve.
 *     responses:
 *       200:
 *         description: Raise application fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 raiseApplication:
 *                   $ref: '#/components/schemas/RaiseApplication'
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

router.get('/raise/get-application/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const raiseApplication = await RaiseApplication.findById(id).populate("user").populate("category").sort({ createdAt: -1 });
        res.status(200).json({ raiseApplication });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while fetching raise applications.' });
    }
});

router.get('/raise/get-application/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const raiseApplication = await RaiseApplication.findById(id).populate("user").populate("category").sort({ createdAt: -1 });
        res.status(200).json({ raiseApplication });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while fetching raise applications.' });
    }
});

/**
 * @swagger
 * /users/raise/sign-agreement/{id}:
 *   put:
 *     summary: Sign an agreement for a RaiseApplication
 *     description: Signs an agreement for a specific RaiseApplication if the user is the owner.
 *     tags:
 *       - Raise
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the RaiseApplication to sign an agreement for.
 *       - in: body
 *         name: body
 *         description: User ID of the requester.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             user:
 *               type: string
 *               description: User ID of the requester.
 *     responses:
 *       200:
 *         description: Agreement signed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: User is not the owner of the RaiseApplication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: RaiseApplication not found
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

// PUT route to sign an agreement for a RaiseApplication
router.put('/raise/sign-agreement/:id',  async (req, res) => {
    const { id } = req.params;
    const { user } = req.body;

    try {
        // Check if the user is the owner of the RaiseApplication
        const raiseApplication = await RaiseApplication.findById(id);
        if (!raiseApplication) {
            return res.status(404).json({ error: 'RaiseApplication not found' });
        }

        // Check Ownership 
        if(raiseApplication.user != user){
            return res.status(403).json({ error: 'You are not the owner of this RaiseApplication' });
        }

        // Update the RaiseApplication to indicate agreement signed
        raiseApplication.agreementSigned = true;
        raiseApplication.status = "Agreement Completed";

        // Add the log to the application's logs array
        raiseApplication.logs.push({ action: "Application signed successfully" });
        await raiseApplication.save();

        const application = await RaiseApplication.findById(id).populate("user").populate("category").sort({ createdAt: -1 });

        res.status(200).json({ message: 'Agreement signed successfully', application });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while signing the agreement' });
    }
});

router.get('/banks', async (req, res) => {
    try {
        const response = await axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        const banks = response.data;
        res.status(200).json({ banks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching banks.' });
    }
});


/**
 * @swagger
 * /bank-details:
 *   post:
 *     summary: Save user bank details
 *     description: Creates a new bank details entry for the authenticated user.
 *     tags:
 *       - Bank Details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: body
 *         name: bankDetails
 *         schema:
 *           type: object
 *           properties:
 *             bankName:
 *               type: string
 *             bankCode:
 *               type: string
 *             accountNumber:
 *               type: string
 *             bvn:
 *               type: string
 *         required: true
 *         description: Bank details to be saved.
 *     responses:
 *       201:
 *         description: Bank details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bankDetails:
 *                   $ref: '#/components/schemas/BankDetails'
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

// Create a new bank detail entry
router.post('/bank-details/', async (req, res) => {
    try {
        const { bankName, bankCode, accountNumber, bvn } = req.body;
        const userId = req.user._id;  

        // Create a new bank details object
        const bankDetails = new BankDetails({
            user: userId,
            bank: { name: bankName, code: bankCode },
            accountNumber,
            bvn
        });

        // Save the bank details to the database
        await bankDetails.save();

        res.status(201).json({ message: 'Bank details saved successfully', bankDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while saving bank details' });
    }
});

/**
 * @swagger
 * /users/add-bank-details/{userId}:
 *   post:
 *     summary: Save user bank details
 *     description: Creates a new bank details entry for the specified user.
 *     tags:
 *       - Bank Details
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to save bank details for.
 *       - in: body
 *         name: bankDetails
 *         schema:
 *           type: object
 *           properties:
 *             bankName:
 *               type: string
 *             bankCode:
 *               type: string
 *             accountNumber:
 *               type: string
 *             bvn:
 *               type: string
 *         required: true
 *         description: Bank details to be saved.
 *     responses:
 *       201:
 *         description: Bank details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 bankDetails:
 *                   $ref: '#/components/schemas/BankDetails'
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

router.post('/add-bank-details/:userId', async (req, res) => {
    try {
        const { bankName, bankCode, accountNumber, bvn } = req.body;
        const userId = req.params.userId;

        // Check if bank details already exist for the user
        let bankDetails = await BankDetails.findOne({ user: userId });

        if (bankDetails) {
            // Bank details already exist, update them
            bankDetails.bank.name = bankName;
            bankDetails.bank.code = bankCode;
            bankDetails.accountNumber = accountNumber;
            bankDetails.bvn = bvn;
            await bankDetails.save();
        } else {
            // Bank details do not exist, create new entry
            bankDetails = new BankDetails({
                user: userId,
                bank: { name: bankName, code: bankCode },
                accountNumber,
                bvn
            });
            await bankDetails.save();
        }

        res.status(201).json({ message: 'Bank details saved successfully', bankDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while saving bank details' });
    }
});

/**
 * @swagger
 * /users/bank-details/{userId}:
 *   get:
 *     summary: Fetch user bank details
 *     description: Retrieves the bank details for the specified user.
 *     tags:
 *       - Bank Details
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to fetch bank details for.
 *     responses:
 *       200:
 *         description: Bank details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bankDetails:
 *                   $ref: '#/components/schemas/BankDetails'
 *       404:
 *         description: Bank details not found for the user
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
 *                 error:
 *                   type: string
 */


router.get('/bank-details/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the bank details for the specified user
        const bankDetails = await BankDetails.findOne({ user: userId });

        if (!bankDetails) {
            return res.status(404).json({ message: 'Bank details not found for the user' });
        }

        res.status(200).json({ bankDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching bank details' });
    }
});

// Start the Agenda scheduler
(async () => {
    await agenda.start();
    console.log('Agenda scheduler started');
})();

module.exports = router;
