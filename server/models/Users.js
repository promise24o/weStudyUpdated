const mongoose = require ('mongoose');
const jwt = require ('jsonwebtoken');
const passwordComplexity = require ('joi-password-complexity');
const Joi = require ('joi');


const userSchema = new mongoose.Schema ({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String
    },
    token: {
        type: String
    },
    accountType: {
        type: String,
        required: true
    },
    isMentor: {
        type: Boolean,
        default: false
    },
    isDonor: {
        type: Boolean,
        default: false
    },
    isMentorStatus: {
        type: String,
        enum: [
            "Pending",
            "Profile Pending",
            "Application Submitted",
            "Under Review",
            "Approved",
            "Active",
            "Suspended",
            "Rejected"
        ],
        default: "Pending"
    },
    isDonorStatus: {
        type: String,
        enum: [
            "Pending",
            "Profile Pending",
            "Application Submitted",
            "Under Review",
            "Approved",
            "Active",
            "Suspended",
            "Rejected"
        ],
        default: "Pending"
    },
    accountStatus: {
        type: String,
        enum: [
            "Active",
            "Suspended",
        ],
        default: "Active"
    },
    verified: {
        type: Boolean,
        default: false
    },
    dateAccountVerified: {
       type: Date,
    },
    education: {
        institution_type: {
            type: String
        },
        institution: {
            type: String
        },
        course_of_study: {
            type: String
        },
        current_level: {
            type: String
        },
        faculty: {
            type: String
        },
        department: {
            type: String
        },
        study_mode: {
            type: String
        }
    },
    highSchoolEducation: {
        highSchool: {
            type: String
        },
        currentClass: {
            type: String
        },
        subjectMajor: {
            type: String
        },
        pJambYear: {
            type: String
        },
        pInstitutionType: {
            type: String
        },
        pInstitution: {
            type: String
        },
        pFaculty: {
            type: String
        },
        pDepartment: {
            type: String
        },
        pCourse: {
            type: String
        },
        pStudyMode: {
            type: String
        }
    },
    jambiteEducation: {
        highSchool: {
            type: String
        },
        graduationYear: {
            type: String
        },
        subjectMajor: {
            type: String
        },
        pJambYear: {
            type: String
        },
        pInstitutionType: {
            type: String
        },
        pInstitution: {
            type: String
        },
        pFaculty: {
            type: String
        },
        pDepartment: {
            type: String
        },
        pCourse: {
            type: String
        },
        pStudyMode: {
            type: String
        }
    },
    personal: {
        dob: {
            type: String
        },
        phone: {
            type: String
        },
        gender: {
            type: String
        },
        contact_address: {
            type: String
        },
        city: {
            type: String
        }
    },
    twofa: {
        type: Boolean,
        default: false
    },
    targetCGPA: {
        type: Number
    },
    preset_param: {
        status: {
            type: Boolean,
            default: false
        },
        scale: {    
            type: Number
        },
        grading: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    auto: true
                },
                grade_symbol: {
                    type: String
                },
                grade_value: {
                    type: Number
                },
                createdAt: {
                    type: Date,
                    default: Date.now ()
                }
            }
        ]
    },
    favoriteMentors: [
        {
            mentor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'mentor'
            },
            dateAdded: {
                type: Date,
                default: Date.now ()
            },
            chatStatus: {
                type: Boolean,
                default: false
            }
        }
    ],
    friends: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            dateAdded: {
                type: Date,
                default: Date.now ()
            }
        }
    ],
    liveFeedSettings: {
        username: {
            type: String,
            default: ""
        },
        about: {
            type: String,
            default: ""
        },
        personal_details: {
            type: Boolean,
            default: true
        },
        edu_details: {
            type: Boolean,
            default: true
        },
        contact_details: {
            type: Boolean,
            default: true
        },
        friends_list: {
            type: Boolean,
            default: true
        },
        onlineStatus: {
            type: Boolean,
            default: false
        }
    },
    verification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VerificationBadge'
    },
     dateBadgeVerified: {
       type: Date,
    },
    privileges: {
        showBankDetails: {
            type: Boolean,
            default: false
        },
        applyForRaise: {
            type: Boolean,
            default: true
        },
        postMarketPlace: {
            type: Boolean,
            default: true
        },
        postEvent: {
            type: Boolean,
            default: true
        },
    },
});


userSchema.set ('timestamps', true);

userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign ({
        _id: this.id,
        user_id: this.id
    }, process.env.JWT_SECRET_KEY, {expiresIn: "1d"})
    this.token = token;
    await this.save ();
    return token;
};


const User = mongoose.model ("user", userSchema);

const validate = (data) => {
    const schema = Joi.object ({
        firstname: Joi.string ().required ().label ('First Name'),
        lastname: Joi.string ().required ().label ('Last Name'),
        email: Joi.string ().required ().label ('Email'),
        password: passwordComplexity ().required ().label ('Password'),
        confirmPassword: Joi.string ().valid (Joi.ref ('password')).required ().label ('Confirm Password').messages (
            {'any.only': 'Confirm Password does not match Password'}
        )
    });

    return schema.validate (data);
}

module.exports = {
    User,
    validate
};
