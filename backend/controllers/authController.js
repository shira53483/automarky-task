const emailService = require('../services/emailService');
const tokenService = require('../services/tokenService');

class AuthController {
    /**
     * Send Magic Link to email
     */
    async sendMagicLink(req, res) {
        try {
            const { email } = req.body;
            
            console.log('📥 New request to send email:', email);
            
            if (!email || !email.includes('@')) {
                return res.status(400).json({ 
                    error: 'INVALID_EMAIL',
                    message: 'Invalid email address' 
                });
            }
            
            const { token } = tokenService.createToken(email);
            
            const magicLink = `http://localhost:${process.env.PORT || 3000}/verify/${token}`;
            
            const emailResult = await emailService.sendMagicLinkEmail(email, magicLink);
            
            if (emailResult.success) {
                res.json({ 
                    success: true,
                    message: 'Email sent successfully! Check your inbox.',
                    debugInfo: {
                        token: token,
                        link: magicLink,
                        sentViaEmail: true,
                        method: emailResult.method
                    }
                });
            } else {
                // Email failed - show the link in the frontend
                res.json({ 
                    success: true, 
                    message: 'Unable to send email at the moment, but you can use the link below:',
                    showLinkInFrontend: true,
                    debugInfo: {
                        token: token,
                        link: magicLink, 
                        sentViaEmail: false,
                        method: emailResult.method,
                        error: emailResult.error || 'Not identified'
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error sending email:', error);
            res.status(500).json({ 
                success: false,
                error: 'SERVER_ERROR',
                message: 'Error sending email. Please try again.' 
            });
        }
    }

    async verifyToken(req, res) {
        try {
            const { token } = req.params;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_TOKEN',
                    message: 'Token is missing in the request.'
                });
            }

            // Verify the token using the service
            const result = tokenService.verifyToken(token);
            
            if (result.success) {
                res.json(result);
            } else {
                const statusCode = result.error === 'INVALID_TOKEN' ? 404 : 400;
                res.status(statusCode).json(result);
            }
            
        } catch (error) {
            console.error('❌ Error verifying token:', error);
            res.status(500).json({
                success: false,
                error: 'SERVER_ERROR',
                message: 'An unexpected error occurred.'
            });
        }
    }

    /**
     * Direct redirect from email to Angular
     */
    redirectToAngular(req, res) {
        const { token } = req.params;
        
        if (!token) {
            return res.redirect('http://localhost:4200/?error=missing_token');
        }

        // Redirect to Angular with the token
        res.redirect(`http://localhost:4200/verify/${token}`);
    }
}

module.exports = new AuthController();