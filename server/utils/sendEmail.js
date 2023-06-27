const nodemailer = require('nodemailer');

module.exports = async(email, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.HOST,
            service: process.env.SERVICE,
            port: Number(process.env.EMAIL_PORT),
            secure: Boolean(process.env.SECURE),
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            }
        });
        const senderEmail = process.env.USER;

        await transporter.sendMail({
            from: `"Acadaboo" <${senderEmail}>`,
            to: email,
            subject: subject,
            html: html
        });
        // console.log("Sent mail  to " + email);
    } catch (error) {
        // console.log("Error not sent to " + email);
        console.log(error);
    }
}