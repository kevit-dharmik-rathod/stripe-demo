import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: {
    type: Schema.Types.String,
    required: true,
  },
  email: {
    type: Schema.Types.String,
    required: true,
  },
  activeProjectId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
});

export const User = model("User", userSchema);
