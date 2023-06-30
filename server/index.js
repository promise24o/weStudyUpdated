require ('dotenv').config ();
const Notification = require ('./models/Notifications');

const io = require ('socket.io')(8801, {
    cors: {
        origin: process.env.ALLOWED_ORIGIN,
        methods: ["GET", "POST"]
    }
});


io.on ('connection', (socket) => {
    console.log ('A client connected');

    socket.on ('postUpdate', async (post) => {
        const postId = post._id;
        const userId = post.userId;
        // Assuming the user ID is available in the 'post' object

        // Join the room corresponding to the post ID
        socket.join (postId);

        // Calculate the like count and comment count
        const likesCount = post.likes.length;
        const commentsCount = post.comments.length;

        // Emit like count and comment count to the room
        io.to (postId).emit (`likesCount:${postId}`, likesCount);
        io.to (postId).emit (`commentCounts:${postId}`, commentsCount);

        // Trigger the getNotificationCounts event
        socket.emit('getNotificationCounts', userId);
    });


    socket.on ('createPost', (newPost) => { // Emit the newly created post to all connected clients
        io.emit ('newPost', newPost);
    });
    
    socket.on ('getNotificationCounts', async (userId) => {
        try { // Find the unread notifications for the specified user
            const notificationsCount = await Notification.countDocuments ({recipient: userId, isRead: false});

            // Emit the notification counts to the client
            socket.emit ('notificationCounts', {notificationsCount});
            console.log('getNotificationCounts triggered'); // Add this console log
        } catch (error) {
            console.error (error);
        }
    });


    socket.on ('disconnect', () => console.log ('Client disconnected'));

});


const express = require ('express');
const app = express ();
const cors = require ('cors');
const connection = require ('./lib/mongoose');
const userRoutes = require ('./routes/user');
const authRoutes = require ('./routes/auth');
const mentorRoutes = require ('./routes/mentor');
const adminRoutes = require ('./routes/admin');
const publicRoutes = require ('./routes/public');
const AIRoutes = require ('./routes/acadabooai');
var useragent = require ('express-useragent');
const swaggerUI = require ('swagger-ui-express');
const swaggerJsDoc = require ('swagger-jsdoc');
const path = require ('path');

// Database connection
connection ();

// Middleware
app.use (express.json ({limit: '50mb', extended: true}));
app.use (cors ());
app.use (useragent.express ());
app.set ('trust proxy', true);

// Routes
app.use ('/api/users/', userRoutes);
app.use ('/api/users/:id/verify/:token', userRoutes);
app.use ('/api/users/resend-verify-email-link', userRoutes);
app.use ('/api/users/institutions', userRoutes);
app.use ('/api/auth/', authRoutes);
app.use ('/api/auth/logout', authRoutes);
app.use ('/api/auth/admin-logout', authRoutes);
app.use ('/api/auth/admin', authRoutes);
app.use ('/api/admin/', adminRoutes);
app.use ('/api/public/', publicRoutes);
app.use ('/api/ai/', AIRoutes);
app.use ('/api/mentor/', mentorRoutes);

// Swagger Definition
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Acadaboo API',
            version: '1.0.0',
            description: 'Acadaboo REST API'
        },
        servers: [
            {
                url: 'http://127.0.0.1:8080/api/'
            }, {
                url: 'https://we-study.onrender.com/api/'
            },
        ]
    },
    apis: ['./routes/*.js']
};

const specs = swaggerJsDoc (options);
app.use ('/api-docs', swaggerUI.serve, swaggerUI.setup (specs));

app.get ('/', function (req, res) {
    res.send (req.useragent);
});

app.set ('views', __dirname + '/emails');
app.set ('view engine', 'ejs');
app.use (express.static (path.join (__dirname, 'public')));

app.get ('/otp', (req, res) => {
    res.render ('otp', {title: 'My Website'});
});

// Connection Port
const port = process.env.PORT || 8080;
app.listen (port, () => console.log ('Express server is running on port ' + port));
console.log ('WebSocket server is running on port 8801');


// Start the WebSocket server
// const socketPort = 8800;
// io.listen (socketPort);
// console.log ('WebSocket server is running on port ' + socketPort);
