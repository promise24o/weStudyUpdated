const jwt = require('jsonwebtoken');
const { User } = require('../models/Users');
const Admin = require('../models/Admin');

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

const auth2 = async(req, res, next) => { // Get the token from the request headers

    const token = req.headers.authorization.replace('Bearer ', '').trim().replace(/"/g, '');

    // Check if a token exists
    if (!token) {
        return res.status(401).json({ message: 'Authentication failed. No token provided.' });
    }

    try {
        // Verify the token and get the decoded
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Check if the token matches the user ID
        const user = await Admin.findOne({ _id: decoded._id, token: token });

        // If user not found, throw error
        if (!user) {
            throw new Error();
        }
        // Add user and token to request object
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
    }
};

module.exports = {
    auth,
    auth2
}