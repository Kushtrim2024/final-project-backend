import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Users from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";


// ---------------- ORDERS ----------------

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

      items.push({
        productId: menuItem._id,
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: menuItem.price,
      });

      total += menuItem.price * cartItem.quantity;
    }

    const order = new Order({
      userId,
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

    user.cart = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Order History
export const getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ userId })
      .populate("restaurantId")
      .populate("items.menuItemId");

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("actions.updatedBy");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Order Status
export const updateOrderStatus = async (orderId, newStatus, userId = null) => {
  const allowedStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  order.status = newStatus;
  order.actions.push({
    status: newStatus,
    updatedBy: userId,
    timestamp: new Date(),
  });

  await order.save();
  return order;
};

// Change Order Status from Owner/Admin
export const changeOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus, adminId } = req.body;

    const order = await updateOrderStatus(orderId, newStatus, adminId);

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = "cancelled";
    order.actions.push({ status: "cancelled", updatedBy: req.user?.id });
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Order (general updates)
export const updateOrder = async (req, res) => {
  try {
    const { orderId, updates } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    Object.assign(order, updates);
    await order.save();

    res.status(200).json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error" });
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

// Get all orders (for admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")       // only useful fields
      .populate("restaurantId", "name")       // only restaurant name
      .populate("items.productId", "name price")
      .populate("actions.updatedBy", "name role");

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
