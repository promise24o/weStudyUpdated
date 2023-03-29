const mongoose = require("mongoose");

module.exports = () => {
    const connectionParams = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };
    try {
        mongoose.connect(process.env.DATABASE_URL);
        console.log('====================================');
        console.log("Connected to Mongo Successfully");
        console.log('====================================');
    } catch (error) {
        console.log('====================================');
        console.log(error);
        console.log('Could not connect to Mongo Successfully');
        console.log('====================================');
    }
}