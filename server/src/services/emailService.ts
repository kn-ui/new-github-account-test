// import nodemailer from 'nodemailer';

interface EmailOptions {
  from?: string; // Make from optional
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_HOST_PORT), // Convert to a number
//   secure: process.env.EMAIL_SECURE === 'true', // Convert the string 'true' to a boolean
//   auth: {
//    user: process.env.EMAIL_USER,
//    pass: process.env.EMAIL_PASS,
//  },
// });

export const sendEmail = async (options: EmailOptions) => {
  // try {
  //   const mailOptions = {
  //     from: options.from || process.env.EMAIL_FROM, // Use provided from or fallback
  //     to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
  //     subject: options.subject,
  //     text: options.text,
  //     html: options.html,
  //   };

  //   await transporter.sendMail(mailOptions);
  //   console.log('Email sent successfully');
  // } catch (error) {
  //   console.error('Error sending email:', error);
  //   throw new Error('Failed to send email');
  // }
  console.log('Email sending is disabled. Options:', options);
  return Promise.resolve();
};
