var db=require('../config/connection')
var collection=require('../config/collection')
var vendorHelper = require('../helpers/VendorHelpers')
var nodemailer = require('nodemailer');

module.exports ={
    sendEmail:(Details)=>{
        let mailSent = {}
        return new Promise(async(resolve,reject)=>{
            var from = "mnihal.cy123@gmail.com";
            var to = Details.email;
            var subject = "Account Recovery";
            var message = `Dear Customer, Your OTP is `+Details.OTP+` Do not Share it with anyone by means. This is confidential and to be used by you only.  Warm regards, Room Stay`

            var transporter = nodemailer.createTransport({
                service:"gmail",
                auth:{
                    user: 'mnihal.cy123@gmail.com',            // mnihalcy@gmail.com      'mnihal.cy123@gmail.com',
                    pass: 'junqlhxuxjczqepe'               // btpyaxmlighzzaok              'wpbdwpjsasatxvma' junqlhxuxjczqepe
                }
            });
            var mailOptions={
                from:from,
                to:to,
                subject: subject,
                text: message
            };
            transporter.sendMail(mailOptions, (error, _info) => {
                if (error) {
                    console.log(error);
                    mailSent.error;
                } else {
                    mailSent.Status = true;
                    console.log("Email sent ");
                }
            })
            resolve(mailSent);
        })
    }
}