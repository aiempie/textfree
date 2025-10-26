const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const OAuth = require("./oauth");

class Textfree {
  constructor(proxy = {}, debug = false) {
    this.udid = [];
    this.number = "";
    this.pin = "";
    this.email = "";
    this.password = "";
    this.userID = "";
    this.installID = "";
    this.token = "";
    this.xInstallId = "";
    this.proxy = proxy;
    this.pin = "";
    this.sipUsername = "";
    this.sipPassword = "";
    this.debug = debug;

    // Generate initial values
    this.pin = this._generatePin();
    this.udid.push(this._generateUdid());
    this.installID = this._generateInstallID(this.udid[0]);
    this.xInstallId = this._generateUUID1();
    this.udid.push(this._generateUUID1());
  }

  /**
   * Create a new account
   */
  async createAccount(email, password, number) {
    await this.reserveNumber(number);

    const data = {
      pin: this.pin,
      installationId: this.installID,
      udid: this.udid[0],
      device: "unknown",
      timezone: {
        januaryOffset: 480,
        julyOffset: 480,
      },
      email: email,
      password: password,
      clientId: "textfree-android-" + this.installID,
      marketingId: this._randomString(16),
      version: "8.45.1",
      versionOS: "5.1.1",
      systemProperties: {
        "device": "unknown",
        "version.sdk-int": "22",
        "user.home": "",
        "https.proxyPort": "",
        "http.proxyHost": "",
        "user": "unknown",
        "bootloader": "uboot",
        "http.proxyPort": "",
        "device-id": this.udid[0],
        "id": this._randomString(6),
        "manufacturer": "unknown",
        "http.nonProxyHosts": "",
        "tags": "release-keys",
        "type": "user",
        "unknown": "unknown",
        "host": "se.infra",
        "https.proxyHost": "",
        "version.sdk": "22",
        "version.incremental": "eng.se.infra.20190531.182646",
        "fingerprint": "//:5.1.1/20171130.376229:user/release-keys",
        "java.io.tmpdir": "/data/data/com.pinger.textfree/cache",
        "mac": this._randomMacAddress(),
        "cpu-abi": "armeabi-v7a",
        "radio": "unknown",
        "board": "unknown",
        "version.codename": "REL",
        "https.nonProxyHosts": "",
        "display": "-user 5.1.1 20171130.276299 release-keys",
        "http.agent": "Dalvik/2.1.0 (Linux; U; Android 5.1.1; unknown Build/LMY48Z)",
        "version.release": "5.1.1",
        "brand": "unknown",
        "hardware": "intel",
        "cpu-abi2": "armeabi",
        "product": "unknown",
        "model": "unknown",
        "http.keepAlive": "false",
      },
      accountType: "email",
      notificationTokenInfo: {
        notificationToken:
          "eIdgz_ODx3o:APA91bF1zXAOerNALpVBxc16gg9snAHrlNoJfxtqIPd3MNSCepj8BPbN0PPVoEo84ZO_yO-chQEu-xR62x7Z0cDtwIHbq4e0U0a2GZyXhJpHEqLASBJ2hyeUVHPDNWpsznM87THEfI7g",
        notificationType: "G",
        notificationStatus: 1,
      },
    };

    const header = this._getHeaderTemplate();
    const oAuthHeader = new OAuth(
      "POST",
      "https://api.pinger.com/1.0/account/registerWithLang",
      "textfree-android",
    );
    header["Authorization"] = oAuthHeader.createHeader(1);
    header["x-rest-method"] = "POST";

    try {
      const res = await axios.post(
        "https://api.pinger.com/1.0/account/registerWithLang?lang=en_US&cc=US",
        data,
        {
          headers: header,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );

      try {
        const info = res.data;
        this.userID = info.result.userId;
        this.token = info.result.token;
      } catch (error) {
        console.log("[ ERROR ] Account not created! Has this email been used before?");
      }

      await this.setupNumber(number);
      return res.data;
    } catch (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }

  /**
   * Get available numbers for area code
   */
  async getAvaliableNumbers(areaCode) {
    const data = { areaCode: areaCode };
    const header = this._getHeaderTemplate();
    const oAuthHeader = new OAuth(
      "GET",
      "https://api.pinger.com/1.0/account/phone/listAvailableDnxNumbers",
      "textfree-android",
    );
    header["Authorization"] = oAuthHeader.createHeader();
    header["x-rest-method"] = "GET";

    try {
      const res = await axios.post(
        "https://api.pinger.com/1.0/account/phone/listAvailableDnxNumbers",
        data,
        {
          headers: header,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );
      return res.data;
    } catch (error) {
      throw new Error(`Failed to get available numbers: ${error.message}`);
    }
  }

  /**
   * Reserve a phone number
   */
  async reserveNumber(number) {
    const data = {
      phoneNumber: number,
      udid: this.udid[0],
    };
    const header = this._getHeaderTemplate();
    const oAuthHeader = new OAuth(
      "POST",
      "https://api.pinger.com/1.0/account/phone/reserve",
      "textfree-android",
    );
    header["Authorization"] = oAuthHeader.createHeader();
    header["x-rest-method"] = "POST";

    try {
      const res = await axios.post("https://api.pinger.com/1.0/account/phone/reserve", data, {
        headers: header,
        proxy: this.proxy,
        httpsAgent: this.proxy.https,
        httpAgent: this.proxy.http,
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to reserve number: ${error.message}`);
    }
  }

  /**
   * Setup phone number
   */
  async setupNumber(number) {
    const data = {
      phoneNumber: number,
      purchased: "0",
      hideAds: "0",
      hasVoice: "1",
    };
    const oa = new OAuth(
      "POST",
      "https://api.pinger.com/1.0/account/phone",
      `${this.userID}%3Btextfree-android-${this.installID}`,
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0, this.token);
    header["x-rest-method"] = "POST";

    try {
      await axios.post("https://api.pinger.com/1.0/account/phone", data, {
        headers: header,
        proxy: this.proxy,
        httpsAgent: this.proxy.https,
        httpAgent: this.proxy.http,
      });

      const oa2 = new OAuth(
        "GET",
        "https://api.pinger.com/1.0/account/phone/register",
        `${this.userID}%3Btextfree-android-${this.installID}`,
      );
      const header2 = this._getHeaderTemplate();
      header2["Authorization"] = oa2.createHeader(0, this.token);
      header2["x-rest-method"] = "GET";

      await axios.post(
        "https://api.pinger.com/1.0/account/phone/register",
        {},
        {
          headers: header2,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );

      await this.getSipInfo();
      return true;
    } catch (error) {
      throw new Error(`Failed to setup number: ${error.message}`);
    }
  }

  /**
   * Send message
   */
  async sendMessage(msg, to) {
    const data = {
      to: [{ TN: to }],
      text: msg,
    };

    const oa = new OAuth(
      "POST",
      "https://api.pinger.com/2.0/message",
      `${this.userID}%3Btextfree-android-${this.installID}`,
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0, this.token);
    header["x-rest-method"] = "POST";

    try {
      const res = await axios.post("https://api.pinger.com/2.0/message", data, {
        headers: header,
        proxy: this.proxy,
        httpsAgent: this.proxy.https,
        httpAgent: this.proxy.http,
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Authenticate user
   */
  async authUser() {
    const data = {
      userId: this.userID,
      pin: this.pin,
      udid: this.udid[0],
      clientId: "textfree-android-" + this.installID,
      installationId: this.installID,
      versionOS: "5.1.1",
      device: "unknown",
      version: "8.45.1",
    };

    const oa = new OAuth(
      "POST",
      "https://api.pinger.com/1.0/userAuth",
      `${this.userID}%3Btextfree-android-${this.installID}`,
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0, this.token);
    header["x-rest-method"] = "POST";

    try {
      const res = await axios.post("https://api.pinger.com/1.0/userAuth", data, {
        headers: header,
        proxy: this.proxy,
        httpsAgent: this.proxy.https,
        httpAgent: this.proxy.http,
      });
      return res.data;
    } catch (error) {
      throw new Error(`Failed to authenticate user: ${error.message}`);
    }
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    const data = {
      email: email,
      accountType: "email",
      password: password,
      udid: this.udid[0],
      clientId: "textfree-android-" + this.installID,
      installationId: this.installID,
      version: "8.45.1",
      versionOS: "5.1.1",
      device: "unknown",
    };

    const oa = new OAuth(
      "POST",
      "https://api.pinger.com/1.0/account/username/switchDeviceAndUserAuth",
      "textfree-android",
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0);
    header["x-rest-method"] = "POST";

    try {
      const res = await axios.post(
        "https://api.pinger.com/1.0/account/username/switchDeviceAndUserAuth",
        data,
        {
          headers: header,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );

      try {
        const responseData = res.data;
        this.userID = responseData.result.accountId;
        this.token = responseData.result.token;
      } catch (error) {
        console.log(
          "[ ERROR ] Error setting number up, is this number already assigned to an account? Have you already create an account with this email?",
        );
      }

      await this.getSipInfo();
      return res.data;
    } catch (error) {
      throw new Error(`Failed to login: ${error.message}`);
    }
  }

  /**
   * Get messages
   */
  async getMessages(since = null) {
    const oa = new OAuth(
      "GET",
      "https://api.pinger.com/2.0/bsms",
      `${this.userID}%3Btextfree-android-${this.installID}`,
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0, this.token);
    header["x-rest-method"] = "GET";

    try {
      const res = await axios.post(
        "https://api.pinger.com/2.0/bsms",
        {},
        {
          headers: header,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );
      return res.data;
    } catch (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Get SIP information
   */
  async getSipInfo() {
    const oa = new OAuth(
      "GET",
      "https://api.pinger.com/1.0/account/phone/SIP",
      `${this.userID}%3Btextfree-android-${this.installID}`,
    );
    const header = this._getHeaderTemplate();
    header["Authorization"] = oa.createHeader(0, this.token);
    header["x-rest-method"] = "GET";

    try {
      const res = await axios.post(
        "https://api.pinger.com/1.0/account/phone/SIP",
        {},
        {
          headers: header,
          proxy: this.proxy,
          httpsAgent: this.proxy.https,
          httpAgent: this.proxy.http,
        },
      );

      try {
        const data = res.data;
        this.sipUsername = data.result.username;
        this.sipPassword = data.result.password;
      } catch (error) {
        console.log(
          "[ ERROR ] could not get sip username/password, are you using a proxy outside of the US/CANADA? If so voice is not possible.",
        );
      }
    } catch (error) {
      throw new Error(`Failed to get SIP info: ${error.message}`);
    }
  }

  /**
   * Get SIP username
   */
  getSipUsername() {
    return this.sipUsername;
  }

  /**
   * Get SIP password
   */
  getSipPassword() {
    return this.sipPassword;
  }

  /**
   * Generate UDID
   */
  _generateUdid() {
    return this._generateUUID1();
  }

  /**
   * Generate install ID
   */
  _generateInstallID(udid) {
    return `${udid}-${this._randomString(13)}`;
  }

  /**
   * Generate UUID v1
   */
  _generateUUID1() {
    return uuidv4();
  }

  /**
   * Generate PIN
   */
  _generatePin(n = 10) {
    let result = "";
    for (let i = 0; i < n; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }

  /**
   * Get header template
   */
  _getHeaderTemplate() {
    return {
      "x-rest-method": "",
      "Content-Type": "application/json",
      "X-Install-Id": this.xInstallId,
      "x-client": "textfree-android,8.45.1,214_RC_v.45.1_STORE_CONFIG",
      "x-os": "android,5.1.1",
      "x-gid": "90",
      "x-bg": "0",
      "x-udid": `${this.udid[0]},${this.udid[1]}`,
      "Authorization": "",
      "User-Agent": "okhttp/3.11.0",
    };
  }

  /**
   * Generate random string
   */
  _randomString(stringLength = 10) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < stringLength; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  }

  /**
   * Generate random MAC address
   */
  _randomMacAddress() {
    const mac = [
      0x00,
      0x16,
      0x3e,
      Math.floor(Math.random() * 0x7f),
      Math.floor(Math.random() * 0xff),
      Math.floor(Math.random() * 0xff),
    ];
    return mac.map((x) => x.toString(16).padStart(2, "0")).join(":");
  }
}

module.exports = Textfree;
