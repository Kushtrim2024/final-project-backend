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

// Choose payment method (pro Cart gespeichert)
export const choosePaymentMethod = async (req, res) => {
  try {
    const { userId, paymentMethod } = req.body;
    const allowedMethods = ["card", "online"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Finde oder erstelle den Warenkorb
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      // Optional: Erstelle neuen Cart, falls noch keiner existiert
      cart = new Cart({ userId, items: [], paymentMethod });
      await cart.save();
      return res.status(200).json({ message: "Payment method set on new cart", paymentMethod, cart });
    }

    // Update Payment Method
    cart.paymentMethod = paymentMethod;
    await cart.save();

    res.status(200).json({ message: "Payment method updated successfully", paymentMethod, cart });
  } catch (error) {
    console.error("Error choosing payment method:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Checkout
export const checkout = async (req, res) => {
  try {
    const { userId, customerName, phone, address, deliveryType, paymentMethod, paymentDetails } = req.body;

    // 1. Prüfe gültige Payment-Methoden
    const allowedMethods = ["card", "online"];
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // 2. Hole den Warenkorb
    const cart = await Cart.findOne({ userId }).populate("items.menuItem");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3. Formatiere Items für Order
    const orderItems = cart.items.map(item => {
      const menuItem = item.menuItem;

      return {
        productId: menuItem ? menuItem._id : null,
        name: menuItem ? menuItem.name : "Deleted Item",
        quantity: item.quantity,
        price: item.totalPrice,
        size: item.size || null,
        addOns: item.addOns?.map(a => ({
          name: a.name,
          price: a.price
        })) || []
      };
    });

    // 4. Berechne Gesamtsumme
    const total = orderItems.reduce((sum, item) => sum + item.price, 0);

    // 5. Simuliere Payment
    const paymentSuccess = true; // Hier echte Payment-Integration einbauen
    const paymentStatus = paymentSuccess ? "paid" : "failed";

    // 6. Erstelle Order
    const order = new Order({
      userId: userId || undefined,
      customerName,
      phone,
      address: deliveryType === "delivery" ? address : undefined,
      deliveryType,
      paymentMethod,
      paymentStatus,
      items: orderItems,
      total,
      status: "pending",
      actions: [{ status: "pending", updatedBy: userId || null }],
    });

    await order.save();

    // 7. Leere den Warenkorb
    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
  console.error("Error during checkout:", error);
  res.status(500).json({ 
    message: error.message,
    stack: error.stack 
  });}
};
