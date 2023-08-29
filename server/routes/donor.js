const router = require("express").Router();
const multer = require("multer");
const { DonorApplication, Donors, DonorNotification } = require("../models/Donors");
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



module.exports = router;
