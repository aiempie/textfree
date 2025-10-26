const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

class OAuth {
  constructor(method, location, oauth_consumer_key, token = "") {
    this.method = method;
    this.location = location;
    this.oauth_consumer_key = oauth_consumer_key;
    this.oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    this.oauth_nonce = this._randomString(16);
    this.token = token;

    this.oauth_signature_method = "HMAC-SHA1";
    this.realm = "https://api.pinger.com";

    // Consumer secrets for iOS client
    this.consumerSecret = [
      "A4S0xXdDWyE8OZCQ1mxfQrN44SEyFgPgjVRx1fWWjqUDCKO0h26Af1sCt43pjAii&",
      "v6wbtkWK9rLJRdZkmqXF1Zq5aqISgrdtxySG6B3BvOcNuK8r2SlTUOiE9vkfROaR&",
      "CdCIDGKs3TAf1UZGrkoYkeJKIvbscPJQ2RIFT0k5RHkRneP4zmOGXsAXDSVifC2a&",
    ];
  }

  /**
   * Generate HMAC-SHA1 hash for OAuth signature
   */
  createSignature(token, baseString, secretKey = 0) {
    const key = this.consumerSecret[secretKey] + token;
    const signature = crypto
      .createHmac("sha1", key)
      .update(baseString)
      .digest("base64")
      .replace(/\+/g, "%2B")
      .replace(/\//g, "%2F")
      .replace(/=/g, "");

    return encodeURIComponent(signature);
  }

  /**
   * Generate OAuth base string
   */
  createBaseString() {
    return (
      `${this.method.toUpperCase()}&${encodeURIComponent(this.location)}&` +
      `oauth_consumer_key=${encodeURIComponent(this.oauth_consumer_key)}&` +
      `oauth_signature_method=${encodeURIComponent(this.oauth_signature_method)}&` +
      `oauth_timestamp=${encodeURIComponent(this.oauth_timestamp)}&` +
      `oauth_nonce=${encodeURIComponent(this.oauth_nonce)}`
    );
  }

  /**
   * Create OAuth header
   */
  createHeader(secretKey = 0, token = "") {
    const signature = this.createSignature(token, this.createBaseString(), secretKey);

    return (
      `OAuth realm="https://api.pinger.com", ` +
      `oauth_consumer_key="${this.oauth_consumer_key}", ` +
      `oauth_signature_method="${this.oauth_signature_method}", ` +
      `oauth_timestamp="${this.oauth_timestamp}", ` +
      `oauth_nonce="${this.oauth_nonce}", ` +
      `oauth_signature="${signature}"`
    );
  }

  /**
   * Generate random string of fixed length
   */
  _randomString(stringLength = 10) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < stringLength; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  }
}

module.exports = OAuth;
