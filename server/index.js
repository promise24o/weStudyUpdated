require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connection = require('./lib/mongoose');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
var useragent = require('express-useragent');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc')



//Database connection
connection();


//Middleware
app.use(express.json({ limit: '50mb', extended: true }));
app.use(cors());
app.use(useragent.express());
app.set('trust proxy', true)


// Routes 
app.use("/api/users/", userRoutes);
app.use("/api/users/:id/verify/:token", userRoutes);
app.use("/api/users/resend-verify-email-link", userRoutes);
app.use("/api/users/institutions", userRoutes);
app.use("/api/auth/", authRoutes);
app.use("/api/auth/logout", authRoutes);
app.use("/api/auth/admin-logout", authRoutes);
app.use("/api/auth/admin", authRoutes);
app.use("/api/admin/", adminRoutes);
app.use("/api/public/", publicRoutes);


//Swagger Defintion 
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Acadaboo API",
            version: "1.0.0",
            description: "Acadaboo REST API"
        },
        servers: [{
            url: "http://127.0.0.1:8080/api/"
        }, {
            url: "https://we-study.onrender.com/api/"
        }]
    },
    apis: ["./routes/*.js"]
};


const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));




app.get('/', function(req, res) {
    res.send(req.useragent);
});


// Connection Port
const port = process.env.PORT || 8080;
app.listen(port, () => console.log('Listening on Port ' + port));