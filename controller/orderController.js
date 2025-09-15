import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";
import Users from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import mongoose from "mongoose";

// ---------------- ORDERS ----------------
const isValidId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

// Controller: Fetch all orders
export const getAllOrders = async (req, res) => {
  try {
    const user = req.user;
    let orders;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (user.role === "admin") {
      // Admin: sees all orders
      orders = await Order.find()
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone");
    } else if (user.role === "restaurant") {
      if (!user.restaurantId) {
        return res
          .status(400)
          .json({ message: "Restaurant user has no restaurantId set" });
      }
      const restaurantObjectId = new mongoose.Types.ObjectId(user.restaurantId);
      orders = await Order.find({ restaurantId: restaurantObjectId }) // :white_check_mark: adjusted
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone");
    } else if (user.role === "user") {
      // User: only own orders
      orders = await Order.find({ userId: user._id })
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "_id name address phone");
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
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
    const {
      restaurantId,
      cart,
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod,
      paymentDetails,
    } = req.body;

    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    const items = [];
    let total = 0;

    for (const cartItem of cart || []) {
      const menuItem = await MenuItem.findById(cartItem.menuItemId);
      if (!menuItem) continue;

      let itemPrice = 0;

      if (menuItem.basePrice) itemPrice += Number(menuItem.basePrice) || 0;

      // size
      if (cartItem.sizeLabel) {
        const selectedSize = (menuItem.sizes || []).find(
          (s) => s.label === cartItem.sizeLabel
        );
        if (selectedSize) itemPrice += Number(selectedSize.price) || 0;
      }

      const normalizeAddOns = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch {}

          const trimmed = val.trim().replace(/^\[|\]$/g, "");
          if (!trimmed) return [];
          return trimmed
            .split(",")
            .map((s) => s.replace(/^['"\s]+|['"\s]+$/g, ""))
            .filter(Boolean);
        }
        return [];
      };

      const usedAddOnIds = [];
      const incomingAddOns = normalizeAddOns(cartItem.addOns);

      for (const a of incomingAddOns) {
        if (isValidId(a)) {
          const sub = menuItem.addOns?.id?.(a);
          if (sub) {
            itemPrice += Number(sub.price) || 0;
            usedAddOnIds.push(sub._id);
            continue;
          }
        }

        if (typeof a === "string") {
          const lower = a.trim().toLowerCase();
          const sub = (menuItem.addOns || []).find(
            (x) =>
              String(x.name || "")
                .trim()
                .toLowerCase() === lower
          );
          if (sub) {
            itemPrice += Number(sub.price) || 0;
            usedAddOnIds.push(sub._id);
            continue;
          }
        }
      }

      const qty = Number(cartItem.quantity) || 1;
      const itemTotal = itemPrice * qty;

      items.push({
        productId: menuItem._id,
        name: menuItem.name,
        quantity: qty,
        size: cartItem.sizeLabel || null,
        addOns: usedAddOnIds,
        price: itemPrice,
        total: itemTotal,
        restaurantId,
        status: "pending",
      });

      total += itemTotal;
    }

    // optional: payment summary (demo)
    let payment = undefined;
    if (paymentMethod) {
      payment = { status: "authorized" };

      if (paymentDetails?.savedMethodId) {
        payment.savedMethodId = paymentDetails.savedMethodId;
      }

      if (paymentDetails?.card?.number) {
        const num = String(paymentDetails.card.number).replace(/\D/g, "");
        let sum = 0,
          dbl = false;
        for (let i = num.length - 1; i >= 0; i--) {
          let d = parseInt(num[i], 10);
          if (dbl) {
            d *= 2;
            if (d > 9) d -= 9;
          }
          sum += d;
          dbl = !dbl;
        }
        const isValid = num.length >= 12 && sum % 10 === 0;
        if (!isValid)
          return res.status(400).json({ message: "Invalid card number" });

        payment.brand = paymentDetails.card.brand || "card";
        payment.holder = paymentDetails.card.holder || "";
        payment.last4 = num.slice(-4);
      }

      if (paymentDetails?.paypal?.email) {
        payment.paypalEmail = paymentDetails.paypal.email;
      }

      if (paymentMethod === "cod") {
        payment.status = "pending_cash";
      }
    }

    // create order
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
      ...(payment ? { payment } : {}),
      status: "pending",
      actions: [{ status: "pending", updatedBy: userId }],
    });

    await order.save();

    // clear persistent user cart if applicable
    if (Array.isArray(user.cart)) {
      user.cart = [];
      await user.save();
    }

    return res
      .status(201)
      .json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error placing order:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const user = req.user;
    let orders;

    if (user.role === "admin") {
      // Admin: all orders
      orders = await Order.find()
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } else if (user.role === "restaurant") {
      // Restaurant owner: only orders with items from their restaurant
      orders = await Order.find({ "items.restaurantId": user.restaurantId })
        .populate("userId", "name email phone")
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } else if (user.role === "user") {
      // User: only own orders
      orders = await Order.find({ userId: user._id })
        .populate("items.productId", "name basePrice")
        .populate("items.restaurantId", "name address phone");
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const user = req.user;

    const order = await Order.findById(orderId)
      .populate("userId", "name email phone")
      .populate("restaurantId", "name address phone") // 👈 ADD
      .populate("items.productId", "name basePrice")
      .populate("items.restaurantId", "_id name address phone")
      .setOptions({ strictPopulate: false });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      user.role === "user" &&
      order.userId._id.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    if (user.role === "restaurant") {
      if (!user.restaurantId) {
        return res
          .status(403)
          .json({ message: "Restaurant ID not set for this user" });
      }

      // 1) If the order's main restaurantId matches, show the FULL order
      if (
        order.restaurantId &&
        order.restaurantId._id?.toString() === user.restaurantId.toString()
      ) {
        return res.status(200).json(order);
      }

      // 2) Otherwise, check if there are items belonging to this restaurant
      const itemsForRestaurant = (order.items || []).filter(
        (item) =>
          item.restaurantId &&
          item.restaurantId._id?.toString() === user.restaurantId.toString()
      );

      if (itemsForRestaurant.length > 0) {
        order.items = itemsForRestaurant;
        return res.status(200).json(order);
      }

      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    // Admin: full access
    return res.status(200).json(order);
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
  "cancelled",
];

// Business logic to change status

// ID normalization: convert to string regardless of ObjectId / string / populated object
function normId(v) {
  if (!v) return "";
  if (typeof v === "object" && v._id) return String(v._id);
  try {
    return String(v);
  } catch {
    return "";
  }
}

export const updateOrderStatus = async (orderId, newStatus, user) => {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error("Invalid status");
  }

  const order = await Order.findById(orderId)
    // since we will use item.productId.restaurantId as fallback, it's helpful to also fetch productId
    .populate({ path: "items.productId", select: "restaurantId" });

  if (!order) throw new Error("Order not found");

  if (user.role === "user") {
    // User can only set their own order to "cancelled" and only if it's not delivered/cancelled
    if (
      newStatus !== "cancelled" ||
      normId(order.userId) !== normId(user._id) ||
      ["delivered", "cancelled"].includes(order.status)
    ) {
      throw new Error("Not authorized to update this order");
    }
    order.status = "cancelled";
  } else if (user.role === "restaurant") {
    const myRid = normId(user.restaurantId);
    if (!myRid) throw new Error("Restaurant ID not set for this user");

    let updatedCount = 0;

    for (const item of order.items) {
      const itemRid = normId(item.restaurantId);
      const prodRid = normId(item.productId?.restaurantId);

      // 1) if item.restaurantId matches directly
      if (itemRid && itemRid === myRid) {
        item.status = newStatus;
        updatedCount++;
        continue;
      }

      // 2) item.restaurantId is missing but the product's restaurant matches
      if (!itemRid && prodRid && prodRid === myRid) {
        item.status = newStatus;
        updatedCount++;
        continue;
      }

      // 3) fallback: if the order.restaurantId is your restaurant
      const orderRid = normId(order.restaurantId);
      if (orderRid && orderRid === myRid) {
        item.status = newStatus;
        updatedCount++;
        continue;
      }
    }

    if (updatedCount === 0) {
      // for quick diagnosis (during development), you can leave a log:
      // console.warn("No items match", {
      //   myRid,
      //   orderRid: normId(order.restaurantId),
      //   itemRids: order.items.map(it => ({ itemRid: normId(it.restaurantId), prodRid: normId(it.productId?.restaurantId) }))
      // });
      throw new Error("No items belong to your restaurant in this order");
    }

    // Derive the overall order status from the items
    const allDelivered = order.items.every((it) => it.status === "delivered");
    const allReady = order.items.every((it) =>
      ["ready", "delivered"].includes(it.status)
    );

    if (allDelivered) order.status = "delivered";
    else if (allReady) order.status = "ready";
    else order.status = "preparing";
  } else if (user.role === "admin") {
    order.status = newStatus;
    order.items.forEach((it) => (it.status = newStatus));
  } else {
    throw new Error("Not authorized");
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
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
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

    // Check whether restaurantId exists
    if (!order.restaurantId) {
      return res
        .status(400)
        .json({ message: "Invalid order: missing restaurantId" });
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
    const orderId = req.params.orderId || req.params.id; // 👈 support both param names
    const user = req.user;

    const order = await Order.findById(orderId).select(
      "restaurantId items.restaurantId"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only allow a restaurant to delete its own order; admin unrestricted
    if (user.role === "restaurant") {
      if (!user.restaurantId) {
        return res
          .status(403)
          .json({ message: "Restaurant ID not set for this user" });
      }
      const myRid = String(user.restaurantId);
      const belongs =
        (order.restaurantId && String(order.restaurantId) === myRid) ||
        (order.items || []).some(
          (it) => it.restaurantId && String(it.restaurantId) === myRid
        );

      if (!belongs) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this order" });
      }
    }

    await order.deleteOne();
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error" });
  }
};