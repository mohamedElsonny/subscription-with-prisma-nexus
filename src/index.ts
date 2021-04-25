import { ApolloServer, gql } from "apollo-server";

import { nexusPrisma } from "nexus-plugin-prisma";

import { enumType, makeSchema, objectType, subscriptionField } from "nexus";

import * as path from "path";

import { ObjectDefinitionBlock } from "nexus/dist/blocks";

import { Context, createContext, pubsub } from "./context";
import { createSubscribers } from "./listiningToPGEvents";

import { Todo } from ".prisma/client";
import { TODO_INSERT, TODO_UPDATE, TODO_DELETE } from "./channels";

export const exposeAllFields = <T extends string>(
  t: ObjectDefinitionBlock<T>,
  // eslint-disable-next-line prettier/prettier
  { except = [] }: { except?: (keyof ObjectDefinitionBlock<T>["model"])[] } = {}
): void => {
  Object.entries(t.model)
    .filter(([fieldName]) => !(fieldName in except))
    .forEach(([, expose]) => expose());
};

const Todo = objectType({
  name: "Todo",
  definition(t) {
    exposeAllFields(t);
  },
});

const Task = objectType({
  name: "Task",
  definition(t) {
    exposeAllFields(t);
  },
});

const Query = objectType({
  name: "Query",
  definition(t) {
    t.crud.todo();
    t.crud.todos({
      filtering: true,
      pagination: true,
    });
  },
});

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.crud.createOneTask();
    t.crud.createOneTodo();
    t.crud.updateOneTodo();
    t.crud.deleteOneTodo();
    t.crud.updateManyTask();
  },
});

const TodoSubscriptionType = objectType({
  name: "TodoSubscriptionType",
  definition(t) {
    t.field("table", {
      type: "String",
    });
    t.field("operation", {
      type: enumType({
        name: "OperationsTypeEnum",
        members: ["INSERT", "UPDATE", "DELETE"],
      }),
    });
    t.nullable.field("new", {
      type: "Todo",
    });
    t.nullable.field("old", {
      type: "Todo",
    });
  },
});

const TodoCreated = subscriptionField("todoSubscription", {
  type: "TodoSubscriptionType",
  subscribe: (root, args, ctx: Context) => ctx.pubsub.asyncIterator([TODO_INSERT, TODO_UPDATE, TODO_DELETE]),
  resolve: (payload) => payload,
});

createSubscribers(["Todo", "Task"], (payload) => {
  const channel = `${payload.table.toUpperCase()}_${payload.operation}`;
  pubsub.publish(channel, payload);
});

const schema = makeSchema({
  types: [Query, Todo, Task, Mutation, TodoCreated, TodoSubscriptionType],
  plugins: [nexusPrisma({ experimentalCRUD: true })],
  outputs: {
    typegen: path.join(process.cwd(), "src/nexus-typegen.ts"),
    schema: path.join(process.cwd(), "src/schema.graphql"),
  },
});

const server = new ApolloServer({ schema, context: createContext });

const port = process.env.PORT || 5155;

server.listen(port).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
