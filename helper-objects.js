const user = {
  _id: "USER1",
  stripeCustomerId: null,
  name: "jack ryan",
  email: "jack@yopmail.com",
  activeProjectId: "project-1",
};

const project = {
  _id: "PROJ1",
  userId: "USER1",
  planId: null,
};

const freePlan = {
  productId: "prod_QC8hkVpHzapSX5",
  priceId: "price_1PLkQ3SGVFR9zdBL4boNmkmF",
};

const basicPlan = {
  productId: "prod_QC8irL0zmoaRJD",
  priceId: "price_1PLkRPSGVFR9zdBLL1rqX7xv",
};

const standardPlan = {
  productId: "prod_QC8k3EWuZ6eaNA",
  priceId: "price_1PLkSxSGVFR9zdBLGMxhk0mz",
};

const premiumPlan = {
  productId: "prod_QC8oRNPrJtQgGA",
  priceId: "price_1PLkWiSGVFR9zdBLHNwooydk",
};

module.exports = {
  user,
  project,
  freePlan,
  basicPlan,
  standardPlan,
  premiumPlan,
};
