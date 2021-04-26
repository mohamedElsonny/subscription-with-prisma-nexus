import { subscriptionField } from "nexus";

import { CreateSubscription } from "pg-trigger-generator";

import { TASK_INSERT, TASK_UPDATE, TASK_DELETE } from "../../channels";
import { Context, pubsub } from "../../context";

export const TaskCreated = subscriptionField("taskSubscription", {
  type: "TaskSubscriptionType",
  subscribe: (root, args, ctx: Context) => ctx.pubsub.asyncIterator([TASK_INSERT, TASK_UPDATE, TASK_DELETE]),
  resolve: (payload) => payload,
});

const taskClient = new CreateSubscription(process.env.DATABASE_URL);

taskClient.createListeners(["Task"]);

taskClient.recieveEvents((payload) => {
  console.log("Triggered");
  const channel = `${payload.table_name.toUpperCase()}_${payload.operation}`;
  pubsub.publish(channel, payload);
});
