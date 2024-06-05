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
      ); // Replace with your webhook secret
    } catch (err) {
      return res.sendStatus(400);
    }

    switch (event.type) {
      case "checkout.session.completed":
        // const session = event.data.object;
        // const subscription = await stripe.subscriptions.retrieve(
        //   session.subscription
        // );
        // const invoice = await stripe.invoices.retrieve(
        //   subscription.latest_invoice
        // );
        break;
      case "checkout.session.async_payment_failed":
        break;
      // Handle other event types as needed
      default:
    }

    res.json({ received: true });
  }
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//firstly we create the customer in the stripe
async function createCustomer(name, email) {
  try {
    return await stripe.customers.create({ name, email });
  } catch (e) {
    throw new Error(err);
  }
}

async function createCheckoutSession(customerEmail, cId, priceId) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: cId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
  });
  return session.url;
}

app.get("/success", (req, res) => {
  res.status(200).send({ status: "Payment successfully" });
});

app.get("/cancel", (req, res) => {
  res.status(200).send({ status: "Payment Failed" });
});

app.post("/create-subscription", async (req, res) => {
  try {
    const { name, email, priceId } = req.body;
    const customer = await createCustomer(name, email);
    const checkoutUrl = await createCheckoutSession(
      email,
      customer.id,
      priceId
    );
    res.send({ url: checkoutUrl });
  } catch (e) {
    throw new Error(e);
  }
});
app.post("/upgrade-subscription", async (req, res) => {
  try {
    const { customerId, newPriceId } = req.body;

    // Get the current subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found for the customer.");
    }

    const subscription = subscriptions.data[0];
    // Get the current subscription item id for the preview the proration amount
    const subscriptionItemId = subscription.items.data[0].id;
    // Retrieve upcoming invoice to calculate proration
    const prorationDate = Math.floor(Date.now() / 1000);
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscription.id,
      subscription_items: [
        {
          id: subscriptionItemId,
          price: newPriceId, // Switch to new price
        },
      ],
      subscription_proration_date: prorationDate,
    });
    // Calculate the proration amount

    let prorationAmount;
    let line_items;
    let session;
    if (
      upcomingInvoice.lines.data.length === 1 &&
      upcomingInvoice.lines.data[0].proration === false
    ) {
      prorationAmount = upcomingInvoice.lines.data[0].amount;
      line_items = [
        {
          price: newPriceId, // Switch to new price
          quantity: 1,
        },
      ];
      // Create a Checkout Session for the immediate proration amount
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        line_items,

        // urls for hp
        success_url: `https://6f9dpz0d-3000.inc1.devtunnels.ms/upgrade-payment-success/success?customerId=${customerId}&subscriptionId=${subscription.id}&newPriceId=${newPriceId}&subscriptionItemId=${subscriptionItemId}`,
        cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",

        // urls for dell
        // success_url: `https://vbpflfwp-3000.inc1.devtunnels.ms/upgrade-payment-success/success?customerId=${customerId}&subscriptionId=${subscription.id}&newPriceId=${newPriceId}&subscriptionItemId=${subscriptionItemId}`,
        // cancel_url: "https://vbpflfwp-3000.inc1.devtunnels.ms/cancel",
      });
      res.send({ url: session.url });
    } else {
      prorationAmount = upcomingInvoice.lines.data
        .filter((line) => line.proration)
        .reduce((total, line) => total + line.amount, 0);

      line_items = [
        {
          price_data: {
            currency: subscription.currency,
            unit_amount_decimal: prorationAmount,
            product_data: {
              name: "Proration Product 1",
              description: "Proration Product 1",
              images: [],
            },
          },
          quantity: 1,
        },
      ];
      // Create a Checkout Session for the immediate proration amount
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer: customerId,
        line_items,
        // urls for hp
        success_url: `https://6f9dpz0d-3000.inc1.devtunnels.ms/upgrade-payment-success/success?customerId=${customerId}&subscriptionId=${subscription.id}&newPriceId=${newPriceId}&subscriptionItemId=${subscriptionItemId}`,
        cancel_url: "https://6f9dpz0d-3000.inc1.devtunnels.ms/cancel",

        // urls for dell
        // success_url: `https://vbpflfwp-3000.inc1.devtunnels.ms/upgrade-payment-success/success?customerId=${customerId}&subscriptionId=${subscription.id}&newPriceId=${newPriceId}&subscriptionItemId=${subscriptionItemId}`,
        // cancel_url: "https://vbpflfwp-3000.inc1.devtunnels.ms/cancel",
      });

      res.send({ url: session.url });
    }
    console.log("Total proration amount is", prorationAmount);
  } catch (e) {
    console.log("Error is \n", e);
    res.status(400).send({ error: e.message });
  }
});

app.get("/upgrade-payment-success/success", async (req, res) => {
  const { customerId, subscriptionId, newPriceId, subscriptionItemId } =
    req.query;
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscriptionItemId,
          deleted: true,
        },
        {
          price: newPriceId,
        },
      ],
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

app.post("/downgrade-subscription", async (req, res) => {
  try {
    const { customerId, newPriceId } = req.body;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found for the customer.");
    }

    const subscriptionId = subscriptions.data[0].id;
    console.log("subscriptionId is \n", subscriptionId);
    const oldPriceId = subscriptions.data[0].plan.id;
    console.log("oldPriceId is \n", oldPriceId);

    console.log("subId is \n", subscriptionId);
    const subscriptionSchedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });

    const downgradeSubscription = await stripe.subscriptionSchedules.create({
      customer: customerId,
      start_date: "now",
      end_behavior: "release",
      phases: [
        {
          items: [{ price: oldPriceId, quantity: 1 }],
          iterations: 1,
          proration_behavior: "none",
        },
        {
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
          // iterations: 1,
          proration_behavior: "none",
        },
      ],
    });

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
