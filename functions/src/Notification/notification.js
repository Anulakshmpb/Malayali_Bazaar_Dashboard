import Joi from "joi";
import {FieldValue} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import {db} from "../shared/config.js";
import {callableWrapper} from "../shared/callable.wrapper.js";
import {logInfo} from "../shared/logger.js";

const TOKEN_BATCH_SIZE = 500;
const FIRESTORE_BATCH_SIZE = 450;
const SUBSCRIPTION_BATCH_SIZE = 1000;
const NEARBY_RADIUS_KM = 5;

const AUDIENCES = [
  "all_users",
  "all_android_users",
  "all_ios_users",
  "all_web_users",
  "under_5_km",
];

const PLATFORM_TOPICS = {
  web: "all_web_users",
  android: "all_android_users",
  ios: "all_ios_users",
};

const INVALID_TOKEN_CODES = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
];

const notificationSchema = Joi.object({
  targetType: Joi.string()
      .valid("token", "topic")
      .required(),
  userId: Joi.when("targetType", {
    is: "token",
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
  audience: Joi.when("targetType", {
    is: "topic",
    then: Joi.string().valid(...AUDIENCES).required(),
    otherwise: Joi.forbidden(),
  }),
  title: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required(),
  body: Joi.string()
      .trim()
      .min(1)
      .max(500)
      .required(),
  type: Joi.string()
      .trim()
      .uppercase()
      .default("GENERAL"),
});

const validatePushNotification = (data = {}) => {
  const {error, value} = notificationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return {
      success: false,
      error: error.details
          .map((item) => item.message)
          .join(", "),
    };
  }

  return {
    success: true,
    data: value,
  };
};

const getTokenRecords = (userData = {}) => {
  const fcmToken = userData.fcmToken || {};
  const records = [];

  Object.keys(PLATFORM_TOPICS).forEach((platform) => {
    const platformTokens = Array.isArray(fcmToken[platform]) ?
            fcmToken[platform] :
            [];

    platformTokens.forEach((item) => {
      const token =
                typeof item === "string" ?
                    item :
                    item?.token;

      if (typeof token === "string" && token.trim()) {
        records.push({
          token: token.trim(),
          platform,
        });
      }
    });
  });
  const uniqueRecords = new Map();

  records.forEach((record) => {
    if (!uniqueRecords.has(record.token)) {
      uniqueRecords.set(record.token, record);
    }
  });

  return [...uniqueRecords.values()];
};

const getUserTokens = (userData = {}) => {
  return getTokenRecords(userData).map(
      (record) => record.token,
  );
};

const removeInvalidTokens = async (userId, invalidTokens) => {
  if (!invalidTokens.length) return;

  const invalidSet = new Set(invalidTokens);

  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcmToken || {};

    const updates = {};

    Object.keys(PLATFORM_TOPICS).forEach((platform) => {
      const currentTokens = Array.isArray(fcmToken[platform]) ?
                fcmToken[platform] :
                [];

      updates[`fcmToken.${platform}`] = currentTokens.filter(
          (item) => {
            const token =
                        typeof item === "string" ?
                            item :
                            item?.token;

            return !invalidSet.has(token);
          },
      );
    });

    transaction.update(userRef, updates);
  });
};

const saveNotification = async (userId, data, notificationId = null) => {
  const notificationRef = db
      .collection("users")
      .doc(userId)
      .collection("notifications");

  const documentRef = notificationId ?
        notificationRef.doc(notificationId) :
        notificationRef.doc();

  await documentRef.set({
    title: data.title,
    body: data.body,
    type: data.type || "GENERAL",
    createdAt: FieldValue.serverTimestamp(),
    status: "Unread",
  });

  return documentRef.id;
};

const saveBroadcastNotifications = async (
    users,
    data,
    campaignId,
) => {
  let savedCount = 0;

  for (
    let i = 0;
    i < users.length;
    i += FIRESTORE_BATCH_SIZE
  ) {
    const batch = db.batch();

    const currentUsers = users.slice(
        i,
        i + FIRESTORE_BATCH_SIZE,
    );

    currentUsers.forEach((user) => {
      const notificationRef = db
          .collection("users")
          .doc(user.id)
          .collection("notifications")
          .doc(campaignId);

      batch.set(notificationRef, {
        title: data.title,
        body: data.body,
        type: data.type || "GENERAL",
        createdAt: FieldValue.serverTimestamp(),
        status: "Unread",
      });
    });

    await batch.commit();

    savedCount += currentUsers.length;
  }

  return savedCount;
};

const getMessageData = (data, notificationId) => ({
  title: String(data.title),
  body: String(data.body),
  type: String(data.type || "GENERAL"),
  notificationId: String(notificationId),
});

const sendToTokens = async (
    tokens,
    data,
    notificationId,
) => {
  const uniqueTokens = [...new Set(tokens)].filter(Boolean);

  if (!uniqueTokens.length) {
    return {
      totalTokens: 0,
      successCount: 0,
      failureCount: 0,
      message: "No FCM tokens registered.",
    };
  }

  const messaging = getMessaging();

  let successCount = 0;
  let failureCount = 0;

  for (
    let i = 0;
    i < uniqueTokens.length;
    i += TOKEN_BATCH_SIZE
  ) {
    const batchTokens = uniqueTokens.slice(
        i,
        i + TOKEN_BATCH_SIZE,
    );

    const response = await messaging.sendEachForMulticast({
      tokens: batchTokens,

      data: getMessageData(data, notificationId),

      webpush: {
        headers: {
          Urgency: "high",
        },
      },
    });

    successCount += response.successCount;
    failureCount += response.failureCount;
  }

  return {
    totalTokens: uniqueTokens.length,
    successCount,
    failureCount,
  };
};

const sendToCustomer = async (userId, data) => {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return {
      success: false,
      error: "Customer account not found.",
    };
  }

  const tokens = getUserTokens(userDoc.data());

  const notificationId = await saveNotification(
      userId,
      data,
  );

  if (!tokens.length) {
    return {
      success: true,
      message: "Notification saved, but no FCM tokens are registered.",
      notificationId,
      delivery: {
        totalTokens: 0,
        successCount: 0,
        failureCount: 0,
      },
    };
  }

  const messaging = getMessaging();

  let successCount = 0;
  let failureCount = 0;

  const invalidTokens = [];

  for (
    let i = 0;
    i < tokens.length;
    i += TOKEN_BATCH_SIZE
  ) {
    const batchTokens = tokens.slice(
        i,
        i + TOKEN_BATCH_SIZE,
    );

    const response = await messaging.sendEachForMulticast({
      tokens: batchTokens,

      data: getMessageData(data, notificationId),

      webpush: {
        headers: {
          Urgency: "high",
        },
      },
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((result, index) => {
      if (
        !result.success &&
                INVALID_TOKEN_CODES.includes(result.error?.code)
      ) {
        invalidTokens.push(batchTokens[index]);
      }

      if (!result.success) {
        logInfo(
            `FCM delivery failed: ${
              result.error?.code ||
                        result.error?.message
            }`,
        );
      }
    });
  }

  if (invalidTokens.length) {
    await removeInvalidTokens(userId, invalidTokens);
  }

  return {
    success: true,
    message: "Customer notification processed.",
    notificationId,
    delivery: {
      totalTokens: tokens.length,
      successCount,
      failureCount,
      removedInvalidTokens: invalidTokens.length,
    },
  };
};

const getCoordinates = (userData = {}) => {
  const location = userData.location || {};

  const latitude = Number(
      location.latitude ?? location.lat,
  );

  const longitude = Number(
      location.longitude ?? location.lng,
  );

  if (
    !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

const calculateDistanceKm = (point1, point2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const earthRadiusKm = 6371;

  const latDifference = toRadians(
      point2.latitude - point1.latitude,
  );

  const lngDifference = toRadians(
      point2.longitude - point1.longitude,
  );

  const a =
        Math.sin(latDifference / 2) ** 2 +
        Math.cos(toRadians(point1.latitude)) *
        Math.cos(toRadians(point2.latitude)) *
        Math.sin(lngDifference / 2) ** 2;

  return (
    2 *
        earthRadiusKm *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a),
        )
  );
};

const getShopCoordinates = () => {
  const latitude = Number(process.env.SHOP_LATITUDE);
  const longitude = Number(process.env.SHOP_LONGITUDE);

  if (
    !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
  ) {
    throw new Error(
        "Shop coordinates are not configured correctly.",
    );
  }

  return {
    latitude,
    longitude,
  };
};

const getAudienceUsers = async (audience) => {
  const snapshot = await db.collection("users").get();

  const users = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));

  if (audience === "all_users") {
    return users;
  }

  if (audience === "all_web_users") {
    return users.filter((user) =>
      getTokenRecords(user).some(
          (record) => record.platform === "web",
      ),
    );
  }

  if (audience === "all_android_users") {
    return users.filter((user) =>
      getTokenRecords(user).some(
          (record) => record.platform === "android",
      ),
    );
  }

  if (audience === "all_ios_users") {
    return users.filter((user) =>
      getTokenRecords(user).some(
          (record) => record.platform === "ios",
      ),
    );
  }

  if (audience === "under_5_km") {
    const shopCoordinates = getShopCoordinates();

    return users.filter((user) => {
      const customerCoordinates = getCoordinates(user);

      if (!customerCoordinates) return false;

      return (
        calculateDistanceKm(
            shopCoordinates,
            customerCoordinates,
        ) <= NEARBY_RADIUS_KM
      );
    });
  }

  return [];
};

const getAudienceTokens = (users, audience) => {
  let allowedPlatform = null;

  if (audience === "all_web_users") {
    allowedPlatform = "web";
  } else if (audience === "all_android_users") {
    allowedPlatform = "android";
  } else if (audience === "all_ios_users") {
    allowedPlatform = "ios";
  }

  const tokens = [];

  users.forEach((user) => {
    const records = getTokenRecords(user);

    records.forEach((record) => {
      if (
        !allowedPlatform ||
                record.platform === allowedPlatform
      ) {
        tokens.push(record.token);
      }
    });
  });

  return [...new Set(tokens)];
};

const sendToTopic = async (
    audience,
    data,
    campaignId,
) => {
  const topicMap = {
    all_users: "all_users",
    all_web_users: "all_web_users",
    all_android_users: "all_android_users",
    all_ios_users: "all_ios_users",
  };

  const topic = topicMap[audience];

  if (!topic) {
    throw new Error("Invalid FCM topic.");
  }

  const messageId = await getMessaging().send({
    topic,

    data: getMessageData(data, campaignId),

    webpush: {
      headers: {
        Urgency: "high",
      },
    },
  });

  return {
    pushSuccess: true,
    topic,
    messageId,
  };
};

const sendNearbyNotification = async (data) => {
  const users = await getAudienceUsers("under_5_km");

  const campaignId = db
      .collection("_notificationCampaigns")
      .doc().id;

  const savedCount = await saveBroadcastNotifications(
      users,
      data,
      campaignId,
  );

  const tokens = getAudienceTokens(
      users,
      "under_5_km",
  );

  const delivery = await sendToTokens(
      tokens,
      data,
      campaignId,
  );

  return {
    success: true,
    message: "Nearby notification processed.",
    notificationId: campaignId,
    recipientCount: users.length,
    savedCount,
    delivery,
  };
};

const sendTopicNotification = async (data) => {
  const users = await getAudienceUsers(data.audience);

  const campaignId = db
      .collection("_notificationCampaigns")
      .doc().id;

  const savedCount = await saveBroadcastNotifications(
      users,
      data,
      campaignId,
  );

  try {
    const delivery = await sendToTopic(
        data.audience,
        data,
        campaignId,
    );

    return {
      success: true,
      message: "Notification submitted to Firebase.",
      notificationId: campaignId,
      audience: data.audience,
      recipientCount: users.length,
      savedCount,
      delivery,
    };
  } catch (error) {
    logInfo(
        `Topic notification failed: ${error.message}`,
    );

    return {
      success: true,
      message: "Notification history saved, but topic delivery failed.",
      notificationId: campaignId,
      audience: data.audience,
      recipientCount: users.length,
      savedCount,
      delivery: {
        pushSuccess: false,
        error: error.message,
      },
    };
  }
};

const sendPushNotificationService = async (data) => {
  try {
    if (data.targetType === "token") {
      return await sendToCustomer(data.userId, data);
    }

    if (data.targetType === "topic") {
      if (data.audience === "under_5_km") {
        return await sendNearbyNotification(data);
      }

      return await sendTopicNotification(data);
    }

    return {
      success: false,
      error: "Invalid notification target.",
    };
  } catch (error) {
    logInfo(
        `Push notification failed: ${error.message}`,
    );

    return {
      success: false,
      error: error.message ||
                "Unable to send push notification.",
    };
  }
};

const verifyAdmin = async (uid) => {
  const adminDoc = await db
      .collection("adminUsers")
      .doc(uid)
      .get();

  if (!adminDoc.exists) {
    return {
      success: false,
      error: "You are not authorized to send notifications.",
    };
  }

  const admin = adminDoc.data();

  if (admin.status !== "active") {
    return {
      success: false,
      error: "Your admin account is not active.",
    };
  }

  return {success: true};
};

const sendPushNotification = callableWrapper(async (req) => {
  if (!req.auth?.uid) {
    return {
      success: false,
      error: "Authentication is required.",
    };
  }

  const adminCheck = await verifyAdmin(req.auth.uid);

  if (!adminCheck.success) {
    return adminCheck;
  }

  const validationResult = validatePushNotification(
      req.data || {},
  );

  if (!validationResult.success) {
    return validationResult;
  }

  return sendPushNotificationService(
      validationResult.data,
  );
});

const syncNotificationTopics = callableWrapper(async (req) => {
  if (!req.auth?.uid) {
    return {
      success: false,
      error: "Authentication is required.",
    };
  }

  const userId = req.auth.uid;

  const userDoc = await db
      .collection("users")
      .doc(userId)
      .get();

  if (!userDoc.exists) {
    return {
      success: false,
      error: "Customer account not found.",
    };
  }

  const records = getTokenRecords(userDoc.data());

  if (!records.length) {
    return {
      success: true,
      message: "No FCM tokens are registered.",
      subscribedCount: 0,
    };
  }

  const subscriptions = [
    {
      topic: "all_users",
      tokens: [...new Set(
          records.map((record) => record.token),
      )],
    },
    ...Object.entries(PLATFORM_TOPICS).map(
        ([platform, topic]) => ({
          topic,
          tokens: [
            ...new Set(
                records
                    .filter(
                        (record) => record.platform === platform,
                    )
                    .map((record) => record.token),
            ),
          ],
        }),
    ),
  ];

  const messaging = getMessaging();
  const results = [];

  for (const subscription of subscriptions) {
    if (!subscription.tokens.length) continue;

    for (
      let i = 0;
      i < subscription.tokens.length;
      i += SUBSCRIPTION_BATCH_SIZE
    ) {
      const tokens = subscription.tokens.slice(
          i,
          i + SUBSCRIPTION_BATCH_SIZE,
      );

      const result = await messaging.subscribeToTopic(
          tokens,
          subscription.topic,
      );

      results.push({
        topic: subscription.topic,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    }
  }

  return {
    success: true,
    message: "Notification topics synchronized.",
    subscribedCount: records.length,
    results,
  };
});

export {
  sendPushNotification,
  syncNotificationTopics,
};
