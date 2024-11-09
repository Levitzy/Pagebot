const crypto = require('crypto');
const clipboardy = require('clipboardy');
const readline = require('readline');

class TnlDecryptor {
    static handleTnl(encryptedContentsList) {
        const decryptor = new TnlDecryptor();
        let decryptedResults = '';

        for (const encryptedContent of encryptedContentsList) {
            const decrypted = decryptor.decrypt(encryptedContent);
            decryptedResults += decrypted + '\n';
        }

        console.log("Decrypted Results:");
        console.log(decryptedResults);
    }

    decrypt(encryptedContent) {
        const arrContent = encryptedContent.split('.');
        const salt = this.b64decode(arrContent[0].trim());
        const nonce = this.b64decode(arrContent[1].trim());
        const cipher = this.b64decode(arrContent[2].trim());

        const cipherText = cipher.slice(0, cipher.length - 16);
        const configEncPassword = 'B1m93p$$9pZcL9yBs0b$jJwtPM5VG@Vg';

        const PBKDF2key = this.PBKDF2KeyGen(configEncPassword, salt, 1000, 16);
        if (!PBKDF2key) {
            return 'Failed to generate PBKDF2 key.';
        }

        const decryptedResult = this.AESDecrypt(cipher, PBKDF2key, nonce);
        if (!decryptedResult) {
            return 'Failed to decrypt AES.';
        }

        const unpaddedResult = this.removePadding(Buffer.from(decryptedResult, 'utf-8'));
        const decryptedString = unpaddedResult.toString('utf-8');
        const pattern = /<entry key="(.*?)">(.*?)<\/entry>/g;
        let match;
        let resultBuilder = "Anonymous Decrypting World\n\n";

        while ((match = pattern.exec(decryptedString)) !== null) {
            const key = match[1];
            const value = match[2];
            resultBuilder += `[ADW] [${key}]= ${value}\n`;
        }
        
        resultBuilder += "\n\nAnonymous Decrypting World";
        return resultBuilder;
    }

    removePadding(decryptedText) {
        const paddingLength = decryptedText[decryptedText.length - 1];
        return decryptedText.slice(0, decryptedText.length - paddingLength);
    }

    b64decode(content) {
        return Buffer.from(content, 'base64');
    }

    PBKDF2KeyGen(password, salt, count, dkLen) {
        try {
            return crypto.pbkdf2Sync(password, salt, count, dkLen, 'sha256');
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    AESDecrypt(ciphertext, key, nonce) {
        try {
            const decipher = crypto.createDecipheriv('aes-128-gcm', key, nonce, { authTagLength: 16 });
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return decrypted.toString();
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    static copyToClipboard(text) {
        clipboardy.writeSync(text);
        console.log(`Copied to clipboard: ${text}`);
    }
}

// Example Usage
const encryptedContentsList = [
    // Add encrypted contents here in the format of ["encrypted_string1", "encrypted_string2"]
];
TnlDecryptor.handleTnl(encryptedContentsList);
