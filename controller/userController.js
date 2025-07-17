// import UserModel from '../models/userModel.js';
import bc from "bcrypt";

export const registerController = (req, res) => {
  const { email, password } = req.body;
  res.send(`register with email: ${email} and password: ${password}`);
};

export const loginController = async (req, res) => {
  try {
    // ...your login logic...
    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
