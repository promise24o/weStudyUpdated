const mongoose = require ('mongoose');
const jwt = require ('jsonwebtoken');


const adminSchema = new mongoose.Schema ({
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

    profileImage: {
        type: String
    },
    token: {
        type: String
    },

    photo: {
        data: Buffer,
        contentType: String
    }

});


adminSchema.set ('timestamps', true);

adminSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign ({
        _id: this.id
    }, process.env.JWT_SECRET_KEY, {expiresIn: "1d"})
    this.token = token;
    await this.save ();
    return token;
};

module.exports = mongoose.model ('Admin', adminSchema);
