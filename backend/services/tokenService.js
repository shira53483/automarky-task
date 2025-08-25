const { v4: uuidv4 } = require('uuid');

const magicLinks = new Map();

const LINK_EXPIRATION = 15 * 60 * 1000; 

function cleanExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [token, data] of magicLinks.entries()) {
        if (now - data.createdAt > LINK_EXPIRATION) {
            magicLinks.delete(token);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹Token ${cleanedCount} expired and was removed נמחקו`);
    }
}

// ניקוי אוטומטי כל 5 דקות
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

class TokenService {
    /**
     * יצירת טוקן חדש
     * @param {string} email 
     * @returns {object} 
     */
    createToken(email) {
        cleanExpiredTokens();
        
        const token = uuidv4();
        const createdAt = Date.now();
        const expiresAt = createdAt + LINK_EXPIRATION;
        
        magicLinks.set(token, {
            email: email,
            createdAt: createdAt,
            expiresAt: expiresAt,
            used: false
        });
        
        console.log('✅ New token created:', token);
        console.log('📊 Total active tokens:', magicLinks.size);
        
        return { token, expiresAt };
    }

    /**
     * אימות טוקן
     * @param {string} token - הטוקן לבדיקה
     * @returns {object} - תוצאת האימות
     */
    verifyToken(token) {
        console.log('🔍 Token check:', token);
        
        // בדיקה אם הטוקן קיים
        const linkData = magicLinks.get(token);
        
        if (!linkData) {
            return {
                success: false,
                error: 'INVALID_TOKEN',
                message: 'Your link is invalid or has expired.'
            };
        }
        
        // בדיקה אם הטוקן כבר נוצל
        if (linkData.used) {
            return {
                success: false,
                error: 'TOKEN_ALREADY_USED',
                message: 'This link has already been used.'
            };
        }
        
        // בדיקה אם הטוקן פג תוקף
        if (Date.now() - linkData.createdAt > LINK_EXPIRATION) {
            magicLinks.delete(token);
            return {
                success: false,
                error: 'TOKEN_EXPIRED',
                message: 'The link has expired (15 minutes). Please request a new one.'
            };
        }
        
        // סימון כטוקן מנוצל
        linkData.used = true;
        magicLinks.set(token, linkData);
        
        console.log('✅ Token successfully verified for:', linkData.email);
        
        return {
            success: true,
            email: linkData.email,
            message: 'You have successfully logged in!',
            loginTime: new Date().toISOString(),
            token: token
        };
    }
}

module.exports = new TokenService();