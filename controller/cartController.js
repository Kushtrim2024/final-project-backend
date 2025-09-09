import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// 🔹 Hilfsfunktion: Kartentyp erkennen
function detectCardType(cardNumber) {
  const num = cardNumber.replace(/\D/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
  if (/^(50|5[6-9]|6[0-9])/.test(num)) return "maestro";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(num)) return "discover";
  return "other";
}

// 🟢 Artikel in den Warenkorb legen
export const addToCart = async (req, res) => {
  try {
    const { userId, menuItemId, quantity = 1, size, addOns = [] } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ message: "Invalid menuItemId" });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    let totalPrice = menuItem.basePrice || 0;
    if (size) {
      const sizeObj = menuItem.sizes?.find((s) => s.label === size);
      if (sizeObj) totalPrice += sizeObj.price;
    }
    if (addOns?.length > 0) {
      totalPrice += addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
    }
    totalPrice *= quantity;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.menuItem.toString() === menuItemId &&
        item.size === size &&
        JSON.stringify(item.addOns) === JSON.stringify(addOns)
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice += totalPrice;
    } else {
      cart.items.push({
        menuItem: menuItemId,
        quantity,
        size,
        addOns,
        totalPrice,
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🟢 Warenkorb anzeigen
export const viewCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId })
      .populate("items.menuItem")
      .populate("items.addOns");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error viewing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Payment Method aus Profil auswählen und im Warenkorb speichern
export const choosePaymentMethod = async (req, res) => {
  try {
    const { userId, selectedMethodId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const method = user.paymentMethods.find(
      (m) => m._id.toString() === selectedMethodId
    );
    if (!method)
      return res.status(404).json({ message: "Payment method not found" });

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        paymentMethod: method.type,
        paymentDetails: method,
      });
      await cart.save();
      return res
        .status(200)
        .json({ message: "Payment method set on new cart", cart });
    }

    cart.paymentMethod = method.type;
    cart.paymentDetails = method;
    await cart.save();

    res
      .status(200)
      .json({ message: "Payment method updated successfully", cart });
  } catch (err) {
    console.error("Error choosing payment method:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Checkout
export const checkout = async (req, res) => {
  try {
    const {
      userId,
      restaurantId,
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod,
      paymentDetails,
    } = req.body;

    const allowedMethods = ["card", "paypal", "applepay", "googlepay"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let cardType = null;
    let last4 = null;
    if (paymentMethod === "card") {
      if (!paymentDetails?.cardNumber) {
        return res.status(400).json({ message: "Card number required" });
      }
      cardType = detectCardType(paymentDetails.cardNumber);
      last4 = paymentDetails.cardNumber.slice(-4);
    }

    const cart = await Cart.findOne({ userId }).populate("items.menuItem");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = cart.items.map((item) => ({
      productId: item.menuItem?._id || null,
      name: item.menuItem?.name || "Deleted Item",
      quantity: item.quantity,
      price: item.menuItem?.price,
      total: item.totalPrice,
      size: item.size || null,
      addOns: item.addOns?.map((a) => ({ name: a.name, price: a.price })) || [],
    }));

    const order = new Order({
      userId,
      restaurantId,
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod,
      paymentDetails:
        paymentMethod === "card" ? { cardType, last4 } : paymentDetails,
      items: orderItems,
    });
    await order.save();

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ message: "Server error" });
  }
};
