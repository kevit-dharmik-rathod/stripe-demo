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

async function getCurrentSubscription(customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });
    console.log('Current subscription is \n', subscriptions);
    if (subscriptions.data.length === 0) {
      throw new Error('No active subscriptions found for the customer.');
    }

    return subscriptions.data[0];
  } catch (e) {
    throw new Error(`error in the getCurrentSubscription: ${e}`);
  }
}

async function getUpcomingInvoice(customerId, subscriptionId, newPriceId, prorationDate) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Subscription is in the getUpcomingInvoice is \n', subscription);
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
      subscription_items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      subscription_proration_date: prorationDate,
    });
    console.log('upcomingInvoice in the getUpcomingInvoice is \n', upcomingInvoice);
    return upcomingInvoice;
  } catch (e) {
    throw new Error(`Error in the getUpcomingInvoice: ${e}`);
  }
}

async function upgradeSubscriptionCheckOutSession(customerId, amountDue) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Proration Charge On upgradation',
            },
            unit_amount: amountDue,
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });

    return session.url;
  } catch (e) {
    throw new Error(`Error in the upgradeSubscriptionCheckoutSession: ${e}`);
  }
}

// Update the subscription to the new plan
async function updateSubscription(subscriptionId, newPriceId, prorationBehavior) {
  try {
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: prorationBehavior,
    });
    return updatedSubscription;
  } catch (e) {
    throw new Error(`Error in the updateSubscription : ${e}`);
  }
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


app.post('/upgrade-subscription', async (req, res) => {
  try {
    const { customerId, newPriceId } = req.body;

    // Get the current subscription
    const currentSubscription = await getCurrentSubscription(customerId);

    // Set proration date to the current moment
    const prorationDate = Math.floor(Date.now() / 1000);

    // Get the upcoming invoice to calculate proration
    const upcomingInvoice = await getUpcomingInvoice(customerId, currentSubscription.id, newPriceId, prorationDate);

    // Get the proration amount from the upcoming invoice
    const prorationAmount = upcomingInvoice.total;

    // Create a Checkout Session for the proration amount
    const checkoutUrl = await upgradeSubscriptionCheckOutSession(customerId, prorationAmount);

    // Update the subscription to the new plan
    await updateSubscription(currentSubscription.id, newPriceId, 'none');

    res.send({ url: checkoutUrl });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});
// Endpoint to handle Stripe webhook events

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
