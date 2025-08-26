import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import Order from "../models/Order.js"; // Optional: für archivierte Bestellungen


// Add item to cart
import mongoose from "mongoose";

export const addToCart = async (req, res) => {
  try {
    const { userId, menuItemId, quantity = 1, size, addOns = [] } = req.body;

    // Validierung
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ message: "Invalid menuItemId" });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Menü-Item holen
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Preisberechnung
    let totalPrice = menuItem.basePrice || 0;
    if (size) {
      const sizeObj = menuItem.sizes?.find(s => s.label === size);
      if (sizeObj) totalPrice += sizeObj.price;
    }
    if (addOns?.length > 0) {
      totalPrice += addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
    }
    totalPrice *= quantity;

    if (isNaN(totalPrice) || totalPrice < 0) {
      return res.status(400).json({ message: "Invalid total price" });
    }

    // Warenkorb finden oder erstellen
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Gleiches Item prüfen
    const existingItemIndex = cart.items.findIndex(item =>
      item.menuItem.toString() === menuItemId &&
      item.size === size &&
      JSON.stringify(item.addOns) === JSON.stringify(addOns)
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice += totalPrice;
    } else {
      cart.items.push({ menuItem: menuItemId, quantity, size, addOns, totalPrice });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });

  } catch (error) {
    console.error("Error adding to cart:", error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};


// View cart
export const viewCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId })
      .populate("items.menuItem")
      .populate("items.addOns"); // falls AddOns eigene Modelle sind

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error viewing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Hilfsfunktion: Kartentyp automatisch erkennen
function detectCardType(cardNumber) {
  const num = cardNumber.replace(/\D/g, ""); // nur Ziffern behalten

  if (/^4/.test(num)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
  if (/^(50|5[6-9]|6[0-9])/.test(num)) return "maestro";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(num)) return "discover";

  return "other";
}

// --------------------
// Choose payment method (pro Cart gespeichert)
export const choosePaymentMethod = async (req, res) => {
  try {
    const { userId, paymentMethod } = req.body;
    const allowedMethods = ["card", "paypal", "applepay", "googlepay"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Finde oder erstelle den Warenkorb
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], paymentMethod });
      await cart.save();
      return res.status(200).json({
        message: "Payment method set on new cart",
        paymentMethod,
        cart
      });
    }

    // Update Payment Method
    cart.paymentMethod = paymentMethod;
    await cart.save();

    res.status(200).json({
      message: "Payment method updated successfully",
      paymentMethod,
      cart
    });
  } catch (error) {
    console.error("Error choosing payment method:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// --------------------
// Checkout
// Checkout
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
      paymentDetails
    } = req.body;

    const allowedMethods = ["card", "paypal", "applepay", "googlepay"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Wenn Karte: Typ automatisch ermitteln
    let cardType = null;
    let last4 = null;
    if (paymentMethod === "card") {
      if (!paymentDetails || !paymentDetails.cardNumber) {
        return res.status(400).json({ message: "Card number required" });
      }

      cardType = detectCardType(paymentDetails.cardNumber);
      if (cardType === "other") {
        return res.status(400).json({ message: "Unsupported card type" });
      }

      // ✅ Nur die letzten 4 Ziffern speichern
      last4 = paymentDetails.cardNumber.slice(-4);
    }

    // Warenkorb laden
    const cart = await Cart.findOne({ userId }).populate("items.menuItem");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // OrderItems aus Warenkorb zusammenstellen
    const orderItems = cart.items.map(item => {
      const menuItem = item.menuItem;
      return {
        productId: menuItem ? menuItem._id : null,
        name: menuItem ? menuItem.name : "Deleted Item",
        quantity: item.quantity,
        price: menuItem.price,
        total: item.totalPrice,
        size: item.size || null,
        addOns: item.addOns?.map(a => ({
          name: a.name,
          price: a.price
        })) || []
      };
    });

    // ✅ Bestellung speichern (nur Kartentyp + letzte 4 Ziffern)
    const order = new Order({
      userId,
      restaurantId,
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod,
      paymentDetails: paymentMethod === "card"
        ? { cardType, last4 }
        : paymentDetails, // PayPal, ApplePay, GooglePay etc. können ggf. andere Details haben
      items: orderItems
    });
    await order.save();

    // ✅ Warenkorb leeren nach Bestellung
    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ message: "Server error" });
  }
};


