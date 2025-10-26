const axios = require("axios");

const BASE_URL = "http://localhost:8000";

async function testAPI() {
  try {
    console.log("🚀 Testing TextFree Express API...\n");

    // Test 1: Login
    console.log("1. Testing login...");
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: "test@example.com",
      password: "password123",
    });

    if (loginResponse.data.success) {
      console.log("✅ Login successful");
      console.log(`Session ID: ${loginResponse.data.session_id}\n`);

      const sessionId = loginResponse.data.session_id;

      // Test 2: Get SIP Info
      console.log("2. Testing SIP info...");
      try {
        const sipResponse = await axios.get(`${BASE_URL}/sip-info`, {
          params: { session_id: sessionId },
        });
        console.log("✅ SIP info retrieved");
        console.log(`SIP Username: ${sipResponse.data.sip_username}\n`);
      } catch (error) {
        console.log("❌ SIP info failed:", error.response?.data?.message || error.message);
      }

      // Test 3: Get Available Numbers
      console.log("3. Testing available numbers...");
      try {
        const numbersResponse = await axios.get(`${BASE_URL}/available-numbers/415`, {
          params: { session_id: sessionId },
        });
        console.log("✅ Available numbers retrieved");
        console.log(`Numbers: ${JSON.stringify(numbersResponse.data.available_numbers)}\n`);
      } catch (error) {
        console.log("❌ Available numbers failed:", error.response?.data?.message || error.message);
      }

      // Test 4: Send Message
      console.log("4. Testing send message...");
      try {
        const messageResponse = await axios.post(`${BASE_URL}/send-message`, {
          message: "Test message from Express API",
          to: "+1234567890",
          session_id: sessionId,
        });
        console.log("✅ Message sent successfully");
        console.log(`Response: ${JSON.stringify(messageResponse.data)}\n`);
      } catch (error) {
        console.log("❌ Send message failed:", error.response?.data?.message || error.message);
      }

      // Test 5: Get Messages
      console.log("5. Testing get messages...");
      try {
        const messagesResponse = await axios.get(`${BASE_URL}/messages`, {
          params: { session_id: sessionId },
        });
        console.log("✅ Messages retrieved");
        console.log(`Messages: ${JSON.stringify(messagesResponse.data.messages)}\n`);
      } catch (error) {
        console.log("❌ Get messages failed:", error.response?.data?.message || error.message);
      }
    } else {
      console.log("❌ Login failed:", loginResponse.data.message);
    }

    // Test 6: Debug Login
    console.log("6. Testing debug login...");
    try {
      const debugResponse = await axios.post(`${BASE_URL}/debug-login`, {
        email: "test@example.com",
        password: "password123",
      });
      console.log("✅ Debug login completed");
      console.log(`Raw response: ${debugResponse.data.raw_response}\n`);
    } catch (error) {
      console.log("❌ Debug login failed:", error.response?.data?.message || error.message);
    }

    console.log("🎉 API testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testAPI();
