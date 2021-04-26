import { CreateSubscription } from "pg-trigger-generator";

import { subscriptionField } from "nexus";

import { TODO_INSERT, TODO_UPDATE, TODO_DELETE } from "../../channels";
import { Context, pubsub } from "../../context";

export const TodoCreated = subscriptionField("todoSubscription", {
  type: "TodoSubscriptionType",
  subscribe: (root, args, ctx: Context) => ctx.pubsub.asyncIterator([TODO_INSERT, TODO_UPDATE, TODO_DELETE]),
  resolve: (payload) => payload,
});

const todoClient = new CreateSubscription(process.env.DATABASE_URL);

todoClient.createListeners(["Todo"]);

todoClient.recieveEvents((payload) => {
  const channel = `${payload.table_name.toUpperCase()}_${payload.operation}`;
  pubsub.publish(channel, payload);
});
