//based on https://chatgpt.com/share/6766c624-0db4-8011-8246-bc86fa33808d
//simpan code ini sebagai /netlify/functions/afterFormSubmitReaction_background.js
//lalu buka https://app.netlify.com/sites/postnetlify/configuration/notifications#form-submission-notifications
//bagian Form submission notifications
//Add Notification
//HTTP POST request
//Event to listen for : New form submission
//URL to notify, isi dengan url ke file ini : https://postnetlify.netlify.app/.netlify/functions/afterFormSubmitReaction_background
//Form : postForm
//lainnya kosongkan
//Save!
//nanti kalau ada kiriman post ke form ini lagi, akan memicu script ini di background process

const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    // Parse form data (opsional, jika diperlukan)
    const formData = JSON.parse(event.body);

    // Kirim permintaan ke URL yang diinginkan
    const response = await fetch(
      "https://postnetlify.netlify.app/.netlify/functions/triggerManager_background",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "afterFormSubmitReaction.js: A New form submission triggered triggerManager_background.js running ", data: formData }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Triggered successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
