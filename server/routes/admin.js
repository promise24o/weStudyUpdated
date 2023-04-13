const router = require('express').Router();
const { auth2 } = require("../middleware/auth");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');




// Models
const { User, validate } = require('../models/Users')
const { ScholarshipCategory, Scholarship } = require('../models/Scholarships');
const { MentorFaculty, Mentors } = require('../models/Mentors')
const Admin = require('../models/Admin')
const Institutions = require('../models/Institutions')



// Configure Cloudinary credentials
cloudinary.config({ cloud_name: 'dbb2dkawt', api_key: '474957451451999', api_secret: 'yWE3adlqWuUOG0l3JjqSoIPSI-Q' });

// Configure Multer to use Cloudinary as the storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: '/scholarships',
        format: async(req, file) => 'png',
        public_id: (req, file) => `scholarship-${Date.now()}`
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5 // 5MB field size limit (adjust as needed)
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage2 = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: '/mentors',
        format: async(req, file) => 'png',
        public_id: (req, file) => `mentors-${Date.now()}`
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload2 = multer({
    storage: storage2,
    limits: {
        fileSize: 1024 * 1024 * 5,
        fieldSize: 1024 * 1024 * 5 // 5MB field size limit (adjust as needed)
    }
});



router.get('/', function(req, res) {
    res.send("Admin Routes");
});

router.get('/users-list', auth2, async(req, res) => {
    try { // check if user exists
        let users = await User.find().sort({ createdAt: 'desc' });
        if (!users) {
            return res.status(400).send({ message: 'No Users Found' });
        }
        res.status(200).send({ users: users });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/institutions-list', auth2, async(req, res) => {
    try { // check if user exists
        let institutions = await Institutions.find().sort({ createdAt: 'desc' });
        if (!institutions) {
            return res.status(400).send({ message: 'No Institution Found' });
        }
        res.status(200).send({ institutions: institutions });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/users-list', auth2, async(req, res) => {
    try { // check if user exists
        let users = await User.find().sort({ createdAt: 'desc' });
        if (!users) {
            return res.status(400).send({ message: 'No Users Found' });
        }
        res.status(200).send({ users: users });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/scholarship-categories', auth2, async(req, res) => {
    try { // check if user exists
        let scholarshipCategories = await ScholarshipCategory.find().sort({ createdAt: 'desc' });
        if (!scholarshipCategories) {
            return res.status(400).send({ message: 'No Scholarship Categories Found' });
        }
        res.status(200).send({ categories: scholarshipCategories });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/scholarships', auth2, async(req, res) => {
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


router.get('/get-admin', auth2, async(req, res) => {
    const { id } = req.query;
    try { // check if admin exists
        let admin = await Admin.findById(id);
        if (!admin) {
            return res.status(400).send({ message: 'No Admin Found' });
        }
        res.status(200).send({ admin: admin });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.post("/add-scholarship-category", auth2, async(req, res) => {
    const { title, adminId } = req.body;
    try {
        await new ScholarshipCategory({ title, createdBy: adminId }).save();

        const categories = await ScholarshipCategory.find({});

        res.status(201).send({ categories, message: "Category Added Successfully" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.post("/add-faculty", auth2, async(req, res) => {
    const { title, adminId } = req.body;
    try {
        await new MentorFaculty({ title, createdBy: adminId }).save();

        const faculties = await MentorFaculty.find({});

        res.status(201).send({ faculties, message: "Faculty Added Successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get("/faculties", auth2, async(req, res) => {
    try { // check if user exists
        let faculties = await MentorFaculty.find().sort({ createdAt: 'desc' });
        if (!faculties) {
            return res.status(400).send({ message: 'No Faculty Found' });
        }
        res.status(200).send({ faculties: faculties });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get("/mentors", auth2, async(req, res) => {
    try { // check if user exists
        let mentors = await Mentors.find().sort({ createdAt: 'desc' });
        if (!mentors) {
            return res.status(400).send({ message: 'No Mentor Found' });
        }
        res.status(200).send({ mentors: mentors });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.put('/update-institution/:id', async(req, res) => {
    try {
        const institutionId = req.params.id;
        const institutionUpdates = req.body;
        const updatedInstitution = await Institutions.findByIdAndUpdate(institutionId, institutionUpdates, { new: true });
        res.status(201).send({ institutions: updatedInstitution, message: "Institution Updated Successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/update-category/:id', async(req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryUpdates = req.body;
        await ScholarshipCategory.findByIdAndUpdate(categoryId, categoryUpdates, { new: true });
        const categories = await ScholarshipCategory.find().sort({ createdAt: -1 });
        res.status(201).send({ categories: categories, message: "Institution Updated Successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/update-faculty/:id', async(req, res) => {
    try {
        const facultyId = req.params.id;
        const facultyUpdates = req.body;
        await MentorFaculty.findByIdAndUpdate(facultyId, facultyUpdates, { new: true });
        const faculties = await MentorFaculty.find().sort({ createdAt: -1 });
        res.status(201).send({ faculties: faculties, message: "Faculty Updated Successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.post("/institutions-list", async(req, res) => {
    const { institution, logo, type } = req.body;
    try {
        await new Institutions({ institution, logo, type }).save();
        res.status(201).send({ message: "Institution Added Successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.post("/add-scholarship", upload.single('file'), async(req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Update the user's photo in the database
    const data = JSON.parse(req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    try { // Create a new scholarship
        const scholarship = new Scholarship({
            title: data.title,
            banner_image: result.secure_url,
            category: data.category,
            brief: data.brief,
            editorContent: data.editorContent,
            read_time: data.read_time,
            slug: data.slug,
        });

        // Save the scholarship to the database
        await scholarship.save();

        // Send a response with the saved scholarship
        res.status(201).send({ scholarship: scholarship, message: "Scholarship Saved Successfully" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
    }
});

router.post("/add-mentor", upload2.single('file'), async(req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }

    // Update the user's photo in the database
    const {
        fullname,
        phone,
        email,
        institution,
        city,
        country,
        faculty,
        bio,
        linkedin,
        twitter,
        facebook,
        calendly
    } = JSON.parse(req.body.data);


    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    try { // Create a new mentor
        const mentor = new Mentors({
            fullname,
            phone,
            email,
            institution,
            city,
            country,
            faculty,
            bio,
            linkedin,
            twitter,
            facebook,
            calendly,
            avatar: result.secure_url
        });

        // Save the scholarship to the database
        await mentor.save();

        // Send a response with the saved scholarship
        res.status(201).send({ message: "Mentor Added Successfully" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error });
    }
});

router.get('/scholarship-count/:categoryId', async(req, res) => {
    const categoryId = req.params.categoryId;
    try {
        const count = await Scholarship.countDocuments({ category: categoryId });
        res.status(200).json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
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

router.get("/faculty/:id", async(req, res) => {
    try {
        const facultyId = req.params.id;
        const faculty = await MentorFaculty.findOne({ _id: facultyId });
        const facultyName = faculty ? faculty.title : null;
        res.status(200).json({ facultyName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



module.exports = router;