require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const connectDB = require("./config/db");
const app = express();
connectDB();
const {
  user,
  project,
  freePlan,
  basicPlan,
  standardPlan,
  premiumPlan,
} = require("./helper-objects");

const corsConfig = {
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "Accept",
    "Host",
    "User-Agent",
    "Content-Type",
    "Connection",
    "Accept-Encoding",
    "Authorization",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_SECRET_WEBHOOK_KEY
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.sendStatus(400);
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          let updatedSubscriptionItem;
          if (session.metadata.subType === "add-ons-first-time") {
            console.log("Entered in to the add-ons-first-time session condition\n");
            const subscriptionItemId = subscription.items.data[0].id;
            updatedSubscriptionItem = await stripe.subscriptionItems.update(
              subscriptionItemId,
              {
                metadata: {
                  subType: "add-ons",
                },
              }
            );
          }
          else if (session.metadata.subType === "normal-first-time") {
            console.log("Entered in to the session normal subscription condition\n");
            const subscriptionItemId = subscription.items.data[0].id;
            updatedSubscriptionItem = await stripe.subscriptionItems.update(
              subscriptionItemId,
              {
                metadata: {
                  subType: "normal",
                },
              }
            );
          }
        }
        break;
      default:
      // console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//firstly we create the customer in the stripe

async function createCustomer(name, email) {
  try {
    const response = await stripe.customers.create({ name, email });
    return response;
  } catch (e) {
    throw new Error(err);
  }
}

async function createCheckoutSession(cId, priceId, isAddonsFlag) {
  try {
    let metadata;
    if (isAddonsFlag) {
      metadata = {
        subType: "add-ons-first-time"
      }
    } else {
      metadata = {
        subType: "normal-first-time"
      }
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: cId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata,
      mode: "subscription",
      success_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/success",
      cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",
    });

    return session.url;
  } catch (e) {
    console.log(e);
  }
}

app.post("/create-free-subscription", async (req, res) => {
  try {
    const { name, email, priceId } = req.body;
    console.log("Entered in to the create-free-subscription \n");
    console.log(name, email, priceId);
    const customer = await createCustomer(name, email);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId,
        },
      ],
      metadata: {
        subType: "normal",
      },
    });
    await stripe.subscriptionItems.update(subscription.items.data[0].id, {
      metadata: {
        subType: "normal",
      },
    });
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      // card: { token: "tok_threeDSecure2Required" },
      card: { token: "tok_visa" },
    });
    console.log("paymentMethod is \n", JSON.stringify(paymentMethod, null, 2));

    const attachPaymentMethod = await stripe.paymentMethods.attach(
      paymentMethod.id,
      {
        customer: customer.id,
      }
    );

    console.log(
      "attachPaymentMethod is \n",
      JSON.stringify(attachPaymentMethod, null, 2)
    );

    const updatedCustomer = await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
      // default_source: paymentMethod.id,
    });
    console.log(
      "updatedCustomer is \n",
      JSON.stringify(updatedCustomer, null, 2)
    );
    res.send({ message: "Success", subscription });
  } catch (e) {
    throw new Error(e);
  }
});

app.post("/customer/add", async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("Entered in to the customer add", name, email);
    const newCustomer = await createCustomer(name, email);
    return res.status(200).send(newCustomer);
  } catch (e) {
    console.log(e);
  }
});

app.get("/success", (req, res) => {
  res.status(200).send({ status: "Payment successfully" });
});

app.get("/cancel", (req, res) => {
  res.status(200).send({ status: "Payment Failed" });
});

app.post("/create-subscription", async (req, res) => {
  try {
    const { name, email, priceId, isAddonsFlag } = req.body;
    const customer = await createCustomer(name, email);
    const checkoutUrl = await createCheckoutSession(customer.id, priceId, isAddonsFlag);
    res.send({ url: checkoutUrl });
  } catch (e) {
    throw new Error(e);
  }
});

app.post("/upgrade-subscription", async (req, res) => {
  try {
    const { customerId, subId, newSubPriceId, newAddOnPriceId } =
      req.body;
    console.log("customerId: " + customerId);
    console.log("subId is\n", subId);
    console.log("newSubPriceId is\n", newSubPriceId);
    console.log("newADDOnPriceId is\n", newAddOnPriceId);
    // case-1 if user have not any subscription
    // if (subId.trim() === "") {
    //   const session = await stripe.checkout.sessions.create({
    //     payment_method_types: ["card"],
    //     mode: "subscription",
    //     customer: customerId,
    //     line_items: [
    //       {
    //         price: newSubPriceId,
    //         quantity: 1,
    //       },
    //     ],
    //     metadata: {
    //       subType: "normal",
    //     },
    //     subscription_data: {
    //       metadata: {
    //         subType: "normal",
    //       },
    //     },
    //     success_url:
    //       "https://6f9dpz0d-3000.inc1.devtunnels.ms/upgrade-new-subscription/success",
    //     cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",
    //   });
    //   console.log("session.url is \n", session.url);
    //   return res.send({ url: session.url });
    // }

    // case-2 when user has simple main subscription and move to upgrade to the new subscription
    const activeSubscription = await stripe.subscriptions.retrieve(subId);
    console.log(
      "activeSubscription is \n",
      JSON.stringify(activeSubscription, null, 2)
    );
    if (!activeSubscription) {
      throw new Error(`No subscription found with this id: ${subId}`);
    }
    console.log(
      "activeSubscription.items.data[0].id",
      activeSubscription.items.data[0].id
    );
    // case 0 if user has already in the free plan
    // if (
    //   activeSubscription.items.data.length === 1 &&
    //   activeSubscription.items.data[0].plan.nickname === "free"
    // ) {
    //   console.log("Entered in to the case 0 condition \n");
    //   const subscription = await stripe.subscriptions.update(subId, {
    //     items: [
    //       {
    //         id: activeSubscription.items.data[0].id,
    //         deleted: true,
    //       },
    //       {
    //         price: newSubPriceId,
    //         metadata: {
    //           subType: "normal",
    //         },
    //       },
    //     ],
    //     proration_behavior: "none",
    //   });
    //   return res.status(200).send({ message: "success", subscription });
    // }

    // if (
    //   activeSubscription.items.data.length === 2 &&
    //   activeSubscription.items.data[0].plan.nickname === "free" &&
    //   activeSubscription.items.data[1].metadata.subType === "add-ons"
    // ) {
    //   console.log("Entered in to the case of free + add-ons\n");
    //   const quantity = activeSubscription.items.data[1].quantity;
    //   const subscription = await stripe.subscriptions.update(subId, {
    //     items: [
    //       {
    //         id: activeSubscription.items.data[0].id,
    //         deleted: true,
    //       },
    //       {
    //         id: activeSubscription.items.data[1].id,
    //         deleted: true,
    //       },
    //       {
    //         price: newSubPriceId,
    //         metadata: {
    //           subType: "normal",
    //         },
    //       },
    //       {
    //         price: newAddOnPriceId,
    //         metadata: {
    //           subType: "add-ons",
    //         },
    //         quantity,
    //       },
    //     ],
    //     proration_behavior: "create_prorations",
    //   });
    //   return res.status(200).send({ message: "success", subscription });
    // }
    const price = newAddOnPriceId
      ? await stripe.prices.retrieve(newAddOnPriceId)
      : undefined;

    console.log("price is \n", JSON.stringify(price, null, 2));
    let quantity;
    let addOnTotal;
    const subscription_details = [];

    const updateSubArray = [];
    // make subscription_details array
    activeSubscription.items.data.map((item) => {
      if (item.metadata.subType === "normal") {
        updateSubArray.push({ id: item.id, deleted: true });
        updateSubArray.push({
          price: newSubPriceId,
          quantity: 1,
          metadata: {
            subType: "normal",
          },
        });
        subscription_details.push({
          id: item.id,
          price: newSubPriceId,
          quantity: item.quantity,
        });
      }
      if (item.metadata.subType === "add-ons") {
        updateSubArray.push({ id: item.id, deleted: true });
        updateSubArray.push({
          price: newAddOnPriceId,
          quantity: item.quantity,
          metadata: {
            subType: "add-ons",
          },
        });
        quantity = item.quantity;
      }
    });
    console.log("subscription_details is \n", subscription_details);

    // if (newAddOnPriceId) {
    //   updateSubArray.push({ id: newAddOnPriceId, quantity });
    // }
    addOnTotal = price ? quantity * price.unit_amount_decimal : 0;
    console.log("addOnTotal is \n", addOnTotal);

    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subId,
      subscription_details: {
        items: subscription_details,
      },
    });
    console.log(
      "upcomingInvoice is \n",
      JSON.stringify(upcomingInvoice, null, 2)
    );

    let prorationAmount;
    if (upcomingInvoice.lines.data.length === 1) {
      prorationAmount = upcomingInvoice.lines.data[0].amount;
    } else {
      prorationAmount =
        upcomingInvoice.lines.data.length === 0
          ? upcomingInvoice.lines.data.amount + addOnTotal
          : upcomingInvoice.lines.data
            .filter((line) => line.proration)
            .reduce((total, line) => total + line.amount, 0) + addOnTotal;
    }
    console.log("Total proration amount is", prorationAmount);

    const line_items = [
      {
        price_data: {
          currency: activeSubscription.currency,
          unit_amount_decimal: prorationAmount,
          product_data: {
            name: "Proration Product 1",
            description: "Proration Product 1",
          },
        },
        quantity: 1,
      },
    ];

    updateSubArray.push({ subId });
    // Create a Checkout Session for the immediate proration amount
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customerId,
      line_items,
      success_url: `https://6f9dpz0d-3000.inc1.devtunnels.ms/upgrade-payment-success/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",
      metadata: {
        updateSubArray: JSON.stringify(updateSubArray), // Serialize the updateSubArray
      },
    });

    res.send({ url: session.url });
  } catch (e) {
    console.log(e);
    res.status(400).send({ error: e.message });
  }
});

app.get("/upgrade-payment-success/success", async (req, res) => {
  const { session_id } = req.query;
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const updateSubArray = JSON.parse(session.metadata.updateSubArray);
  console.log(
    "updateSubArray in the upgrade payment success \n",
    updateSubArray
  );
  let subId;
  const items = [];

  // Separate subId and other items
  updateSubArray.forEach((item) => {
    if (item.subId) {
      subId = item.subId;
    } else {
      items.push(item);
    }
  });
  console.log("items is \n", items);

  console.log(
    "updateSubArray in the upgrade payment success \n",
    updateSubArray
  );
  console.log("Extracted subId: ", subId);
  console.log("Remaining items: ", items);
  try {
    const subscription = await stripe.subscriptions.update(subId, {
      items: items,
      proration_behavior: "none",
    });
    res.status(200).send({
      message: "upgrade subscription successfully",
      newSubscription: subscription,
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/upgrade-new-subscription/success", async (req, res) => {
  res.send({ message: "Successfully upgrade and create new subscription\n" });
});

app.post("/downgrade-subscription", async (req, res) => {
  try {
    const { newAddOnPriceId, newPriceId, subId } = req.body;

    const activeSubscription = await stripe.subscriptions.retrieve(subId);
    let addOnsQuantity;
    activeSubscription.items.data.map((item) => {
      if (item.metadata.subType === "add-ons") {
        addOnsQuantity = item.quantity;
      }
    });

    const items = addOnsQuantity
      ? [
        {
          price: newPriceId,
          quantity: 1,
        },
        {
          price: newAddOnPriceId,
          quantity: addOnsQuantity,
        },
      ]
      : [
        {
          price: newPriceId,
          quantity: 1,
        },
      ];
    const subscriptionSchedule = await stripe.subscriptionSchedules.create({
      from_subscription: subId,
    });

    console.log(
      "subscriptionSchedule is \n",
      JSON.stringify(subscriptionSchedule, null, 2)
    );

    const phases = subscriptionSchedule.phases.map((phase) => ({
      start_date: phase.start_date,
      end_date: phase.end_date,
      items: phase.items,
    }));

    const downgradeSubscription = await stripe.subscriptionSchedules.update(
      subscriptionSchedule.id,
      {
        end_behavior: "release",
        phases: [
          ...phases,
          {
            items,
            proration_behavior: "none",
          },
        ],
      }
    );

    res.status(200).send({
      message: "create schedule for downgrade subscription successfully",
      downgradeSubscription,
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/schedule-success", async (req, res) => {
  res.send({
    message: "Successfully schedule for the downgrade the subscription \n",
  });
});

app.get("/schedule-cancel", async (req, res) => {
  res.send({
    message:
      "Getting an error while creating schedule for the downgrade subscription\n",
  });
});

app.post("/add-additional-project", async (req, res) => {
  try {
    const { customerId, newPriceId } = req.body;
    const checkoutUrl = await createCheckoutSession(customerId, newPriceId);
    res.send({ url: checkoutUrl });
  } catch (e) {
    console.log(`Error in the add-additional-project: ${e}`);
  }
});

app.post("/add-additional-credit", async (req, res) => {
  try {
    let { customerId, newPriceId, quantity, subId } = req.body;
    console.log("customerId and typeof ", customerId, typeof customerId);
    console.log("newPriceId and typeof ", newPriceId, typeof newPriceId);
    console.log("quantity and type of quantity is ", quantity, typeof quantity);
    console.log("subId is and typeof subId is ", subId, typeof subId);

    let subscription;
    if (subId.trim() === "") {
      subId = "not-defined";
    } else {
      subscription = await stripe.subscriptions.retrieve(subId);
    }

    console.log("subscription is \n", subscription);
    let paymentMode = subId === "not-defined" ? "subscription" : "payment";

    console.log("mode is \n", paymentMode);
    const price = await stripe.prices.retrieve(newPriceId);
    const subscription_data =
      paymentMode === "subscription"
        ? {
          metadata: {
            subType: "add-ons",
          },
        }
        : {};
    console.log("subscription_data\n", subscription_data);
    const line_items =
      paymentMode === "subscription"
        ? [{ price: newPriceId, quantity }]
        : [
          {
            price_data: {
              currency: price.currency,
              unit_amount_decimal: price.unit_amount_decimal,
              product_data: {
                name: "Proration Add on product",
                description: "proration add on product charges",
                images: [],
                metadata: {
                  subType: "add-ons",
                },
              },
            },
            quantity,
          },
        ];

    console.log("line_items", line_items);
    const metadata = {
      newPriceId,
      quantity,
      paymentMode,
      subId,
    };
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: paymentMode,
      customer: customerId,
      line_items,
      subscription_data,
      metadata,
      success_url: `https://6f9dpz0d-3000.inc1.devtunnels.ms/additional-credit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",
    });
    console.log("session is \n", session);
    res.send({ url: session.url });
  } catch (e) {
    console.log(e);
  }
});

app.get("/additional-credit/success", async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { newPriceId, quantity, paymentMode, subId } = session.metadata;
    if (paymentMode === "payment") {
      console.log("entered in to the if condition\n");
      const subscription = await stripe.subscriptions.retrieve(subId);
      console.log("subscription is \n", JSON.stringify(subscription, null, 2));
      const existingItem = subscription.items.data.find(
        (item) => item.price.id === newPriceId
      );
      console.log("existing item is \n", JSON.stringify(existingItem, null, 2));
      if (existingItem) {
        // Update the quantity of the existing subscription item
        const updatedSubscription = await stripe.subscriptions.update(subId, {
          items: [
            {
              id: existingItem.id,
              quantity: existingItem.quantity + parseInt(quantity, 10),
            },
          ],
          proration_behavior: "none",
        });
        return res
          .status(200)
          .send({ message: "success", updatedSubscription });
      } else {
        // Add a new subscription item
        console.log("Entered in to the else condition \n");
        const updatedSubscription = await stripe.subscriptions.update(subId, {
          items: [
            {
              price: newPriceId,
              quantity,
              metadata: {
                subType: "add-ons",
              },
            },
          ],
          proration_behavior: "none",
        });
        return res
          .status(200)
          .send({ message: "success", updatedSubscription });
      }
    } else {
      return res
        .status(200)
        .send({ message: "successfully created the subscription" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e.message });
  }
});

app.get("/cancel-additional-credit", async (req, res) => {
  res.send({ message: "Error in the add new credit plan" });
});

app.post("/add-additional-credit-new", async (req, res) => {
  try {
    let { customerId, newPriceId, quantity, subId } = req.body;
    console.log("customerId and typeof ", customerId, typeof customerId);
    console.log("newPriceId and typeof ", newPriceId, typeof newPriceId);
    console.log("quantity and type of quantity is ", quantity, typeof quantity);
    console.log("subId is and typeof subId is ", subId);

    // handle case 0 when user has free subscription and tries to addons for free
    const activeSubscription = await stripe.subscriptions.retrieve(subId);
    console.log(
      "activeSubscription is \n",
      JSON.stringify(activeSubscription, null, 2)
    );
    if (!activeSubscription) {
      throw new Error(`No subscription found with this id: ${subId}`);
    }
    console.log(
      "activeSubscription.items.data[0].id",
      activeSubscription.items.data[0].id
    );
    // case 0 if user has already in the free plan
    if (
      activeSubscription.items.data.length === 1 &&
      activeSubscription.items.data[0].plan.nickname === "free"
    ) {
      console.log("Entered in to the case 0 condition \n");
      const subscription = await stripe.subscriptions.update(subId, {
        items: [
          {
            id: activeSubscription.items.data[0].id,
          },
          {
            price: newPriceId,
            metadata: {
              subType: "add-ons",
            },
            quantity,
          },
        ],
        proration_behavior: "none",
      });
      return res.status(200).send({ message: "success", subscription });
    }

    const price = await stripe.prices.retrieve(newPriceId);
    const line_items = [
      {
        price_data: {
          currency: price.currency,
          unit_amount_decimal: price.unit_amount_decimal,
          product_data: {
            name: "Proration Add on product",
            description: "proration add on product charges",
            images: [],
            metadata: {
              subType: "add-ons",
            },
          },
        },
        quantity,
      },
    ];

    console.log("line_items", line_items);
    const metadata = {
      newPriceId,
      quantity,
      subId,
    };
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customerId,
      line_items,
      metadata,
      success_url: `https://6f9dpz0d-3000.inc1.devtunnels.ms/additional-credit-new/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel-additional-credit-new",
      invoice_creation: {
        enabled: true,
      },
    });
    console.log("session is \n", session);
    res.send({ url: session.url });
  } catch (e) {
    console.log(e);
  }
});

app.get("/additional-credit-new/success", async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { newPriceId, quantity, subId } = session.metadata;

    const subscription = await stripe.subscriptions.retrieve(subId);
    const addOnsOnCurrentSubscriptionID = subscription.items.data[0].id;
    console.log("subscription is \n", JSON.stringify(subscription, null, 2));
    const existingItem = subscription.items.data.find(
      (item) => item.price.id === newPriceId
    );
    console.log("existing item is \n", JSON.stringify(existingItem, null, 2));
    let updatedSubscription;
    if (existingItem) {
      // Update the quantity of the existing subscription item
      updatedSubscription = await stripe.subscriptions.update(subId, {
        items: [
          {
            id: newPriceId,
            quantity: existingItem.quantity + parseInt(quantity, 10),
          },
        ],
        proration_behavior: "none",
      });
      return res.status(200).send({ message: "success", updatedSubscription });
    } else {
      // Add a new subscription item
      console.log("Entered in to the else condition \n");
      // const updatedSubscription = await stripe.subscriptionItems.update(
      //   addOnsOnCurrentSubscriptionID,
      //   {
      //     price: newPriceId,
      //     quantity,
      //     proration_behavior: "none",
      //   }
      // );
      updatedSubscription = await stripe.subscriptions.update(subId, {
        items: [
          {
            price: newPriceId,
            quantity,
            metadata: {
              subType: "add-ons",
            },
          },
        ],
        proration_behavior: "none",
      });
      return res.status(200).send({ message: "success", updatedSubscription });
    }
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: e.message });
  }
});

app.get("/cancel-additional-credit-new", async (req, res) => {
  res.send({ message: "Error in the add new credit plan" });
});

app.post("/cancel-subscription", async (req, res) => {
  try {
    const { subId } = req.body;

    // const activeSubscription = await stripe.subscriptions.retrieve(subId);
    // let addOnsQuantity;
    // activeSubscription.items.data.map((item) => {
    //   if (item.metadata.subType === "add-ons") {
    //     addOnsQuantity = item.quantity;
    //   }
    // });

    // const items = addOnsQuantity ? [
    //   {
    //     price: newPriceId,
    //     quantity: 1,
    //   },
    //   {
    //     price: newAddOnPriceId,
    //     quantity: addOnsQuantity
    //   }
    // ] : [{
    //   price: newPriceId,
    //   quantity: 1,
    // }]
    const subscriptionSchedule = await stripe.subscriptionSchedules.create({
      from_subscription: subId,
    });

    console.log(
      "subscriptionSchedule is \n",
      JSON.stringify(subscriptionSchedule, null, 2)
    );

    const phases = subscriptionSchedule.phases.map((phase) => ({
      start_date: phase.start_date,
      end_date: phase.end_date,
      items: phase.items,
    }));

    const downgradeSubscription = await stripe.subscriptionSchedules.update(
      subscriptionSchedule.id,
      {
        end_behavior: "cancel",
        phases: [...phases],
      }
    );

    res.status(200).send({
      message: "create schedule for downgrade subscription successfully",
      downgradeSubscription,
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/ping", (req, res) => {
  res.json({ ping: "pong" });
});
app.get("/", (req, res) => {
  res.send("App is running");
});
app.listen(3000, (req, res, err) => {
  try {
    console.log("server is running on the port 3000");
  } catch (e) {
    throw new Error(e);
  }
});
