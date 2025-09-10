import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";
import Users from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";


// ---------------- ORDERS ----------------

//Get Orders

// Controller: Alle Orders abrufen
export const getAllOrders = async (req, res) => {
  try {
    const user = req.user;
    let orders;

    if (user.role === "admin") {
      // Admin: sieht alles
      orders = await Order.find()
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone")
        .populate("restaurants", "_id name address phone"); // falls du das Array im Schema hast
    } 
    else if (user.role === "restaurant") {
      // Restaurant-Besitzer: nur Orders, die sein Restaurant betreffen
      orders = await Order.find({ "items.restaurantId": user.restaurantId })
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone")
        .populate("restaurants", "_id name address phone");
    } 
    else if (user.role === "user") {
      // User: nur seine Orders
      orders = await Order.find({ userId: user._id })
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone")
        .populate("restaurants", "_id name address phone");
    } 
    else {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Place Order
export const placeOrder = async (req, res) => {
  try {
    const { userId, restaurantId, cart, customerName, phone, address, deliveryType, paymentMethod } = req.body;

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const items = [];
    let total = 0;

    for (const cartItem of cart) {
      const menuItem = await MenuItem.findById(cartItem.menuItemId);
      if (!menuItem) continue;

      // ✅ Calculate price
      let itemPrice = 0;

      // Base price
      if (menuItem.basePrice) {
        itemPrice += menuItem.basePrice;
      }

      // Selected size (optional)
      if (cartItem.sizeLabel) {
        const selectedSize = menuItem.sizes.find(s => s.label === cartItem.sizeLabel);
        if (selectedSize) {
          itemPrice += selectedSize.price;
        }
      }

      // Selected addOns (optional)
      if (cartItem.addOns && cartItem.addOns.length > 0) {
        for (const addOnId of cartItem.addOns) {
          const selectedAddOn = menuItem.addOns.id(addOnId); // using subdocument _id
          if (selectedAddOn) {
            itemPrice += selectedAddOn.price;
          }
        }
      }

      const itemTotal = itemPrice * cartItem.quantity;

      items.push({
        productId: menuItem._id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        size: cartItem.sizeLabel || null,
        addOns: cartItem.addOns || [],
        price: itemPrice,
        total: itemTotal,
      });

      total += itemTotal;
    }

    const order = new Order({
      userId,
      restaurantId,
      customerName: customerName || user.name,
      phone: phone || user.phone,
      address,
      items,
      total,
      deliveryType,
      paymentMethod,
      status: "pending",
      actions: [{ status: "pending", updatedBy: userId }],
    });

    await order.save();

    // Clear cart (if you want persistent carts, remove these two lines)
    user.cart = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getOrderHistory = async (req, res) => {
  try {
    const user = req.user;
    let orders;

    if (user.role === "admin") {
      // Admin: alle Bestellungen
      orders = await Order.find()
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } 
    else if (user.role === "restaurant") {
      // Restaurant-Besitzer: nur Bestellungen mit Items von seinem Restaurant
      orders = await Order.find({ "items.restaurantId": user.restaurantId })
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } 
    else if (user.role === "user") {
      // User: nur eigene Bestellungen
      orders = await Order.find({ userId: user._id })
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } 
    else {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Order Details
// Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    // Order laden und alle relevanten Daten populaten
    const order = await Order.findById(orderId)
      .populate("userId", "name email phone")                 // User-Daten
      // .populate("restaurantId", "name address phone")        // Haupt-Restaurant der Order
      .populate("items.productId", "name basePrice")         // Produktdaten
      .populate("items.restaurantId", "name address phone") // Restaurant pro Item
      .setOptions({ strictPopulate: false });               // ⚡ strictPopulate ausschalten

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Rollenbasierte Zugriffskontrolle für User
    if (user.role === "user" && order.userId._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    // Rollenbasierte Zugriffskontrolle für Restaurant
    if (user.role === "restaurant") {
      if (!user.restaurantId) {
        return res.status(403).json({ message: "Restaurant ID not set for this user" });
      }

      // Nur Items des eigenen Restaurants sichtbar
      order.items = order.items.filter(
        item => item.restaurantId._id.toString() === user.restaurantId.toString()
      );

      // Wenn keine Items mehr übrig → Zugriff verweigern
      if (order.items.length === 0) {
        return res.status(403).json({ message: "Not authorized to view this order" });
      }
    }

    // Admin darf alles sehen → keine Einschränkung nötig
    res.status(200).json(order);

  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Valid statuses
const VALID_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "ready",
  "delivered",
  "cancelled"
];

// Business-Logik zum Status ändern
export const updateOrderStatus = async (orderId, newStatus, user) => {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (user.role === "user") {
    if (
      newStatus !== "cancelled" ||
      order.userId.toString() !== user._id.toString() ||
      ["delivered", "cancelled"].includes(order.status)
    ) {
      throw new Error("Not authorized to update this order");
    }
    order.status = "cancelled";
  } else if (user.role === "restaurant") {
    if (!user.restaurantId) throw new Error("Restaurant ID not set for this user");

    let itemsUpdated = false;

    order.items.forEach(item => {
      if (item.restaurantId.toString() === user.restaurantId.toString()) {
        item.status = newStatus;
        itemsUpdated = true;
      }
    });

    if (!itemsUpdated) throw new Error("No items belong to your restaurant in this order");

    // Gesamtstatus ableiten
    const allDelivered = order.items.every(item => item.status === "delivered");
    const allReady = order.items.every(item => ["ready", "delivered"].includes(item.status));

    if (allDelivered) order.status = "delivered";
    else if (allReady) order.status = "ready";
    else order.status = "preparing";
  }
  // Admin darf alles
  else if (user.role === "admin") {
    order.status = newStatus;
    order.items.forEach(item => (item.status = newStatus));
  }

  order.actions.push({
    status: newStatus,
    updatedBy: user._id,
    timestamp: new Date(),
  });

  await order.save();
  return order;
};

// Controller
export const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;
    const updatedOrder = await updateOrderStatus(orderId, newStatus, req.user);
    res.status(200).json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(400).json({ message: error.message });
  }
};



// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prüfen, ob restaurantId existiert
    if (!order.restaurantId) {
      return res.status(400).json({ message: "Invalid order: missing restaurantId" });
    }

    order.status = "cancelled";
    order.actions.push({ status: "cancelled", updatedBy: req.user?.id });
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error" });
  }
};
