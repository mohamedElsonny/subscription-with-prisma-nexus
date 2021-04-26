import { extendType } from "nexus";

export const TaskMutations = extendType({
  type: "Mutation",
  definition(t) {
    t.crud.createOneTask();
    t.crud.updateOneTask();
    t.crud.deleteOneTask();
  },
});
