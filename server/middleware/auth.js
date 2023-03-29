const jwt = require('jsonwebtoken');
const { User } = require('../models/Users');

const auth = async(req, res, next) => {

    try { // Get token from header
        const token = JSON.parse(req.header('Authorization').replace('Bearer ', ''));

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Find user with token and token value
        const user = await User.findOne({ _id: decoded._id, 'token': token });
        // If user not found, throw error
        if (!user) {
            throw new Error();
        }

        // Add user and token to request object
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Authentication Failed' });
    }
};

module.exports = auth;