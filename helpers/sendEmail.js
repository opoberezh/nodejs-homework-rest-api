const nodemailer = require("nodemailer");
require ("dotenv").config();

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    }
  });

  const sendEmail = async (message) =>{
    message.from = "opoberezh.2015@gmail.com";
    return transport.sendMail(message);
  };

  module.exports = sendEmail;