'use server';

/**
 * @fileOverview Server action to send verification emails with OTP.
 *
 * Uses nodemailer to send emails via Gmail SMTP.
 * OTP is a 6-digit numeric code that expires in 10 minutes.
 */

import nodemailer from 'nodemailer';

export interface SendVerificationEmailInput {
  email: string;
  spaceName: string;
  otp: string;
}

export interface SendVerificationEmailOutput {
  success: boolean;
  error?: string;
}

/**
 * Generate a 6-digit OTP code
 */
export async function generateOTP(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification email with OTP
 */
export async function sendVerificationEmail(
  input: SendVerificationEmailInput
): Promise<SendVerificationEmailOutput> {
  const { email, spaceName, otp } = input;

  // Get email credentials from environment
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPass) {
    console.error('Email credentials not configured');
    return {
      success: false,
      error: 'Email service not configured. Please contact support.',
    };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Email content
  const mailOptions = {
    from: `"Memora AI" <${emailUser}>`,
    to: email,
    subject: `Verification Code for ${spaceName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 30px 40px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Verify Your Email</h1>
                      <p style="margin: 16px 0 0 0; font-size: 16px; color: #666666;">
                        Use the code below to verify your email for <strong>${spaceName}</strong>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px;">
                      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; text-align: center;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a;">${otp}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px 40px 40px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: #999999;">
                        This code will expire in 10 minutes.<br>
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #999999;">
                        &copy; ${new Date().getFullYear()} Memora AI. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `Your verification code for ${spaceName} is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: 'Failed to send verification email. Please try again.',
    };
  }
}
