// controller/contactController.js
import ContactMessage from "../models/ContactMessage.js";

export const sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();

    res
      .status(201)
      .json({ message: "Message received successfully", data: newMessage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};