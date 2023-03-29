const router = require('express').Router();
const bcrypt = require('bcrypt')

const Token = require('../models/Token')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto')

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Models
const { User, validate } = require('../models/Users')
const Activity = require('../models/Activities')
const Institutions = require('../models/Institutions')
const gpaSchema = require('../models/Gpa')

const multer = require('multer');

// Define the multer storage engine
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads'); // Change this to your desired upload directory
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
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


router.post("/", async(req, res) => {
    try {
        const { error } = validate(req.body);
        if (error)
            return res.status(400).send({ message: error.details[0].message });


        let user = await User.findOne({ email: req.body.email });
        if (user)
            return res.status(409).send({ message: "A User with that email already exists!" });


        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        user = await new User({
            ...req.body,
            password: hashPassword
        }).save();
        const token = await new Token({ userId: user._id, token: crypto.randomBytes(32).toString("hex") }).save();

        // construct the file path using the path.join() method
        const filePath = path.join(__dirname, '..', 'emails', 'verify_email.ejs');

        // read the HTML content from a file
        let template = fs.readFileSync(filePath, 'utf8');

        const urlLink = `${
            process.env.CLIENT_BASE_URL
        }/users/${
            user._id
        }/verify/${
            token.token
        }`


        // compile the EJS template with the url variable
        let html = ejs.render(template, { url: urlLink });

        await sendEmail(user.email, "Verify Email", html)

        res.status(201).send({ message: "Account Created Successfully! Visit Email to Verify Account" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/:id/verify/:token', async(req, res) => {
    try { // check if user exists
        const user = await User.findOne({ _id: req.params.id });
        if (!user)
            return res.status(404).send({ message: "Invalid Link" })

        // check if token is valid
        const token = await Token.findOne({ userId: user._id, token: req.params.token });
        if (!token)
            return res.status(404).send({ message: "Invalid Link" });

        // update user verified status
        await User.updateOne({ _id: user._id, verified: true });
        if (token) { // check if token exists
            await token.deleteOne();
        }

        res.status(200).send({ message: "Email Verified Successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.post("/resend-verify-email-link", async(req, res) => {
    try {

        let user = await User.findOne({ email: req.body.email });

        const token = await new Token({ userId: user._id, token: crypto.randomBytes(32).toString("hex") }).save();

        // construct the file path using the path.join() method
        const filePath = path.join(__dirname, '..', 'emails', 'verify_email.ejs');

        // read the HTML content from a file
        let template = fs.readFileSync(filePath, 'utf8');

        const urlLink = `${
            process.env.CLIENT_BASE_URL
        }/users/${
            user._id
        }/verify/${
            token.token
        }`

        // compile the EJS template with the url variable
        let html = ejs.render(template, { url: urlLink });

        await sendEmail(user.email, "Verify Email", html)

        res.status(201).send({ message: "Verification Email Sent Successfully" })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.get('/institutions', async(req, res) => {
    try {
        let institutions = await Institutions.find({ type: req.query.type });
        res.status(201).send({ institutions: institutions })

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
});

router.post('/update-education-info', async(req, res) => {
    try {
        const {
            type,
            institution,
            current_level,
            department,
            course_of_study,
            study_mode,
            user
        } = req.body;
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'education.institution_type': type,
                'education.institution': institution,
                'education.current_level': current_level,
                'education.department': department,
                'education.course_of_study': course_of_study,
                'education.study_mode': study_mode
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "Updated Successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/update-personal-info', async(req, res) => {
    try {
        const { city, contact_address, gender, user } = req.body;
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'personal.city': city,
                'personal.contact_address': contact_address,
                'personal.gender': gender
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "Updated Successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/change-password', async(req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });
        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

        // Compare Passwords
        if (!isPasswordCorrect) {
            return res.status(400).send({ message: 'Current password is incorrect' });
        }

        // Check Confirm Password
        if (req.body.newPassword !== req.body.confirmPassword) {
            return res.status(400).send({ message: 'New password and confirm password do not match' });
        }

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        await user.save();

        res.status(200).send({ message: "Password Change Successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/upload-avatar', upload.single('file'), async(req, res) => {

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }

        // Read the contents of the uploaded file
        const filePath = req.file.path;
        fs.readFile(filePath, async(err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Error reading photo' });
            }

            // Upload the file contents to MongoDB
            const user = JSON.parse(req.body.user);

            const updatedUser = await User.findOneAndUpdate({
                _id: user._id
            }, {
                $set: {
                    'photo.data': data,
                    'photo.contentType': req.file.mimetype
                }
            }, { new: true }).select('-password -token');
            res.status(200).send({ user: updatedUser, message: "Photo Uploaded Successfully!" });
        });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/enable-twofa', async(req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });

        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);

        // Compare Passwords
        if (!isPasswordCorrect) {
            return res.status(400).send({ message: 'Current password is incorrect' });
        }
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'twofa': true
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "2FA Enabled Successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/disable-twofa', async(req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user._id });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'twofa': false
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "2FA Disabled Successfully!" });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.post('/update-preset-parameter', async(req, res) => {
    try {
        const { preset_para } = req.body;

        const user = await User.findOne({ _id: req.body.user });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'preset_param.status': preset_para
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "Preset Parameter Updated Successfully!" });
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

// Update user preset_param status
router.patch('/:userId/presetParam', async(req, res) => {
    try {
        const userId = req.params.userId;
        const status = req.body.preset_param.status

        const user = await User.findOne({ _id: userId });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'preset_param.status': status

            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "Preset Parameter Updated Successfully!" });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update user preset_param scale
router.patch('/:userId/preset-scale', async(req, res) => {
    try {
        const userId = req.params.userId;
        const scale = req.body.preset_param.scale

        const user = await User.findOne({ _id: userId });
        const updatedUser = await User.findOneAndUpdate({
            _id: user._id
        }, {
            $set: {
                'preset_param.scale': scale
            }
        }, { new: true }).select('-password -token');

        res.status(200).send({ user: updatedUser, message: "Grading Scale Updated Successfully!" });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update user preset_param scale
router.delete('/:userId/preset_param/scale', async(req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).select('-password -token');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.preset_param.scale = undefined;
        await user.save();

        res.status(200).send({ user: user, message: "Grading Scale Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/:userId/remove-result/:resultId', async(req, res) => {

    const { userId, resultId } = req.params;
    try {
        const gpa = await gpaSchema.findOneAndDelete({ userId: userId, _id: resultId });
        if (!gpa) {
            return res.status(404).send({ message: "GPA not found" });
        }
        res.send({ message: "Result Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
    }

});

router.delete('/:userId/remove-grade/:gradeId', async(req, res) => {
    try {
        const { gradeId, userId } = req.params;
        const user = await User.findOneAndUpdate({
            _id: userId
        }, {
            $pull: {
                'preset_param.grading': {
                    _id: gradeId
                }
            }
        }, { new: true }).select('-password -token');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).send({ user: user, message: "Grade Deleted Successfully!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Post user custom grade
router.post('/:userId/add-custom-grade', async(req, res) => {
    try {
        const userId = req.params.userId;
        const { grade_symbol, grade_value } = req.body;

        const user = await User.findByIdAndUpdate(userId, {
            $push: {
                'preset_param.grading': {
                    grade_symbol,
                    grade_value
                }
            }
        }, { new: true }).select('-password -token');;

        res.status(200).send({ user: user, message: "Grade Added Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/:id/grades', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const grading = user.preset_param.grading;
        res.json(grading);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/user-activities', async(req, res) => {
    try {
        let activities = await Activity.find({ userId: req.query.user_id }).sort({ createdAt: 'desc' }).limit(10);
        if (!activities) {
            return res.status(400).send({ message: 'No Activities Found' });
        }
        res.status(200).send({ activities: activities });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})


router.post('/add-gpa', async(req, res) => {
    let gpa = null;

    try {
        const {
            code,
            title,
            grade,
            symbol,
            creditUnit,
            user,
            semester,
            level
        } = req.body;

        // Search for a document that matches the semester, level, and userId
        gpa = await gpaSchema.findOne({ semester, level, userId: user });

        if (gpa) { // If a document is found, update the courses array
            await gpaSchema.updateOne({
                _id: gpa._id
            }, {
                $push: {
                    courses: {
                        code,
                        title,
                        symbol,
                        unit: creditUnit,
                        grade
                    }
                }
            });
            gpa = await gpaSchema.findOne({ semester, level, userId: user }).sort({ createdAt: 'desc' });
            res.status(200).send({ gpa: gpa, message: "Course Updated Successfully!" });
        } else { // If a document is not found, create a new document with all information
            gpa = await gpaSchema.create({
                userId: user,
                level,
                semester,
                courses: [{
                    code,
                    title,
                    symbol,
                    unit: creditUnit,
                    grade
                }]
            });
            res.status(200).send({ gpa: gpa, message: "Course Added Successfully!" });
        }
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" })
    }

})

router.get('/user-gpa', async(req, res) => {
    try {
        let gpa = await gpaSchema.findOne({ userId: req.query.user_id, level: req.query.level, semester: req.query.semester });
        if (!gpa) {
            return res.status(400).send({ message: 'No GPA Found' });
        }
        res.status(200).send({ gpa: gpa });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.get('/:userId/get-result/:resultId', async(req, res) => {
    try {
        let gpa = await gpaSchema.findOne({ userId: req.params.userId, _id: req.params.resultId });
        if (!gpa) {
            return res.status(400).send({ message: 'No GPA Found' });
        }
        res.status(200).send({ gpa: gpa });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.get('/get-user-gpa/:userId', async(req, res) => {

    try {
        let gpa = await gpaSchema.find({ userId: req.params.userId });
        if (!gpa) {
            return res.status(400).send({ message: 'No GPA Found' });
        }
        res.status(200).send({ gpa: gpa });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.get('/user-institution', async(req, res) => {
    try {
        let institution = await Institutions.findOne({ institution: req.query.institution });
        res.status(201).send({ logo: institution.logo })
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error })
    }
})

router.delete('/remove-course/:courseId', async(req, res) => {
    try {
        const { courseId } = req.params;
        const { user, formData } = req.body;
        const gpa = await gpaSchema.findOne({ userId: user._id, level: formData.current_level, semester: formData.semester });

        const courseIndex = gpa.courses.findIndex(course => String(course._id) === courseId);

        if (courseIndex === -1) { // Course not found
            return res.status(404).json({ error: 'Course not found' });
        }

        // Remove the course from the courses array
        gpa.courses.splice(courseIndex, 1);

        // Save the updated GPA document
        await gpa.save();

        const selectedGPAs = await gpaSchema.findOne({ userId: user._id, level: formData.current_level, semester: formData.semester });

        // const selectedGPAs = selectedCourses.map(course => course.gpa);
        res.status(200).send({ gpa: selectedGPAs, message: "Course Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;