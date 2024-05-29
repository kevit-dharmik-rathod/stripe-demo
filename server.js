require("dotenv").config();
const express = require("express");
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//step 1 create product with the particular price we already done with the stripe dashboard
async function accessProduct(pId) {
  try {
    const result = await stripe.products.retrieve(pId);
    return result;
  } catch (e) {
    console.log(e);
  }
}

app.get("/getProductDetails", async (req, res) => {
  const result = await accessProduct(freePlan.productId);
  console.log("result is \n", result);
  const price = await await stripe.prices.retrieve(result.default_price);
  res.status(200).send({ result, price });
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
