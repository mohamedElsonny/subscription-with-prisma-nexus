import { objectType } from "nexus";
import { exposeAllFields } from "../../helpers/exposeAllFields";

export const Task = objectType({
  name: "Task",
  definition(t) {
    exposeAllFields(t);
  },
});

export const TaskSubscriptionType = objectType({
  name: "TaskSubscriptionType",
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
      type: "Task",
    });
    t.nullable.field("old", {
      type: "Task",
    });
  },
});
