const MentorApplicationWithMentor = require ("../models/MentorApplicationWithMentor");


const {Mentors} = require("../models/Mentors");

const router = require ("express").Router ();

router.get ("/", function (req, res) {
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
            twitterHandle
        } = req.body;
        console.log(skills);
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


module.exports = router;
