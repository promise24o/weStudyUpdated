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
    isMentor: {
        type: Boolean,
        default: false
    },
    isMentorStatus: {
        type: String,
        enum: [
            "Pending", "Under Review", "Approved", "Rejected"
        ],
        default: "Pending"
    },

    isDonor: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
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
    photo: {
        data: Buffer,
        contentType: String
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
                ref: 'mentors'
            },
            dateAdded: {
                type: Date,
                default: Date.now ()
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
        }
    }
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
