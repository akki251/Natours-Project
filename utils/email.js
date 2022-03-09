const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');


class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name;
    this.url = url;
    this.from = 'akshansh773@gmail.com';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //  sendgrid

      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // send the actual mail with subject
    // render html code from pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html)
    };

    // create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    // await transporter.sendMail(mailOptions);
  }

  async sendWelcome() {
    console.log(this, '👍');
    await this.send('Welcome', 'Welcome to the Natours App');
  }

  getThis() {
    return this;
  }
}

module.exports = Email;
