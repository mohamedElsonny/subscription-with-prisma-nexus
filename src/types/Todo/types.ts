import { objectType } from "nexus";
import { exposeAllFields } from "../../helpers/exposeAllFields";

export const Todo = objectType({
  name: "Todo",
  definition(t) {
    exposeAllFields(t);
  },
});

export const TodoSubscriptionType = objectType({
  name: "TodoSubscriptionType",
  definition(t) {
    t.field("table_name", {
      type: "String",
    });
    t.field("operation", {
      type: "OperationsTypeEnum",
    });
    t.field("when", {
      type: "WhenTypeEnum",
    });
    t.nullable.field("new", {
      type: "Todo",
    });
    t.nullable.field("old", {
      type: "Todo",
    });
  },
});
