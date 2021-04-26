import { extendType } from "nexus";

export const TodoQueries = extendType({
  type: "Query",
  definition(t) {
    t.crud.todo();
    t.crud.todos({
      filtering: true,
      pagination: true,
    });
  },
});
