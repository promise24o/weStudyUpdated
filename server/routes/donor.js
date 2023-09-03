const router = require("express").Router();
const multer = require("multer");
const { DonorApplication, Donors, DonorNotification, RaiseApplication, RaiseCategory } = require("../models/Donors");
const B2 = require('backblaze-b2');



// Create a multer storage engine
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});


// Backblazer Authentication 
const applicationKeyId = process.env.BACKBLAZE_APP_KEY_ID;
const applicationKey = process.env.BACKBLAZE_APP_KEY;

const b2 = new B2({
    applicationKeyId: applicationKeyId,
    applicationKey: applicationKey
});


// Initialize Route 
router.get("/", function (_req, res) {
    res.send("Donor API");
});


/**
 * @swagger
 * /become-donor/{donorId}:
 *   post:
 *     summary: Submit or update a donor application
 *     description: Submits or updates a donor application for the specified donor.
 *     tags:
 *       - Donor
 *     parameters:
 *       - in: path
 *         name: donorId
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

router.post('/become-donor/:donorId', upload.single('file'), async (req, res) => {
    const donorId = req.params.donorId;

    try {
      
        const existingDonor = await Donors.findById(donorId);
        if (!existingDonor) {
            return res.status(404).json({ error: 'Donor not found' });
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
        const existingApplication = await DonorApplication.findOne({ user: donorId });

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
            user: donorId,
            applicationSource: 'Donors',
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

            //update the donor account data
            existingDonor.status = "Application Submitted";
            existingDonor.save();

            const donor = await Donors.findById(donorId)
                .select("-password -token")
                .populate("rating.user", "firstname lastname profilePhoto");

            res.status(200).json({
                message: "Donor application updated successfully!",
                donor: donor,
            });
        } else {
            // Create a new donor application
            const newDonorApplication = new DonorApplication(donorApplicationData);
            const savedDonorApplication = await newDonorApplication.save();


            //update the donor account data
            existingDonor.status = "Application Submitted";
            existingDonor.save();

            const donor = await Donors.findById(donorId)
                .select("-password -token")
                .populate("rating.user", "firstname lastname profilePhoto");


            res.status(201).json({
                message: "Donor application submitted successfully!",
                donor: donor, 
            });
        }

    } catch (error) {
        res.status(500).json({
            error: "An error occurred while processing the donor application.",
        });
    }
});


/**
 * @swagger
 * /raise/notifications/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     description: Retrieves notifications for the specified user.
 *     tags:
 *       - Donor
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


router.get('/raise/fetch-approved-raise', async (req, res) => {
    try {
        const raise = await RaiseApplication.find({ status: "Funding"}).populate("user").populate("category").sort({ updatedAt: -1 });

        if (!raise) {
            return res.status(404).json({ message: 'No Raise found' });
        }

        res.status(200).json({ campaigns: raise });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching approved raises' });
    }
});

/**
 * @swagger
 * /donor/raise/get-user-applications/{userId}:
 *   get:
 *     summary: Get all raise applications of a user
 *     description: Retrieves all raise applications submitted by the specified user.
 *     tags:
 *       - Donor
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
 * /donor/raise/campaign/{id}:
 *   get:
 *     summary: Get a specific raise application
 *     description: Retrieves a specific raise application by its ID.
 *     tags:
 *       - Donor
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
router.get('/raise/campaign/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const raiseApplication = await RaiseApplication.findById(id).populate("user").populate("category").sort({ updatedAt: -1 });
        res.status(200).json({ raiseApplication });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while fetching raise applications.' });
    }
});

module.exports = router;
