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

const adminLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.ObjectId,
        required: true,
        ref: "admin",
    },
    action: {
        type: String,
        required: true,
    },
});

adminLogSchema.set ('timestamps', true);
adminSchema.set ('timestamps', true);

adminSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign ({
        _id: this.id
    }, process.env.JWT_SECRET_KEY, {expiresIn: "1d"})
    this.token = token;
    await this.save ();
    return token;
};


// Export admin model
const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;

// Export adminLog model
const AdminLog = mongoose.model('AdminLog', adminLogSchema);
module.exports.AdminLog = AdminLog;





