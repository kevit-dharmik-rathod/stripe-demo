require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
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
app.use(express.json());
app.use(cors(corsConfig));
app.use(express.urlencoded({ extended: true }));
//firstly we create the customer in the stripe
async function createCustomer(name, email) {
  try {
    //check user already created in the stripe itself
    if (!user.stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({ name, email });
      user.stripeCustomerId = stripeCustomer.id;
      return user;
    } else {
      return await stripe.customers.retrieve(user.stripeCustomerId);
    }
  } catch (e) {
    console.log(e);
  }
}

async function createCheckoutSession(customerEmail, cId, priceId) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: cId,
    customer_email: customerEmail,
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
  console.log("session is \n", session);
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
    console.log("Entered in to the create subscription route \n");
    const { name, email, priceId } = req.body;
    const customer = await createCustomer(name, email);
    const checkoutUrl = await createCheckoutSession(
      email,
      customer.id,
      priceId
    );
    res.send({ url: checkoutUrl });
  } catch (e) {
    console.log(e);
  }
});
// Endpoint to handle Stripe webhook events
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
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.sendStatus(400);
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );
        console.log("subscription is \n", subscription);
        const invoice = await stripe.invoices.retrieve(
          subscription.latest_invoice
        );
        console.log("Invoice is \n", invoice);

        // Save subscription and invoice details in your database
        console.log(`Subscription ID: ${subscription.id}`);
        console.log(`Invoice ID: ${invoice.id}`);
        console.log(
          `Subscription Start Date: ${new Date(
            subscription.current_period_start * 1000
          )}`
        );
        console.log(
          `Subscription End Date: ${new Date(
            subscription.current_period_end * 1000
          )}`
        );
        console.log(`Invoice Total: ${invoice.total}`);
        res.redirect("http://localhost:3000/success");
        break;
      case "checkout.session.async_payment_failed":
        // This event is triggered when a payment fails asynchronously after the checkout session is completed
        // Handle the failed payment and update your database or perform other actions
        // Redirect the user to a cancel or failure page
        res.redirect("http://localhost:3000/cancel");
        break;
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

app.get("/ping", (req, res) => {
  res.json({ ping: "pong" });
});
app.get("/", (req, res) => {
  res.send("App is running");
});
app.listen(3000, (req, res, err) => {
  try {
    console.log(`app listening on port 3000`);
  } catch (e) {
    console.log(`error in starting the application ${e}`);
  }
});
