const router = require('express').Router();
const { ScholarshipCategory, Scholarship } = require('../models/Scholarships');
const { CourseCategory, Course } = require("../models/Courses");
const { CommunityCategory, CommunityCenter } = require("../models/CommunityCenter");



router.get('/', function(req, res) {
    res.send("Public API");
});

router.get('/scholarships', async(req, res) => {
    try { // check if user exists
        let scholarships = await Scholarship.find().sort({ createdAt: 'desc' });
        if (!scholarships) {
            return res.status(400).send({ message: 'No Scholarship Found' });
        }
        res.status(200).send({ scholarships: scholarships });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/courses', async(req, res) => {
    try { // check if user exists
        let courses = await Course.find().sort({ createdAt: 'desc' });
        if (!courses) {
            return res.status(400).send({ message: 'No Courses Found' });
        }
        res.status(200).send({ courses: courses });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/scholarship/:slug', async(req, res) => {
    try {
        const scholarship = await Scholarship.findOne({ slug: req.params.slug });
        if (!scholarship) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json({ scholarship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/course/:slug', async(req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/community-center/:slug', async(req, res) => {
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

router.get('/related-scholarships/:category/:id', async(req, res) => {
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


router.get('/related-courses/:category/:id', async(req, res) => {
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


router.get("/category/:id", async(req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await ScholarshipCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/course-category/:id", async(req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CourseCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/community-categories", async(req, res) => {
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

router.get("/community-posts", async(req, res) => {
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

router.get("/community-category/:id", async(req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CommunityCategory.findOne({ _id: categoryId });
        const categoryName = category ? category.title : null;
        res.status(200).json({ categoryName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;