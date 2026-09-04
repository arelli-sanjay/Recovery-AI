import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    totalSuccessfulPayments: {
      type: Number,
      default: 0,
    },

    totalFailedPayments: {
      type: Number,
      default: 0,
    },

    lifetimeValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", customerSchema);