/* eslint-disable max-len */
import {FieldValue} from "firebase-admin/firestore";
import {db} from "../../shared/config.js";

/**
 * Seeds sample analytics, financial reports, orders, and ledger collections.
 */
const seedAnalyticsService = async () => {
  try {
    const batch = db.batch();

    // 1. Overall Analytics Overview (/analytics/overview)
    const overviewRef = db.collection("analytics").doc("overview");
    batch.set(overviewRef, {
      totalRevenue: 45231.50,
      netProfit: 12450.75,
      totalOrders: 1284,
      itemsSold: 8214,
      totalProducts: 845,
      totalUsers: 3492,
      lowStockCount: 4,
      totalReceivables: 4620.00,
      grossSubtotal: 43800.00,
      taxCollected: 2630.50,
      deliveryCharges: 840.00,
      discounts: 2039.00,
      costOfGoods: 32780.75,
      trends: {
        revenueGrowth: "+12.8%",
        profitGrowth: "+8.4%",
        orderGrowth: "+6.2%",
        unitsGrowth: "-2.1%",
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    // 2. Product Counter (/analytics/products)
    const productCounterRef = db.collection("analytics").doc("products");
    batch.set(productCounterRef, {
      count: 845,
      updatedAt: FieldValue.serverTimestamp(),
    }, {merge: true});

    // 3. Daily Time-Series (/analytics_time_series/daily_{date})
    const dailyData = [
      {id: "daily_2026-11-07", date: "2026-11-07", dayOfWeek: "Mon", revenue: 12600, profit: 3650, orders: 67, itemsSold: 412, grossSubtotal: 12100, taxCollected: 630, deliveryCharges: 270, discounts: 400, costOfGoods: 8950},
      {id: "daily_2026-11-08", date: "2026-11-08", dayOfWeek: "Tue", revenue: 15300, profit: 4630, orders: 80, itemsSold: 510, grossSubtotal: 14800, taxCollected: 765, deliveryCharges: 320, discounts: 585, costOfGoods: 10670},
      {id: "daily_2026-11-09", date: "2026-11-09", dayOfWeek: "Wed", revenue: 13900, profit: 4140, orders: 73, itemsSold: 465, grossSubtotal: 13400, taxCollected: 695, deliveryCharges: 290, discounts: 485, costOfGoods: 9760},
      {id: "daily_2026-11-10", date: "2026-11-10", dayOfWeek: "Thu", revenue: 19000, profit: 5770, orders: 98, itemsSold: 630, grossSubtotal: 18400, taxCollected: 950, deliveryCharges: 390, discounts: 740, costOfGoods: 13230},
      {id: "daily_2026-11-11", date: "2026-11-11", dayOfWeek: "Fri", revenue: 18700, profit: 5590, orders: 97, itemsSold: 615, grossSubtotal: 18100, taxCollected: 935, deliveryCharges: 380, discounts: 715, costOfGoods: 13110},
      {id: "daily_2026-11-12", date: "2026-11-12", dayOfWeek: "Sat", revenue: 24300, profit: 7440, orders: 127, itemsSold: 810, grossSubtotal: 23600, taxCollected: 1215, deliveryCharges: 510, discounts: 1025, costOfGoods: 16860},
      {id: "daily_2026-11-13", date: "2026-11-13", dayOfWeek: "Sun", revenue: 22100, profit: 6680, orders: 114, itemsSold: 735, grossSubtotal: 21400, taxCollected: 1105, deliveryCharges: 460, discounts: 865, costOfGoods: 15420},
    ];

    for (const item of dailyData) {
      const ref = db.collection("analytics_time_series").doc(item.id);
      batch.set(ref, {
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }

    // 4. Monthly Time-Series (/analytics_time_series/monthly_{month})
    const monthlyData = [
      {id: "monthly_2026-05", month: "2026-05", time: "May", revenue: 180000, profit: 53000, orders: 958, costOfGoods: 127000},
      {id: "monthly_2026-06", month: "2026-06", time: "Jun", revenue: 193400, profit: 58000, orders: 1023, costOfGoods: 135400},
      {id: "monthly_2026-07", month: "2026-07", time: "Jul", revenue: 186800, profit: 55600, orders: 987, costOfGoods: 131200},
      {id: "monthly_2026-08", month: "2026-08", time: "Aug", revenue: 210800, profit: 63200, orders: 1112, costOfGoods: 147600},
      {id: "monthly_2026-09", month: "2026-09", time: "Sep", revenue: 226900, profit: 68300, orders: 1193, costOfGoods: 158600},
      {id: "monthly_2026-10", month: "2026-10", time: "Oct", revenue: 70431, profit: 19850, orders: 380, costOfGoods: 50581},
    ];

    for (const item of monthlyData) {
      const ref = db.collection("analytics_time_series").doc(item.id);
      batch.set(ref, {
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }

    // 5. Product-wise Sales Analytics (/analytics_products/{id})
    const productsAnalytics = [
      {id: "prod_milk", name: "Fresh Whole Milk (1L)", category: "Dairy", quantity: 2070, revenue: 144900, costOfGoods: 103500, profit: 41400, stock: 85, threshold: 20},
      {id: "prod_eggs", name: "Farm Fresh Eggs (12 pcs)", category: "Dairy & Eggs", quantity: 1250, revenue: 100000, costOfGoods: 75000, profit: 25000, stock: 60, threshold: 15},
      {id: "prod_rice", name: "Basmati Rice (5kg)", category: "Grains", quantity: 735, revenue: 132300, costOfGoods: 95550, profit: 36750, stock: 42, threshold: 10},
      {id: "prod_bananas", name: "Organic Bananas (1kg)", category: "Fruits", quantity: 1690, revenue: 84500, costOfGoods: 59150, profit: 25350, stock: 95, threshold: 25},
      {id: "prod_bread", name: "Whole Wheat Bread", category: "Bakery", quantity: 1155, revenue: 57750, costOfGoods: 40425, profit: 17325, stock: 30, threshold: 10},
    ];

    for (const item of productsAnalytics) {
      const ref = db.collection("analytics_products").doc(item.id);
      batch.set(ref, {
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }

    // 6. Detailed Orders (/orders/{orderId})
    const sampleOrders = [
      {
        orderId: "ORD-1048",
        orderDate: "2026-10-12",
        customerName: "Aarav Nair",
        customerPhone: "+91 98765 43210",
        totalItems: 6,
        grossSubtotal: 240.0,
        taxCollected: 12.0,
        deliveryCharge: 20.0,
        discount: 26.5,
        totalAmount: 245.5,
        costOfGoods: 175.0,
        netProfit: 70.5,
        status: "Delivered",
        paymentMethod: "Online",
        paymentStatus: "Paid",
      },
      {
        orderId: "ORD-1047",
        orderDate: "2026-10-12",
        customerName: "Maya Thomas",
        customerPhone: "+91 98470 12345",
        totalItems: 4,
        grossSubtotal: 175.0,
        taxCollected: 8.75,
        deliveryCharge: 15.0,
        discount: 16.75,
        totalAmount: 182.0,
        costOfGoods: 130.0,
        netProfit: 52.0,
        status: "Delivered",
        paymentMethod: "Credit Card",
        paymentStatus: "Paid",
      },
      {
        orderId: "ORD-1046",
        orderDate: "2026-10-11",
        customerName: "Noah Mathew",
        customerPhone: "+91 98950 67890",
        totalItems: 8,
        grossSubtotal: 390.0,
        taxCollected: 19.5,
        deliveryCharge: 20.0,
        discount: 33.75,
        totalAmount: 395.75,
        costOfGoods: 285.0,
        netProfit: 110.75,
        status: "Processing",
        paymentMethod: "UPI",
        paymentStatus: "Paid",
      },
      {
        orderId: "ORD-1045",
        orderDate: "2026-10-10",
        customerName: "Diya Joseph",
        customerPhone: "+91 94471 23456",
        totalItems: 3,
        grossSubtotal: 120.0,
        taxCollected: 6.0,
        deliveryCharge: 15.0,
        discount: 14.75,
        totalAmount: 126.25,
        costOfGoods: 90.0,
        netProfit: 36.25,
        status: "Delivered",
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Paid",
      },
      {
        orderId: "ORD-1044",
        orderDate: "2026-10-09",
        customerName: "Ibrahim Khan",
        customerPhone: "+91 97455 67890",
        totalItems: 5,
        grossSubtotal: 310.0,
        taxCollected: 15.5,
        deliveryCharge: 20.0,
        discount: 27.5,
        totalAmount: 318.0,
        costOfGoods: 225.0,
        netProfit: 93.0,
        status: "Cancelled",
        paymentMethod: "Online",
        paymentStatus: "Refunded",
      },
    ];

    for (const order of sampleOrders) {
      const ref = db.collection("orders").doc(order.orderId);
      batch.set(ref, {
        ...order,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }

    // 7. User Ledgers & Debtors (/user_ledgers/{customerId})
    const ledgers = [
      {id: "CUS001", name: "Acme Corp", phone: "9876543210", orders: 18, receivableAmount: 48500, paidAmount: 47250, payableAmount: 1250},
      {id: "CUS002", name: "Global Tech", phone: "9876543211", orders: 12, receivableAmount: 32500, paidAmount: 31650, payableAmount: 850},
      {id: "CUS003", name: "Stark Ind.", phone: "9876543212", orders: 24, receivableAmount: 76800, paidAmount: 76380, payableAmount: 420},
      {id: "CUS004", name: "Wayne Ent.", phone: "9876543213", orders: 31, receivableAmount: 94000, paidAmount: 91900, payableAmount: 2100},
    ];

    for (const ledger of ledgers) {
      const ref = db.collection("user_ledgers").doc(ledger.id);
      batch.set(ref, {
        ...ledger,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }

    await batch.commit();

    return {
      success: true,
      message: "Sample analytics and report collections populated successfully",
    };
  } catch (error) {
    console.error("Error seeding analytics data:", error);
    return {
      success: false,
      message: error.message || "Failed to seed analytics data",
    };
  }
};

export {seedAnalyticsService};
