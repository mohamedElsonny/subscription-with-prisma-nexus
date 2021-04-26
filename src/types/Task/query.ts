import { extendType } from "nexus";

export const TaskQuery = extendType({
  type: "Query",
  definition(t) {
    t.crud.task();
    t.crud.tasks({
      filtering: true,
      pagination: true,
    });
  },
});
