const AWS = require('aws-sdk');

// AWS SES configuration - keys will be loaded from .env file
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const ses = new AWS.SES();

class EmailService {
    /**
     * Send Magic Link using AWS SES
     * @param {string} toEmail - recipient email address
     * @param {string} magicLink - the magic link
     * @returns {Promise<object>} - sending result
     */
    async sendMagicLinkEmail(toEmail, magicLink) {
        // If AWS credentials exist, use real SES
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            try {
                const result = await this.sendViaSES(toEmail, magicLink);
                return { success: true, method: 'aws-ses', messageId: result.MessageId };
            } catch (error) {
                console.error('❌ Error sending email with AWS SES:', error.message);
                console.log('💡 AWS SES failed - the user will see the link on the frontend');
                return { success: false, method: 'aws-ses-failed', error: error.message };
            }
        } else {
            // If no AWS credentials, return failure (so frontend will display the link)
            console.log('📧 [DEMO MODE] No AWS credentials - the link will be displayed on the frontend');
            return { success: false, method: 'demo-mode' };
        }
    }

    /**
     * Actual send via AWS SES
     * @param {string} toEmail 
     * @param {string} magicLink 
     * @returns {Promise<object>}
     */
    async sendViaSES(toEmail, magicLink) {
        const params = {
            Source: process.env.FROM_EMAIL, // The email you verified in SES
            Destination: {
                ToAddresses: [toEmail]
            },
            Message: {
                Subject: {
                    Data: 'Your login link',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: this.getHtmlTemplate(toEmail, magicLink),
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: this.getTextTemplate(toEmail, magicLink),
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        const result = await ses.sendEmail(params).promise();
        console.log('✅ Email sent successfully:', result.MessageId);
        return result;
    }

    /**
     * HTML email template
     * @param {string} toEmail 
     * @param {string} magicLink 
     * @returns {string}
     */
    getHtmlTemplate(toEmail, magicLink) {
        return `
            <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px;">
                        <h1 style="color: #007bff;">🔐 Login with Magic Link</h1>
                    </div>
                    
                    <p>Hello,</p>
                    
                    <p>We received a login request for your email address.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${magicLink}" 
                           style="display: inline-block; background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            🚀 Click here to login
                        </a>
                    </div>
                    
                    <p>If the button does not work, you can copy the following link and paste it in your browser:</p>
                    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                        ${magicLink}
                    </p>
                    
                    <hr style="margin: 30px 0;">
                    
                    <p style="color: #6c757d; font-size: 14px;">
                        <strong>⚠️ Important:</strong><br>
                        • The link is valid for 15 minutes only<br>
                        • The link can be used once only<br>
                        • If you did not request this link, you can ignore this email
                    </p>
                    
                    <p style="color: #6c757d; font-size: 12px; text-align: center; margin-top: 30px;">
                        Magic Link Authentication System<br>
                        ${new Date().toLocaleString('en-US')}
                    </p>
                </body>
            </html>
        `;
    }

    /**
     * Plain text email template
     * @param {string} toEmail 
     * @param {string} magicLink 
     * @returns {string}
     */
    getTextTemplate(toEmail, magicLink) {
        return `
Hello,

We received a login request for your email address.

To login, click the following link:
${magicLink}

Important:
- The link is valid for 15 minutes only
- The link can be used once only
- If you did not request this link, you can ignore this email

Magic Link Authentication System
${new Date().toLocaleString('en-US')}
        `;
    }

    /**
     * Check if SES is configured correctly
     * @returns {Promise<boolean>}
     */
    async verifySESSetup() {
        try {
            const result = await ses.getSendQuota().promise();
            console.log('📊 SES Quota:', result);
            return true;
        } catch (error) {
            console.error('❌ SES configuration issue:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();