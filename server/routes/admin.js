const router = require ("express").Router ();
const {auth2} = require ("../middleware/auth");
const cloudinary = require ("cloudinary").v2;
const {CloudinaryStorage} = require ("multer-storage-cloudinary");
const multer = require ("multer");


// Models
const {User} = require ("../models/Users");
const {ScholarshipCategory, Scholarship} = require ("../models/Scholarships");
const {CourseCategory, Course} = require ("../models/Courses");
const {MentorFaculty, Mentors} = require ("../models/Mentors");
const {CommunityCategory, CommunityCenter} = require ("../models/CommunityCenter");
const Advert = require ("../models/Adverts");
const gpaSchema = require ("../models/Gpa");
const Notification = require ("../models/Notifications");

const Admin = require ("../models/Admin");
const Institutions = require ("../models/Institutions");
const MentorApplication = require ("../models/MentorApplication");
const MentorApplicationWithMentor = require ("../models/MentorApplicationWithMentor");
const VerificationBadge = require ("../models/VerificationBadge");

// Configure Cloudinary credentials
cloudinary.config({ cloud_name: process.env.CLOUD_NAME, api_key: process.env.CLOUD_API, api_secret: process.env.CLOUD_SECRET});

// Configure Multer to use Cloudinary as the storage engine
const storage = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/scholarships",
        format: async () => "png",
        public_id: () => `scholarship-${
            Date.now ()
        }`
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

// Configure Multer to use Cloudinary as the storage engine
const storage2 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/mentors",
        format: async () => "png",
        public_id: () => `mentors-${
            Date.now ()
        }`
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage4 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/community-categories",
        format: async () => "png",
        public_id: () => `categories-${
            Date.now ()
        }`
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage5 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/community-center",
        format: async () => "png",
        public_id: () => `community-${
            Date.now ()
        }`
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage6 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/adverts",
        format: async () => "png",
        public_id: () => `adverts-${
            Date.now ()
        }`
    }
});
// Configure Multer to use Cloudinary as the storage engine

// Create a multer instance with the storage engine and limits (if necessary)
const upload4 = multer ({
    storage: storage4,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload2 = multer ({
    storage: storage2,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});

// Configure Multer to use Cloudinary as the storage engine
const storage3 = new CloudinaryStorage ({
    cloudinary: cloudinary,
    params: {
        folder: "/courses",
        format: async () => "png",
        public_id: () => `courses-${
            Date.now ()
        }`
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload3 = multer ({
    storage: storage3,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload5 = multer ({
    storage: storage5,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const upload6 = multer ({
    storage: storage6,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});

// Create a multer instance with the storage engine and limits (if necessary)
const uploadVerification = multer ({
    storage: storage6,
    limits: {
        fileSize: 800 * 800 * 5,
        fieldSize: 1024 * 1024 * 5, // 5MB field size limit (adjust as needed)
    },
    // Resize the uploaded image to 800x800
    resize: {
        width: 800,
        height: 800
    }
});


router.get ("/", function (req, res) {
    res.send ("Admin Routes");
});

router.get ("/users-list", auth2, async (req, res) => {
    try { // check if user exists
        let users = await User.find ().sort ({createdAt: "desc"}).populate("verification");
        if (! users) {
            return res.status (400).send ({message: "No Users Found"});
        }
        res.status (200).send ({users: users});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


router.get ("/campus-ambassadors", auth2, async (req, res) => {
    try { // Select users with verification.title equal to "Campus Ambassador"
        let users = await User.find ().populate ({
            path: "verification",
            match: {
                title: "Campus Ambassador"
            }
        });

        if (! users || users.length === 0) {
            return res.status (400).send ({message: "No Campus Ambassadors Found"});
        }

        // Filter out users with empty verification (users without "Campus Ambassador" title)
        users = users.filter ( (user) => user.verification !== null);

        res.status (200).send ({users: users});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});



router.get ("/schedules-list", auth2, async (req, res) => {
    try { // check if scheuldes exists
        let schedules = await User.find ().sort ({createdAt: "desc"});
        if (! schedules) {
            return res.status (400).send ({message: "No Schedules Found"});
        }
        res.status (200).send ({schedules: schedules});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/institutions-list", auth2, async (req, res) => {
    try { // check if user exists
        let institutions = await Institutions.find ().sort ({createdAt: "desc"});
        if (! institutions) {
            return res.status (400).send ({message: "No Institution Found"});
        }
        res.status (200).send ({institutions: institutions});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/institutions/:id", async (req, res) => {
    const institutionId = req.params.id;
    try {
        let institution = await Institutions.findOne ({_id: institutionId});
        res.status (201).send ({institution: institution});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


router.get ("/users-list", auth2, async (req, res) => {
    try { // check if user exists
        let users = await User.find ().sort ({createdAt: "desc"});
        if (! users) {
            return res.status (400).send ({message: "No Users Found"});
        }
        res.status (200).send ({users: users});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/scholarship-categories", auth2, async (req, res) => {
    try { // check if user exists
        let scholarshipCategories = await ScholarshipCategory.find ().sort ({createdAt: "desc"});
        if (! scholarshipCategories) {
            return res.status (400).send ({message: "No Scholarship Categories Found"});
        }
        res.status (200).send ({categories: scholarshipCategories});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/course-categories", auth2, async (req, res) => {
    try { // check if user exists
        let courseCategories = await CourseCategory.find ().sort ({createdAt: "desc"});
        if (! courseCategories) {
            return res.status (400).send ({message: "No Course Categories Found"});
        }
        res.status (200).send ({categories: courseCategories});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/community-categories", auth2, async (req, res) => {
    try { // check if user exists
        let communityCategories = await CommunityCategory.find ().sort ({createdAt: "desc"});
        if (! communityCategories) {
            return res.status (400).send ({message: "No Categories Found"});
        }
        res.status (200).send ({categories: communityCategories});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/scholarships", auth2, async (req, res) => {
    try { // check if user exists
        let scholarships = await Scholarship.find ().populate ('category').sort ({createdAt: "desc"});
        if (! scholarships) {
            return res.status (400).send ({message: "No Scholarship Found"});
        }
        res.status (200).send ({scholarships: scholarships});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/scholarship/:id", async (req, res) => {
    const scholarshipId = req.params.id;
    try { // check if user exists
        let scholarship = await Scholarship.findOne ({_id: scholarshipId});
        if (! scholarship) {
            return res.status (400).send ({message: "No Scholarship Found"});
        }
        res.status (200).json ({scholarship});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/courses", auth2, async (req, res) => {
    try { // check if user exists
        let courses = await Course.find ().populate ('category').sort ({createdAt: "desc"});
        if (! courses) {
            return res.status (400).send ({message: "No Courses Found"});
        }
        res.status (200).send ({courses: courses});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


router.get ("/course/:id", async (req, res) => {
    const courseId = req.params.id;
    try { // check if user exists
        let course = await Course.findOne ({_id: courseId});
        if (! course) {
            return res.status (400).send ({message: "No Course Found"});
        }
        res.status (200).json ({course});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/cc-posts", auth2, async (req, res) => {
    try { // check if user exists
        let posts = await CommunityCenter.find ().sort ({createdAt: "desc"});
        if (! posts) {
            return res.status (400).send ({message: "No Posts Found"});
        }
        res.status (200).send ({posts: posts});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/get-admin", auth2, async (req, res) => {
    const {id} = req.query;
    try { // check if admin exists
        let admin = await Admin.findById (id);
        if (! admin) {
            return res.status (400).send ({message: "No Admin Found"});
        }
        res.status (200).send ({admin: admin});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.post ("/add-scholarship-category", auth2, async (req, res) => {
    const {title, adminId} = req.body;
    try {
        await new ScholarshipCategory ({title, createdBy: adminId}).save ();

        const categories = await ScholarshipCategory.find ({});

        res.status (201).send ({categories, message: "Category Added Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.post ("/add-course-category", auth2, async (req, res) => {
    const {title, adminId} = req.body;
    try {
        await new CourseCategory ({title, createdBy: adminId}).save ();
        const categories = await CourseCategory.find ({});
        res.status (201).send ({categories, message: "Category Added Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.post ("/add-faculty", auth2, async (req, res) => {
    const {title, adminId} = req.body;
    try {
        await new MentorFaculty ({title, createdBy: adminId}).save ();

        const faculties = await MentorFaculty.find ({});

        res.status (201).send ({faculties, message: "Faculty Added Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/faculties", auth2, async (req, res) => {
    try { // check if user exists
        let faculties = await MentorFaculty.find ().sort ({createdAt: "desc"});
        if (! faculties) {
            return res.status (400).send ({message: "No Faculty Found"});
        }
        res.status (200).send ({faculties: faculties});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.get ("/mentors", auth2, async (req, res) => {
    try {
        let mentors = await Mentors.find ({status: "Approved"}).populate ("faculty").sort ({createdAt: "desc"});

        if (mentors.length === 0) {
            return res.status (400).send ({message: "No Approved Mentors Found"});
        }

        res.status (200).send ({mentors: mentors});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


router.put ("/update-school-summary/:id", async (req, res) => {
    try {
        const institutionId = req.params.id;
        const {editorContent} = req.body;

        const institution = await Institutions.findById (institutionId);
        if (! institution) {
            return res.status (404).json ({error: 'Institution not found'});
        }

        institution.summary = editorContent;

        res.status (201).send ({message: "School Summary Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.put ("/update-institution/:id", async (req, res) => {
    try {
        const institutionId = req.params.id;
        const institutionUpdates = req.body;
        const updatedInstitution = await Institutions.findByIdAndUpdate (institutionId, institutionUpdates, {new: true});
        res.status (201).send ({institutions: updatedInstitution, message: "Institution Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.put ("/update-category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryUpdates = req.body;
        await ScholarshipCategory.findByIdAndUpdate (categoryId, categoryUpdates, {new: true});
        const categories = await ScholarshipCategory.find ().sort ({createdAt: -1});
        res.status (201).send ({categories: categories, message: "Institution Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.put ("/update-faculty/:id", async (req, res) => {
    try {
        const facultyId = req.params.id;
        const facultyUpdates = req.body;
        await MentorFaculty.findByIdAndUpdate (facultyId, facultyUpdates, {new: true});
        const faculties = await MentorFaculty.find ().sort ({createdAt: -1});
        res.status (201).send ({faculties: faculties, message: "Faculty Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.put ("/update-mentor/:id", upload2.single ("file"), async (req, res) => {
    try {
        const mentorId = req.params.id;
        const updatedMentor = ({
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
            skills
        } = JSON.parse (req.body.data));

        if (req.file) {
            const result = await cloudinary.uploader.upload (req.file.path);
            updatedMentor = {
                ... updatedMentor,
                avatar: result.avatar
            };
        }

        const filter = {
            _id: mentorId
        };
        const options = {
            new: true
        }; // return the updated document


        res.status (201).send ({message: "Mentor Details Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.post ("/institutions-list", async (req, res) => {
    const {institution, logo, type} = req.body;
    try {
        await new Institutions ({institution, logo, type}).save ();
        res.status (201).send ({message: "Institution Added Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

// Route to add a new institution
router.post ('/add-institution', async (req, res) => { // Destructure the required fields from the request body
    const {institution, logo, type} = req.body;

    // Check if any of the required fields are missing
    if (!institution || !logo || !type) {
        return res.status (400).json ({message: 'Please provide all the required fields'});
    }

    try { // Create a new instance of the Institution model
        const newInstitution = new Institutions ({institution, logo, type});

        // Save the new institution to the database
        await newInstitution.save ();

        // Find all institutions and return them on success (status 200)
        const institutions = await Institutions.find ({}).sort ({createdAt: "desc"});
        res.status (201).send ({message: "Institution Added Successfully", institutions: institutions});

    } catch (error) {
        console.error (error);
        res.status (500).json ({message: 'Internal Server Error', error});
    }
});


router.post ("/add-scholarship", upload.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({error: "No photo uploaded"});
    }

    // Update the user's photo in the database
    const data = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);

    try { // Create a new scholarship
        const scholarship = new Scholarship ({
            title: data.title,
            banner_image: result.url,
            category: data.category,
            brief: data.brief,
            editorContent: data.editorContent,
            read_time: data.read_time,
            slug: data.slug
        });

        // Save the scholarship to the database
        await scholarship.save ();

        // Send a response with the saved scholarship
        res.status (201).send ({scholarship: scholarship, message: "Scholarship Created Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});

router.put ("/update-scholarship/:id", upload.single ("file"), async (req, res) => {
    try {
        const scholarshipId = req.params.id;
        const updatedScholarship = ({
            title,
            banner_image,
            category,
            brief,
            editorContent,
            read_time,
            slug
        } = JSON.parse (req.body.data));

        if (req.file) {
            const result = await cloudinary.uploader.upload (req.file.path);
            updatedMentor = {
                ...updatedMentor,
                avatar: result.avatar
            };
        }

        const filter = {
            _id: scholarshipId
        };
        const options = {
            new: true
        }; // return the updated document


        res.status (201).send ({message: "Scholarship Details Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.post ("/advert", upload6.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({error: "No photo uploaded"});
    }

    const data = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);

    try { // Create a new scholarship
        const advert = new Advert ({link: data.link, status: data.status, banner_image: result.url});

        // Save the scholarship to the database
        await advert.save ();

        const advertList = await Advert.find ({}).sort ({createdAt: "desc"});

        res.status (201).send ({adverts: advertList, message: "Advert Created Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});

router.get ("/adverts", async (req, res) => {
    try { // check if ads exists
        let ads = await Advert.find ().sort ({createdAt: "desc"});
        if (! ads) {
            return res.status (400).send ({message: "No Adverts Found"});
        }
        res.status (200).send ({adverts: ads});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});

router.put ("/advert/:adsId", upload5.single ("file"), async (req, res) => {
    const {adsId} = req.params;
    const data = JSON.parse (req.body.data);

    try {
        let updatedAdvert = {
            link: data.link,
            status: data.status
        };

        // Check if a file was uploaded
        if (req.file) {
            const result = await cloudinary.uploader.upload (req.file.path);
            updatedAdvert.banner_image = result.url;
        }

        // Update the Ads in the database
        const filter = {
            _id: adsId
        };

        const options = {
            new: true
        };
        await Advert.findByIdAndUpdate (filter, updatedAdvert, options);
        const advertList = await Advert.find ({}).sort ({createdAt: "desc"});

        res.status (200).send ({adverts: advertList, message: "Advert Updated Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }

});

router.delete ("/advert/:adsId", async (req, res) => {
    const {adsId} = req.params;

    try {
        const ads = await Advert.findOneAndDelete ({_id: adsId});
        if (! ads) {
            return res.status (404).send ({message: "Advert not found"});
        }
        const advertList = await Advert.find ();
        res.send ({message: "Advert Deleted Successfully", adverts: advertList});
    } catch (error) {
        console.error (error);
        res.status (500).send ({message: "Server error"});
    }
});


router.post ("/add-community-category", upload4.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({error: "No photo uploaded"});
    }

    // Update the user's photo in the database
    const data = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);
    console.log (result);
    try { // Create a new category
        const category = new CommunityCategory ({title: data.title, banner_image: result.url});
        // Save the scholarship to the database
        await category.save ();
        // Send a response with the saved category
        const categories = await CommunityCategory.find ({}).sort ({createdAt: "desc"});
        res.status (201).send ({categories: categories, message: "Category Created Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});


router.post ("/add-course", upload3.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({error: "No photo uploaded"});
    }

    // Update the user's photo in the database
    const data = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);

    try { // Create a new Course
        const course = new Course ({
            title: data.title,
            banner_image: result.url,
            category: data.category,
            brief: data.brief,
            editorContent: data.editorContent,
            read_time: data.read_time,
            slug: data.slug,
            lessons: data.lessons,
            students: data.students
        });

        // Save the Course to the database
        await course.save ();

        // Send a response with the saved course
        res.status (201).send ({course: course, message: "Course Created Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});


router.put ("/update-course/:id", upload3.single ("file"), async (req, res) => {
    try {
        const courseId = req.params.id;
        const updatedCourse = JSON.parse (req.body.data);
        let updatedCourseWithImage = {
            ... updatedCourse
        };

        if (req.file) {
            const result = await cloudinary.uploader.upload (req.file.path);
            updatedCourseWithImage.banner_image = result.url;
        }

        const filter = {
            _id: courseId
        };
        const options = {
            new: true
        }; // return the updated document


        res.status (201).send ({message: "Course Details Updated Successfully"});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});


router.delete ("/course/:courseId", async (req, res) => {
    const {courseId} = req.params;

    try {
        const courses = await Course.findOneAndDelete ({_id: courseId});
        if (! courses) {
            return res.status (404).send ({message: "Course not found"});
        }
        const courseList = await Course.find ().sort ({createdAt: "desc"});
        res.send ({message: "Course Deleted Successfully", courses: courseList});
    } catch (error) {
        console.error (error);
        res.status (500).send ({message: "Server error"});
    }
});


router.post ("/add-community-center-post", upload5.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({message: "No photo uploaded"});
    }

    // Update the user's photo in the database
    const data = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);

    try { // Create a new Community Center Post
        const post = new CommunityCenter ({
            title: data.title,
            banner_image: result.url,
            category: data.category,
            brief: data.brief,
            editorContent: data.editorContent,
            read_time: data.read_time,
            slug: data.slug
        });

        // Save the Post to the database
        await post.save ();

        // Send a response with the saved course
        res.status (201).send ({message: "Post Created Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});

router.put ("/update-community-center-post/:id", upload5.single ("file"), async (req, res) => {
    try {
        const postId = req.params.id;
        const data = JSON.parse (req.body.data);

        let updatedPost = {
            title: data.title,
            category: data.category,
            brief: data.brief,
            editorContent: data.editorContent,
            read_time: data.read_time,
            slug: data.slug
        };

        // Check if a file was uploaded
        if (req.file) {
            const result = await cloudinary.uploader.upload (req.file.path);
            updatedPost.banner_image = result.url;
        }

        // Update the post in the database
        const filter = {
            _id: postId
        };
        const options = {
            new: true
        };

        res.status (200).send ({message: "Post Updated Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});


router.post ("/add-mentor", upload2.single ("file"), async (req, res) => {
    if (!req.file) {
        return res.status (400).json ({error: "No photo uploaded"});
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
        googleMeet,
        skills
    } = JSON.parse (req.body.data);

    // Upload the banner_image to cloudinary
    const result = await cloudinary.uploader.upload (req.file.path);

    try { // Create a new mentor
        const mentor = new Mentors ({
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
            googleMeet,
            skills,
            avatar: result.url
        });

        // Save the scholarship to the database
        await mentor.save ();

        // Send a response with the saved scholarship
        res.status (201).send ({message: "Mentor Added Successfully"});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error});
    }
});

router.get ("/scholarship-count/:categoryId", async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        const count = await Scholarship.countDocuments ({category: categoryId});
        res.status (200).json ({count});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: err.message});
    }
});

router.get ("/course-count/:categoryId", async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        const count = await Course.countDocuments ({category: categoryId});
        res.status (200).json ({count});
    } catch (err) {
        console.error (err);
        res.status (500).json ({message: err.message});
    }
});

router.get ("/category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await ScholarshipCategory.findOne ({_id: categoryId});
        const categoryName = category ? category.title : null;
        res.status (200).json ({categoryName});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/course-category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CourseCategory.findOne ({_id: categoryId});
        const categoryName = category ? category.title : null;
        res.status (200).json ({categoryName});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/cc-category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await CommunityCategory.findOne ({_id: categoryId});
        const categoryName = category ? category.title : null;
        res.status (200).json ({categoryName});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/faculty/:id", async (req, res) => {
    try {
        const facultyId = req.params.id;
        const faculty = await MentorFaculty.findOne ({_id: facultyId});
        const facultyName = faculty ? faculty.title : null;
        res.status (200).json ({facultyName});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/mentor/:id", async (req, res) => {
    try {
        const mentorId = req.params.id;
        const mentor = await Mentors.findOne ({_id: mentorId}).populate ("faculty");
        res.status (200).json ({mentor});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/user/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne ({_id: userId}).populate ("verification");
        res.status (200).json ({user});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/mentors-applications", async (req, res) => {
    try {
        const mentorApplications = await MentorApplication.find ().populate ("userId", "firstname lastname profilePhoto").populate ("faculty");

        const mentorApplications2 = await MentorApplicationWithMentor.find ().populate ("mentorId", "fullname avatar").populate ("faculty");

        res.status (200).json ({mentors: mentorApplications, mentors2: mentorApplications2});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

router.get ("/mentor-application/:id", async (req, res) => {
    try {
        const applicationId = req.params.id;

        let mentorApplication = await MentorApplication.findOne ({_id: applicationId}).populate ("userId", "firstname lastname profilePhoto education createdAt").populate ("faculty");

        let userType = "student";

        if (! mentorApplication) {
            mentorApplication = await MentorApplicationWithMentor.findOne ({_id: applicationId}).populate ("mentorId", "fullname avatar").populate ("faculty");

            userType = "mentor";
        }

        const mentor = mentorApplication;

        res.status (200).json ({mentor, userType});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});


router.put ('/update-application-status/:id', async (req, res) => {
    const id = req.params.id;
    const {status, adminId} = req.body;

    try {
        let mentorApplication = await MentorApplication.findById (id);

        if (! mentorApplication) {
            mentorApplication = await MentorApplicationWithMentor.findById (id);
            if (! mentorApplication) {
                return res.status (404).json ({error: 'Mentor application not found'});
            }
        }

        mentorApplication.status = status;
        mentorApplication.lastUpdated.push ({admin: adminId, action: `Status updated to ${status}`, dateUpdated: new Date ()});


        if (mentorApplication instanceof MentorApplication) {
            const user = await User.findOne ({_id: mentorApplication.userId});

            if (! user) {
                return res.status (404).json ({error: 'User not found'});
            }

            if (status === 'Approved') {
                user.isMentor = true;
                user.isMentorStatus = 'Approved';
            } else {
                user.isMentor = false;
                user.isMentorStatus = status;
            }

            await user.save ();
        } else if (mentorApplication instanceof MentorApplicationWithMentor) {
            const mentor = await Mentors.findOne ({_id: mentorApplication.mentorId});

            if (! mentor) {
                return res.status (404).json ({error: 'Mentor not found'});
            }
            if (status === 'Approved') {
                mentor.bio = mentorApplication.about;
                mentor.skills = mentorApplication.skills;
                mentor.linkedin = mentorApplication.linkedin;
                mentor.facebook = mentorApplication.facebook;
                mentor.twitter = mentorApplication.twitterHandle;
                mentor.googleMeet = mentorApplication.googleMeet;
                mentor.faculty = mentorApplication.faculty;
            }
            mentor.status = status;

            await mentor.save ();
        }

        let application = null;
        if (mentorApplication instanceof MentorApplication) {
            application = await MentorApplication.findOne ({_id: id}).populate ('userId', 'firstname lastname profilePhoto education createdAt').populate ('faculty');
        } else if (mentorApplication instanceof MentorApplicationWithMentor) {
            application = await MentorApplicationWithMentor.findOne ({_id: id}).populate ('mentorId', 'fullname avatar').populate ('faculty');
        }

        // Send notification to the user
        const notificationMessage = `The status of your mentor application has been changed to <strong>${status}</strong>`;
        const notification = new Notification ({recipient: mentorApplication.userId, action: notificationMessage, isSystemNotification: true});

        await notification.save ();

        res.status (200).json ({message: `Status changed to ${status}`, mentor: application});
    } catch (error) {
        console.error (error);
        res.status (500).json ({message: error.message});
    }
});


// Get User Results Based
router.get ("/user-result/:userId/", async (req, res) => {
    try {
        let gpa = await gpaSchema.find ({userId: req.params.userId});
        if (! gpa) {
            return res.status (400).send ({message: "No GPA Found"});
        }
        res.status (200).send ({gpa: gpa});
    } catch (error) {
        res.status (500).send ({message: "Internal Server Error", error: error});
    }
});


router.get ("/cc-post/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await CommunityCenter.findOne ({_id: postId});
        res.status (200).json ({post});
    } catch (err) {
        res.status (500).json ({message: err.message});
    }
});

// Admin Delete Community Center Post
router.delete ("/remove-cc-post/:postId", async (req, res) => {
    const {postId} = req.params;
    try {
        const post = await CommunityCenter.findOneAndDelete ({_id: postId});
        if (! post) {
            return res.status (404).send ({message: "Post not found"});
        }
        // Retrieve all the posts and send them as a response
        const posts = await CommunityCenter.find ();
        res.send ({message: "Post deleted successfully", posts: posts});
    } catch (error) {
        console.error (error);
        res.status (500).send ({message: "Server error"});
    }
});

// Admin Delete Community Center Post
router.delete ("/remove-mentor/:mentorId", async (req, res) => {
    const {mentorId} = req.params;
    try {
        const mentor = await Mentors.findOneAndDelete ({_id: mentorId});
        if (! mentor) {
            return res.status (404).send ({message: "Mentor not found"});
        }
        // Retrieve all the posts and send them as a response
        const mentors = await Mentors.find ();
        res.send ({message: "Mentor Deleted Successfully", mentors: mentors});
    } catch (error) {
        console.error (error);
        res.status (500).send ({message: "Server error"});
    }
});


router.delete ('/courses/category', async (req, res) => {
    try {

        await Course.updateMany ({}, {
            $unset: {
                category: 1
            }
        });
        res.status (200).json ({message: 'All category for Courses have been deleted.'});

    } catch (error) {
        res.status (500).json ({error: 'An error occurred while deleting category for Courses.'});
    }
});


// Route to add a new VerificationBadge
router.post ("/verification/add", uploadVerification.single ("logo"), async (req, res) => {
    try {
        const {title, description} = req.body;
        const logo = req.file;
        // The file object contains the uploaded logo

        // Upload the logo to Cloudinary
        const result = await cloudinary.uploader.upload (logo.path);

        // Create a new VerificationBadge document
        const newBadge = new VerificationBadge ({
            title, description, logo: result.secure_url, // Save the Cloudinary URL in the logo property
        });

        // Save the new badge to the database
        await newBadge.save ();

        res.status (201).json ({message: "VerificationBadge added successfully"});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "An error occurred while adding the VerificationBadge"});
    }
});


// Route to edit a VerificationBadge
router.put ("/verification/edit/:id", async (req, res) => {

    try {
        const {id} = req.params;
        const {title, description, logo} = req.body;

        // Find the VerificationBadge by ID
        const badge = await VerificationBadge.findById (id);

        if (! badge) {
            return res.status (404).json ({error: "VerificationBadge not found"});
        }

        // Update the badge properties
        badge.title = title;
        badge.description = description;
        badge.logo = logo;

        // Save the updated badge to the database
        await badge.save ();

        res.json ({message: "VerificationBadge updated successfully", badge});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "An error occurred while updating the VerificationBadge"});
    }
});

// Route to delete a VerificationBadge
router.delete ("/verification/delete/:id", async (req, res) => {
    try {
        const {id} = req.params;

        // Find the VerificationBadge by ID and remove it
        const deletedBadge = await VerificationBadge.findByIdAndRemove (id);

        if (! deletedBadge) {
            return res.status (404).json ({error: "VerificationBadge not found"});
        }

        res.json ({message: "VerificationBadge deleted successfully", badge: deletedBadge});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "An error occurred while deleting the VerificationBadge"});
    }
});


// Route to get all VerificationBadges
router.get ("/verification/all", async (req, res) => {
    try { // Retrieve all verification badges from the database
        const badges = await VerificationBadge.find ();

        res.status (200).json ({badges});
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: "An error occurred while fetching the verification badges"});
    }
});


// Route to update the verification badge of a user
router.put ('/update-verification-badge/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const {badge} = req.body;

        // Check if the verification badge is empty
        if (!badge) { // If empty, delete the verification badge from the user
            await User.findByIdAndUpdate (userId, {
                $unset: {
                    verification: 1
                }
            });
            res.status (200).json ({message: 'Verification badge removed successfully'});
        } else { // If not empty, create or update the verification badge
            await User.findByIdAndUpdate (userId, {
                $set: {
                    verification: badge, 
                    dateBadgeVerified: new Date()
                }
            });
            res.status (200).json ({message: 'Verification badge updated successfully'});
        }
    } catch (error) {
        console.error (error);
        res.status (500).json ({error: 'An error occurred while updating the verification badge'});
    }
});


module.exports = router;
