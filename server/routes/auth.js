const router = require("express").Router();
const { User } = require("../models/Users");
const Activity = require("../models/Activities");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
var express = require('express');
var app = express();
var useragent = require('express-useragent');


app.use(useragent.express());


router.post("/", async(req, res) => {
    const userAgentString = req.headers['user-agent'];
    try {
        const { error } = validate(req.body);
        if (error)
            return res.status(400).send({ message: error.details[0].message });

        const user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).send({ message: "Invalid Email Address" });

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPassword)
            return res.status(400).send({ message: "Invalid Password" });

        const token = await user.generateAuthToken();

        const userWithoutPassword = await User.findOne({ _id: user._id }).select('-password -token')

        const newActivity = new Activity({

        });
        const activity = await new Activity({
            userId: user._id,
            browser: req.useragent.browser,
            ip_address: req.socket.remoteAddress,
            os: req.useragent.os,
            source: req.useragent.source,
            createdAt: Date.now()
        }).save();

        res.status(200).send({
            data: {
                token: token,
                user: userWithoutPassword,
            },
            message: "Login Successfully!",
        });

    } catch (error) {
        res.status(500).send({ message: "Internal Server Error", error: error });
        console.error(error);
    }
});

// Logout user
router.post("/logout", auth, async(req, res) => {
    try {
        // Remove the token from the user's document
        const user = req.user;
        user.token = null;
        await user.save();

        res.status(200).send({ message: "Logout successful" });
    } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

const validate = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().label("Password"),
    });

    return schema.validate(data);
};

module.exports = router;