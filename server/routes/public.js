const router = require('express').Router();
const { ScholarshipCategory, Scholarship } = require('../models/Scholarships');



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

router.get('/related-scholarships/:category/:id', async(req, res) => {
    try {
        const { category, id } = req.params;
        const scholarships = await Scholarship.find({
            category
        }).limit(3);
        if (!scholarships.length) {
            return res.status(404).json({ error: 'Scholarships not found' });
        }
        res.json({ scholarships });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});






module.exports = router;