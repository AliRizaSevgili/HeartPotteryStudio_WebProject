const Contact = require("../models/Contact");

exports.submitContactForm = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      company,
      email,
      contactNumber,
      message
    } = req.body;

    const newContact = await Contact.create({
      firstName,
      lastName,
      company,
      email,
      contactNumber,
      message
    });

    res.status(200).json({ message: "Form successfully submitted!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
