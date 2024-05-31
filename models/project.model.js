import { Schema, model } from "mongoose";

const projectSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: ModelEnum.USER,
  },
  name: {
    type: Schema.Types.String,
    ref: "User",
    required: true,
  },
  planId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  subscriptionId: {
    type: Schema.Types.String,
    default: null,
  },
  invoiceId: {
    type: Schema.Types.String,
  },
});

export const Project = model("Project", projectSchema);
