import { enumType, objectType } from 'nexus';

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("dummyQuery", {
      type: "String",
      resolve: () => "dummyQuery",
    });
  },
});

export const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("dummyMutation", {
      type: "String",
      resolve: () => "dummyMutation",
    });
  },
});


export const operationEnum = enumType({
  name: "OperationsTypeEnum",
  members: ["INSERT", "UPDATE", "DELETE"],
});

export const whenEnum = enumType({
  name: "WhenTypeEnum",
  members: ["BEFORE", "AFTER"],
});
