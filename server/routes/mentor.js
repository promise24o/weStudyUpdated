const MentorApplicationWithMentor = require ("../models/MentorApplicationWithMentor");
const cloudinary = require ("cloudinary").v2;
const {CloudinaryStorage} = require ("multer-storage-cloudinary");
const multer = require ("multer");
const {Mentors, Schedule, MentorSessions} = require ("../models/Mentors");
const router = require ("express").Router ();
const crypto = require ("crypto");
const bcrypt = require ("bcrypt");


// Configure Cloudinary credentials
cloudinary.config ({cloud_name: "dbb2dkawt", api_key: "474957451451999", api_secret: "yWE3adlqWuUOG0l3JjqSoIPSI-Q"});

// Configure Multer to use Cloudinary as the storage engine
const randomString = crypto.randomBytes (8).toString ('hex');
const storage = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/mentors/avatars",
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


router.get ("/", function (_req, res) {
    res.send ("Mentor API");
});


/**
 * @swagger
 * /mentor/become-mentor/{mentorId}:
 *   post:
 *     summary: Apply to become a mentor
 *     description: Creates a mentor application for the specified mentor ID.
 *     tags:
 *       - Mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to apply for.
 *       - in: body
 *         name: body
 *         description: Mentor application data.
 *         schema:
 *           type: object
 *           properties:
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *               description: Skills possessed by the mentor.
 *             organization:
 *               type: string
 *               description: Organization the mentor is affiliated with.
 *             education:
 *               type: string
 *               description: Mentor's educational background.
 *             faculty:
 *               type: string
 *               description: Faculty of the mentor.
 *             briefDescription:
 *               type: string
 *               description: Brief description about the mentor.
 *             mentorshipReason:
 *               type: string
 *               description: Reason for applying to become a mentor.
 *             linkedinProfile:
 *               type: string
 *               description: LinkedIn profile of the mentor.
 *             facebookUsername:
 *               type: string
 *               description: Facebook username of the mentor.
 *             twitterHandle:
 *               type: string
 *               description: Twitter handle of the mentor.
 *     responses:
 *       200:
 *         description: Mentor application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mentor:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Mentor not found
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

router.post ('/become-mentor/:mentorId', (req, res) => {
    const mentorId = req.params.mentorId;

    // Check if the mentor exists
    Mentors.findById (mentorId).then ( (mentor) => {
        if (!mentor) {
            return res.status (404).json ({error: 'Mentor not found'});
        }

        // Check if the mentor has an avatar
        if (!mentor.avatar) {
            return res.status (400).json ({error: 'Please Upload your Profile Photo before submitting'});
        }

        mentor.status = 'Application Submitted';

        // Extract the form values from the request body
        const {
            skills,
            organization,
            education,
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

        // Check if an existing mentor application exists for the user
        MentorApplicationWithMentor.findOne ({mentorId}).then ( (existingApplication) => {
            if (existingApplication) { // Update the existing mentor application
                existingApplication.skills = skills;
                existingApplication.organization = organization;
                existingApplication.education = education;
                existingApplication.faculty = faculty;
                existingApplication.about = briefDescription;
                existingApplication.reason = mentorshipReason;
                existingApplication.linkedin = linkedinProfile;
                existingApplication.facebook = facebookUsername;
                existingApplication.twitterHandle = twitterHandle;
                existingApplication.googleMeet = googleMeet;
                existingApplication.status = 'Application Submitted';

                existingApplication.save ().then ( () => {
                    res.status (200).json ({mentor, message: 'Mentor application updated successfully'});
                }).catch ( (error) => {
                    console.error (error);
                    res.status (500).json ({error: 'Failed to update mentor application'});
                });
            } else { // Create a new mentor application instance
                const mentorApplication = new MentorApplicationWithMentor ({
                    mentorId,
                    skills,
                    organization,
                    education,
                    faculty,
                    about: briefDescription,
                    reason: mentorshipReason,
                    linkedin: linkedinProfile,
                    googleMeet,
                    facebook: facebookUsername,
                    twitterHandle,
                    status: 'Application Submitted'
                });

                mentorApplication.save ().then ( () => {
                    res.status (200).json ({mentor, message: 'Mentor application submitted successfully'});
                }).catch ( (error) => {
                    console.error (error);
                    res.status (500).json ({error: 'Failed to submit mentor application'});
                });
            }
        }).catch ( (error) => {
            console.error (error);
            res.status (500).json ({error: 'Failed to check existing mentor application'});
        });
    }).catch ( (error) => {
        console.error (error);
        res.status (500).json ({error: 'Failed to check mentor existence'});
    });
});

/**
 * @swagger
 * /mentor/upload-avatar/{mentorId}:
 *   post:
 *     summary: Upload avatar for a mentor
 *     description: Uploads an avatar image for the specified mentor.
 *     tags:
 *       - Mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to upload the avatar for.
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Avatar image file to upload.
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mentor:
 *                   type: object
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */


router.post ("/upload-avatar/:mentorId", upload.single ("file"), async (req, res) => {
    const mentorId = req.params.mentorId;
    try {
        if (!req.file) {
            return res.status (400).json ({error: "No photo uploaded"});
        }

        // Update the mentor's photo in the database

        const result = await cloudinary.uploader.upload (req.file.path);

        const updatedMentor = await Mentors.findOneAndUpdate ({
            _id: mentorId
        }, {
            $set: {
                avatar: result.secure_url
            }
        }, {new: true}).select ("-password -token");

        res.status (200).send ({mentor: updatedMentor, message: "Photo Uploaded Successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

/**
 * @swagger
 * /mentor/update-profile:
 *   post:
 *     summary: Update mentor profile
 *     description: Updates the profile of a mentor.
 *     tags:
 *       - Mentor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mentorId:
 *                 type: string
 *                 description: ID of the mentor to update the profile for.
 *               city:
 *                 type: string
 *                 description: City of the mentor.
 *               gender:
 *                 type: string
 *                 description: Gender of the mentor.
 *               phone:
 *                 type: string
 *                 description: Phone number of the mentor.
 *               country:
 *                 type: string
 *                 description: Country of the mentor.
 *               institution:
 *                 type: string
 *                 description: Institution of the mentor.
 *               facebook:
 *                 type: string
 *                 description: Facebook profile of the mentor.
 *               linkedin:
 *                 type: string
 *                 description: LinkedIn profile of the mentor.
 *               twitter:
 *                 type: string
 *                 description: Twitter profile of the mentor.
 *               bio:
 *                 type: string
 *                 description: Biography of the mentor.
 *               skills:
 *                 type: string
 *                 description: Skills of the mentor.
 *     responses:
 *       200:
 *         description: Mentor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mentor:
 *                   type: object
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

router.post ('/update-profile', async (req, res) => {
    try {
        const {
            mentorId,
            city,
            gender,
            phone,
            country,
            institution,
            facebook,
            linkedin,
            googleMeet,
            twitter,
            bio,
            skills
        } = req.body;

        const updatedMentor = await Mentors.findByIdAndUpdate (mentorId, {
            city,
            gender,
            phone,
            country,
            institution,
            facebook,
            linkedin,
            twitter,
            googleMeet,
            bio,
            skills
        }, {new: true});

        res.status (200).json ({message: 'Mentor profile updated successfully', mentor: updatedMentor});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred'});
    }
});

/**
 * @swagger
 * /mentor/change-password:
 *   post:
 *     summary: Change mentor password
 *     description: Changes the password of a mentor.
 *     tags:
 *       - Mentor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mentorId:
 *                 type: string
 *                 description: ID of the mentor to change the password for.
 *               password:
 *                 type: string
 *                 description: Current password of the mentor.
 *               newPassword:
 *                 type: string
 *                 description: New password for the mentor.
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password for the mentor.
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (current password incorrect or new passwords don't match)
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
 *                 error:
 *                   type: string
 */

router.post ("/change-password", async (req, res) => {
    try {
        const {password, mentorId} = req.body;
        const mentor = await Mentors.findById (mentorId);

        if (! mentor) {
            return res.status (404).send ({message: "Mentor not found"});
        }

        const isPasswordCorrect = await bcrypt.compare (password, mentor.password);

        // Compare Passwords
        if (! isPasswordCorrect) {
            return res.status (400).send ({message: "Current password is incorrect"});
        }

        // Check Confirm Password
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status (400).send ({message: "New password and confirm password do not match"});
        }

        const salt = await bcrypt.genSalt (Number (process.env.SALT));
        mentor.password = await bcrypt.hash (req.body.newPassword, salt);
        await mentor.save ();

        res.status (200).send ({message: "Password changed successfully!"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


/**
 * @swagger
 * /mentor/schedules/{mentorId}:
 *   get:
 *     summary: Get schedules for a mentor
 *     description: Retrieves the schedules associated with the specified mentor ID.
 *     tags:
 *       - Mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to retrieve schedules for.
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Mentor not found
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
 *
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         slots:
 *           type: number
 *         dateAdded:
 *           type: string
 *           format: date-time
 *         userId:
 *           $ref: '#/components/schemas/User'
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstname:
 *           type: string
 *         lastname:
 *           type: string
 *         profilePhoto:
 *           type: string
 *         personal:
 *           type: object
 */


router.get ('/schedules/:mentorId', async (req, res) => {
    try {
        const mentorId = req.params.mentorId;

        const schedules = await Schedule.find ({mentorId}).populate ("userId", "firstname lastname profilePhoto personal").populate ("session", "date startTime endTime slots");
        res.status (200).json ({schedules});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred'});
    }
});


router.get ('/schedule/:id', async (req, res) => {
    try {
        const {id} = req.params;

        // Find the schedule by ID
        const schedule = await Schedule.findById (id).populate ("userId", "firstname lastname profilePhoto personal").populate ("session", "date startTime endTime slots");
        if (! schedule) {
            return res.status (404).json ({error: 'Schedule not found'});
        }

        res.status (200).json ({schedule});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Internal Server Error'});
    }
});


/**
 * @swagger
 * /mentor/add-session/{mentorId}:
 *   post:
 *     summary: Add a session for a mentor
 *     description: Adds a session for the specified mentor.
 *     tags:
 *       - Mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to add a session for.
 *       - in: body
 *         name: sessionData
 *         description: Session data
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/SessionData'
 *     responses:
 *       200:
 *         description: Session added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mentor:
 *                   $ref: '#/components/schemas/Mentor'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Mentor not found
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
 *
 * components:
 *   schemas:
 *     SessionData:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         slots:
 *           type: number
 *     Mentor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullname:
 *           type: string
 *         sessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Session'
 *     Session:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         slots:
 *           type: number
 *         dateAdded:
 *           type: string
 *           format: date-time
 */


router.post ('/add-session/:mentorId', async (req, res) => {
    try {
        const {mentorId} = req.params;
        const {date, startTime, endTime, slots} = req.body;

        // Find the mentor by mentorId
        const mentor = await Mentors.findById (mentorId).select ('-password -token').populate ('faculty').populate ({
            path: 'sessions',
            model: 'MentorSessions',
            populate: {
                path: 'mentor',
                model: 'Mentors'
            }
        }).populate ('rating.user', 'firstname lastname profilePhoto');

        if (! mentor) {
            return res.status (404).json ({error: 'Mentor not found'});
        }

        // Check if the session date is in the future
        const currentDate = new Date ();
        const sessionDate = new Date (date);

        if (sessionDate < currentDate) {
            return res.status (400).json ({error: 'Cannot choose backward dates'});
        }

        // Check for duplicate session
        const isDuplicateSession = mentor.sessions.some ( (session) => session.date.toString () === date && session.startTime === startTime && session.endTime === endTime);

        if (isDuplicateSession) {
            return res.status (400).json ({error: 'Session with the same date, start time, and end time already exists'});
        }

        // Check if the start time is before the end time
        const startTimeMs = new Date (startTime).getTime ();
        const endTimeMs = new Date (endTime).getTime ();

        if (startTimeMs >= endTimeMs) {
            return res.status (400).json ({error: 'Start time must be before the end time'});
        }

        // Create a new session object
        const newSession = {
            mentor: mentor._id,
            date: new Date (date),
            startTime,
            endTime,
            slots,
            dateAdded: new Date ()
        };

        // Create a new mentor session
        const mentorSession = new MentorSessions (newSession);

        // Save the new mentor session
        const savedMentorSession = await mentorSession.save ();

        // Add the session to the sessions array of the mentor
        mentor.sessions.push (savedMentorSession._id);

        // Save the updated mentor document
        mentor.save ();
        const updatedMentor = await Mentors.findById (mentorId).populate ('faculty').populate ({
            path: 'sessions',
            model: 'MentorSessions',
            populate: {
                path: 'mentor',
                model: 'Mentors'
            }
        }).populate ('rating.user', 'firstname lastname profilePhoto');

        res.status (200).json ({message: 'Session added successfully', mentor: updatedMentor});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Internal Server Error'});
    }
});

/**
 * @swagger
 * /mentor/delete-session/{mentorId}/{sessionId}:
 *   delete:
 *     summary: Delete a session for a mentor
 *     description: Deletes a session for the specified mentor.
 *     tags:
 *       - Mentor
 *     parameters:
 *       - in: path
 *         name: mentorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the mentor to delete a session from.
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the session to delete.
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mentor:
 *                   $ref: '#/components/schemas/Mentor'
 *       404:
 *         description: Mentor or session not found
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
 *
 * components:
 *   schemas:
 *     Mentor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullname:
 *           type: string
 *         sessions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Session'
 *     Session:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           format: time
 *         endTime:
 *           type: string
 *           format: time
 *         slots:
 *           type: number
 *         dateAdded:
 *           type: string
 *           format: date-time
 */

router.delete ('/delete-session/:mentorId/:sessionId', async (req, res) => {
    try {
        const {mentorId, sessionId} = req.params;

        // Find the mentor by mentorId
        const mentor = await Mentors.findById (mentorId).select ('-password -token');

        if (! mentor) {
            return res.status (404).json ({error: 'Mentor not found'});
        }

        // Find the session by sessionId
        const sessionIndex = mentor.sessions.findIndex ( (session) => session.toString () === sessionId);

        if (sessionIndex === -1) {
            return res.status (404).json ({error: 'Session not found'});
        }

        // Remove the session from the sessions array
        mentor.sessions.splice (sessionIndex, 1);

        // Save the updated mentor document
        await mentor.save ();

        // Populate the mentor with the updated sessions
        const updatedMentor = await Mentors.findById (mentorId).populate ('faculty').populate ({
            path: 'sessions',
            model: 'MentorSessions',
            populate: {
                path: 'mentor',
                model: 'Mentors'
            }
        }).populate ('rating.user', 'firstname lastname profilePhoto');

        res.status (200).json ({message: 'Session deleted successfully', mentor: updatedMentor});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'Internal Server Error'});
    }
});

module.exports = router;
