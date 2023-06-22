require ('dotenv').config ();

const io = require ('socket.io')(8801, {
    cors: {
        origin: process.env.CLIENT_BASE_URL
    }
});

io.on ('connection', (socket) => {
    console.log ('A client connected');

    socket.on ('postUpdate', (post) => {
        const postId = post._id;

        // Join the room corresponding to the post ID
        socket.join (postId);

        // Calculate the like count and comment count
        const likesCount = post.likes.length;
        const commentsCount = post.comments.length;

        // Emit like count and comment count to the room
        io.to (postId).emit (`likesCount:${postId}`, likesCount);
        io.to (postId).emit (`commentCounts:${postId}`, commentsCount);
    });

    socket.on ('createPost', (newPost) => { 
        // Emit the newly created post to all connected clients
        io.emit ('newPost', newPost);
    });

});

const express = require ('express');
const app = express ();
const cors = require ('cors');
const connection = require ('./lib/mongoose');
const userRoutes = require ('./routes/user');
const authRoutes = require ('./routes/auth');
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

app.set ('views', __dirname + '/views');
app.set ('view engine', 'ejs');
app.use (express.static (path.join (__dirname, 'public')));

app.get ('/result', (req, res) => {
    res.render ('result_mockup', {title: 'My Website'});
});

// Connection Port
const port = process.env.PORT || 8080;
app.listen (port, () => console.log ('Express server is running on port ' + port));

// Start the WebSocket server
const socketPort = 8800;
io.listen (socketPort);
console.log ('WebSocket server is running on port ' + socketPort);
