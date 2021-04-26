import { extendType } from "nexus";

export const TodoMutations = extendType({
  type: "Mutation",
  definition(t) {
    t.crud.createOneTodo();
    t.crud.updateOneTodo();
    t.crud.deleteOneTodo();
  },
});
