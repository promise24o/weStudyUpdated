const router = require('express').Router();
const { ScholarshipCategory, Scholarship } = require('../models/Scholarships');
const { CourseCategory, Course } = require("../models/Courses");
const { CommunityCategory, CommunityCenter } = require("../models/CommunityCenter");
const Institutions = require('../models/Institutions');
const crypto = require("crypto");
const { DonorNotification } = require('../models/Donors');
const BankCustomer = require('../models/BankCustomer');
const BankDetails = require('../models/BankDetails');
const WebhookNotification = require('../models/WebhookNotification');
const DedicatedVirtualAccount = require('../models/DedicatedVirtualAccount');
const Transactions = require('../models/Transactions');
const axios = require('axios');


router.get('/', function (req, res) {
    res.send("Public API");
});

/**
 * @swagger
 * tags:
 *   name: Scholarships
 *   description: APIs for managing scholarships
 * 
 * components:
 *   schemas:
 *     Scholarship:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6156c0e6a21e6c55f6f3c0d7
 *         title:
 *           type: string
 *           example: "Scholarship Title"
 *         banner_image:
 *           type: string
 *           example: "https://example.com/scholarship/banner.jpg"
 *         brief:
 *           type: string
 *           example: "Brief description of scholarship"
 *         category:
 *           type: string
 *           example: "Engineering"
 *         editorContent:
 *           type: string
 *           example: "<p>Content of scholarship in HTML format</p>"
 *         read_time:
 *           type: number
 *           example: 5
 *         slug:
 *           type: string
 *           example: "scholarship-title"
 *         views:
 *           type: number
 *           example: 100
 *         comments:
 *           type: number
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-01T10:20:30Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-05T16:30:15Z"
 *   responses:
 *     ScholarshipList:
 *       description: List of scholarships
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scholarships:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Scholarship'
 */

/**
 * @swagger
 * /public/scholarships:
 *   get:
 *     summary: Retrieve all scholarships
 *     tags : [Scholarships]
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             $ref: '#/components/responses/ScholarshipList'
 *       '400':
 *         description: No scholarship found
 */


router.get('/scholarships', async (req, res) => {
    try { // check if user exists
        let scholarships = await Scholarship.find().populate('category').sort({ createdAt: 'desc' });
        if (!scholarships) {
            return res.status(400).send({ message: 'No Scholarship Found' });
        }
        res.status(200).send({ scholarships: scholarships });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});


/**
 * @swagger
 * /public/scholarship/{slug}:
 *   get:
 *     summary: Retrieve a scholarship by slug
 *     tags: [Scholarships]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: slug
 *         schema:
 *           type: string
 *         required: true
 *         description: Slug of the scholarship to retrieve
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scholarship:
 *                   $ref: '#/components/schemas/Scholarship'
 *       '404':
 *         description: Scholarship not found
 *       '500':
 *         description: Server error
 */


router.get('/scholarship/:slug', async (req, res) => {
    try {
        const scholarship = await Scholarship.findOne({ slug: req.params.slug }).populate('category');
        if (!scholarship) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json({ scholarship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /public/related-scholarships/{category}/{id}:
 *   get:
 *     summary: Get related scholarships based on category and exclude specified scholarship
 *     tags: [Scholarships]
 *     parameters:
 *       - name: category
 *         in: path
 *         description: Category of the scholarship
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         description: ID of the scholarship to exclude from the results
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scholarships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Scholarship'
 *                   description: List of related scholarships
 *       '404':
 *         description: Scholarships not found
 *       '500':
 *         description: Server error
 */


router.get('/related-scholarships/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;

        const scholarships = await Scholarship.find({
            category: category,
            _id: {
                $ne: id
            }
        }).limit(3).sort({ createdAt: "desc" });

        if (!scholarships.length) {
            return res.status(404).json({ error: 'Scholarships not found' });
        }

        res.json({ scholarships });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: APIs for managing courses
 * 
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6156c0e6a21e6c55f6f3c0d7
 *         title:
 *           type: string
 *           example: "Course Title"
 *         banner_image:
 *           type: string
 *           example: "https://example.com/course/banner.jpg"
 *         brief:
 *           type: string
 *           example: "Brief description of course"
 *         category:
 *           type: string
 *           example: "Engineering"
 *         editorContent:
 *           type: string
 *           example: "<p>Content of course in HTML format</p>"
 *         read_time:
 *           type: number
 *           example: 5
 *         slug:
 *           type: string
 *           example: "course-title"
 *         views:
 *           type: number
 *           example: 100
 *         lessons:
 *           type: number
 *           example: 10
 *         students:
 *           type: number
 *           example: 50
 *         comments:
 *           type: number
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-01T10:20:30Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-05T16:30:15Z"
 *   responses:
 *     CourseList:
 *       description: List of courses
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               courses:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Course'
 */

/**
 * @swagger
 * /public/courses:
 *   get:
 *     summary: Retrieve all courses
 *     tags: [Courses]
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             $ref: '#/components/responses/CourseList'
 *       '400':
 *         description: No course found
 */


router.get('/courses', async (req, res) => {
    try { // check if user exists
        let courses = await Course.find().populate('category').sort({ createdAt: 'desc' });
        if (!courses) {
            return res.status(400).send({ message: 'No Courses Found' });
        }
        res.status(200).send({ courses: courses });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});


/**
 * @swagger
 * /public/course/{slug}:
 *   get:
 *     summary: Get a course by slug
 *     tags: [Courses]
 *     parameters:
 *       - name: slug
 *         in: path
 *         description: Slug of the course to get
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       '404':
 *         description: Course not found
 *       '500':
 *         description: Server error
 */

router.get('/course/:slug', async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug }).populate('category');
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /public/related-courses/{category}/{id}:
 *   get:
 *     summary: Get a list of related courses
 *     tags: [Courses]
 *     parameters:
 *       - name: category
 *         in: path
 *         description: The category of the course to search for related courses
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         description: The ID of the course to exclude from the related courses list
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       '404':
 *         description: No courses found for the given category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Courses not found
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


router.get('/related-courses/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;
        const courses = await Course.find({
            category: category,
            _id: {
                $ne: id
            }
        }).limit(3).sort({ createdAt: "desc" });
        if (!courses.length) {
            return res.status(404).json({ error: 'Courses not found' });
        }
        res.json({ courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /public/category/{id}:
 *   get:
 *     summary: Get Scholarship category by ID
 *     tags: [Scholarships]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the category to get
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categoryName:
 *                   type: string
 *       '500':
 *         description: Server error
 */

router.get("/category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await ScholarshipCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /public/course-category/{id}:
 *   get:
 *     summary: Get the name of a course category by ID
 *     tags: [Courses]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the course category to get the name for
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categoryName:
 *                   type: string
 *                   description: The name of the course category
 *       '404':
 *         description: Course category not found
 *       '500':
 *         description: Server error
 */

router.get("/course-category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CourseCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/**
 * @swagger
 * tags:
 *   name: Community Center
 *   description: APIs for managing community center posts
 *
 * components:
 *   schemas:
 *     CommunityCenterPost:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6156c0e6a21e6c55f6f3c0d7
 *         title:
 *           type: string
 *           example: "Post Title"
 *         banner_image:
 *           type: string
 *           example: "https://example.com/post/banner.jpg"
 *         brief:
 *           type: string
 *           example: "Brief description of post"
 *         category:
 *           type: string
 *           example: "Community"
 *         editorContent:
 *           type: string
 *           example: "<p>Content of post in HTML format</p>"
 *         read_time:
 *           type: number
 *           example: 5
 *         slug:
 *           type: string
 *           example: "post-title"
 *         views:
 *           type: number
 *           example: 100
 *         comments:
 *           type: number
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-01T10:20:30Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2022-10-05T16:30:15Z"
 * 
 *   responses:
 *     PostList:
 *       description: List of community center posts
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               posts:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CommunityCenterPost'
 * 
 * /public/community-posts:
 *   get:
 *     summary: Retrieve all community center posts
 *     tags: [Community Center]
 *     produces:
 *       - application/json
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             $ref: '#/components/responses/PostList'
 *       '400':
 *         description: No post found
 *       '500':
 *         description: Internal server error
 */


router.get("/community-posts", async (req, res) => {
    try {
        let posts = await CommunityCenter.find().sort({ createdAt: 'desc' });
        if (!posts) {
            return res.status(400).send({ message: 'No Posts Found' });
        }
        res.status(200).send({ posts: posts });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

/**
 * @swagger
 * /public/community-category/{id}:
 *   get:
 *     summary: Get the name of a community category by ID
 *     tags: [Community Center]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the community category to get the name for
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categoryName:
 *                   type: string
 *                   description: The name of the community category
 *       '404':
 *         description: Community category not found
 *       '500':
 *         description: Server error
 */


router.get("/community-category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CommunityCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @swagger
 * /public/community-categories:
 *   get:
 *     summary: Get all community categories
 *     tags: [Community Center]
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the category
 *                       title:
 *                         type: string
 *                         description: The title of the category
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time the category was created
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time the category was last updated
 *       '400':
 *         description: No categories found
 *       '500':
 *         description: Internal server error
 */

router.get("/community-categories", async (req, res) => {
    try {
        let categories = await CommunityCategory.find().sort({ createdAt: 'desc' });
        if (!categories) {
            return res.status(400).send({ message: 'No Categories Found' });
        }
        res.status(200).send({ categories: categories });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});


/**
 * @swagger
 * /public/community-center/{slug}:
 *   get:
 *     summary: Get a community center post by slug
 *     tags: [Community Center]
 *     parameters:
 *       - name: slug
 *         in: path
 *         description: The slug of the post to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: object
 *                   description: The post object
 *       '404':
 *         description: Post not found
 *       '500':
 *         description: Server error
 */

router.get('/community-center/:slug', async (req, res) => {
    try {
        const post = await CommunityCenter.findOne({ slug: req.params.slug });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


router.get('/related-cc-posts/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;

        const posts = await CommunityCenter.find({
            category: category,
            _id: {
                $ne: id
            }
        }).limit(3).sort({ createdAt: "desc" });

        if (!posts.length) {
            return res.status(404).json({ error: 'Posts not found' });
        }
        res.json({ posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get("/institutions", async (req, res) => {
    try {
        let institutions = await Institutions.find();
        res.status(201).send({ institutions: institutions });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});

router.get("/institution/:id", async (req, res) => {
    const institutionId = req.params.id;
    try {
        const institution = await Institutions.findById(institutionId);
        if (!institution) {
            return res.status(404).json({ error: 'Institution not found' });
        }
        res.status(201).send({ institution: institution });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
    }
});


router.post('/webhook/paystack', async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_LIVE;
    //validate event
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash == req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = req.body;
        if (event && event.event === 'customeridentification.failed') {


            const existingCustomer = await BankCustomer.findOne({ customerCode: event.data.customer_code });

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                user: existingCustomer.user
            });
            await webhook.save();

            // Send Notification to User 
            const notificationMessage = `Your account verification failed. Reason <strong>${event.data.reason}</strong>`;
            const notification = new DonorNotification({ recipient: existingCustomer.user, action: notificationMessage, applicationSource: "user" });
            await notification.save();
        }
        if (event && event.event === 'customeridentification.success') {

            const existingCustomer = await BankCustomer.findOne({ customerCode: event.data.customer_code });

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                user: existingCustomer.user
            });
            await webhook.save();

            //Update Bank Details 
            const bankDetails = await BankDetails.findOne({ user: existingCustomer.user });
            bankDetails.verified = true;
            bankDetails.save();

            // Send Notification to User 
            const notificationMessage = `Your account is verified successfully`;
            const notification = new DonorNotification({ recipient: existingCustomer.user, action: notificationMessage, applicationSource: "user" });
            await notification.save();
        }
        if (event && event.event === 'dedicatedaccount.assign.failed') {

            const existingCustomer = await BankCustomer.findOne({ customerCode: event.data.customer_code });

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                user: existingCustomer.user
            });
            await webhook.save();

            // Send Notification to User 
            const notificationMessage = `Unable to create Virtual Account. Please verify your bank details or contact support`;
            const notification = new DonorNotification({ recipient: existingCustomer.user, action: notificationMessage, applicationSource: "user" });
            await notification.save();
        }
        if (event && event.event === 'dedicatedaccount.assign.success') {

            const existingCustomer = await BankCustomer.findOne({ customerCode: event.data.customer_code });

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                user: existingCustomer.user
            });
            await webhook.save();

            // Create new DVA 
            const dva = new DedicatedVirtualAccount({
                user: existingCustomer.user,
                bank: event.data.dedicated_account.bank,
                account_number: event.data.dedicated_account.account_number,
                account_name: event.data.dedicated_account.account_name,
            })
            await dva.save();

            // Send Notification to User 
            const notificationMessage = `Virtual account created successfully`;
            const notification = new DonorNotification({ recipient: existingCustomer.user, action: notificationMessage, applicationSource: "user" });
            await notification.save();
        }
        if (event && event.event === 'transfer.success') {

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                reference: event.data.reference
            });
            await webhook.save();

        }
        if (event && event.event === 'charge.success') {

            //Save webhook information
            const webhook = new WebhookNotification({
                event: event.event,
                data: event.data,
                reference: event.data.reference
            });
            await webhook.save();

            const transId = event.data.id;

            const apiUrl = `https://api.paystack.co/transaction/${transId}`;

            const config = {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_LIVE}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.get(apiUrl, config);

            //Save the transaction details
            const transaction = new Transactions({
                id: event.data.id,
                data: response.data,
            });

            await transaction.save();
        }

    }
    res.sendStatus(200);
});


module.exports = router;
