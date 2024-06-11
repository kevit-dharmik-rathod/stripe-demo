const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")("YOUR_STRIPE_SECRET_KEY"); // Replace with your Stripe secret key

const app = express();
app.use(bodyParser.json());

// Create a new customer
app.post("/create-customer", async (req, res) => {
  const { email } = req.body;
  const customer = await stripe.customers.create({
    email,
  });
  res.send({ customerId: customer.id });
});

// Attach a payment method
app.post("/attach-payment-method", async (req, res) => {
  const { paymentMethodId, customerId } = req.body;
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
  res.send({ success: true });
});

// Create a PaymentIntent
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency, customerId } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    setup_future_usage: "off_session",
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});

// Create a SetupIntent for future off-session payments
app.post("/create-setup-intent", async (req, res) => {
  const { customerId } = req.body;
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
  });
  res.send({ clientSecret: setupIntent.client_secret });
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
