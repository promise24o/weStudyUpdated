const MentorApplicationWithMentor = require ("../models/MentorApplicationWithMentor");


const {Mentors} = require("../models/Mentors");

const router = require ("express").Router ();

router.get ("/", function (req, res) {
    res.send ("Mentor API");
});


/**
 * @swagger
 * /mentor/remove-course/{courseId}:
 *   delete:
 *     summary: Remove course based on the course ID
 *     description: Removes a course from the GPA document based on the given course ID.
 *     tags:
 *       - Mentor
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

router.post ('/become-mentor/:mentorId', (req, res) => {
    const mentorId = req.params.mentorId;

    // Check if the mentor exists
    Mentors.findById (mentorId).then ( (mentor) => {
        if (!mentor) {
            return res.status (404).json ({error: 'Mentor not found'});
        }

        mentor.status = 'Application Submitted';
        // Update the mentor's status

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

        // Check if required fields are empty
        if (!skills || !faculty || !briefDescription || !mentorshipReason) {
            return res.status (400).json ({error: 'Please fill in all required fields.'});
        }

        // Create a new mentor application instance
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

        // Save the mentor application to the database
        mentorApplication.save ().then ( () => { // Save the updated mentor status
            mentor.save ().then ( () => {
                res.status (200).json ({mentor, message: 'Mentor application submitted successfully'});
            }).catch ( (error) => {
                console.error (error);
                res.status (500).json ({error: 'Failed to update mentor status'});
            });
        }).catch ( (error) => {
            console.error (error);
            res.status (500).json ({error: 'Failed to submit mentor application'});
        });
    }).catch ( (error) => {
        console.error (error);
        res.status (500).json ({error: 'Failed to check mentor existence'});
    });
});




module.exports = router;
