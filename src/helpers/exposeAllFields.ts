import { ObjectDefinitionBlock } from "nexus/dist/blocks";

export const exposeAllFields = <T extends string>(
  t: ObjectDefinitionBlock<T>,
  // eslint-disable-next-line prettier/prettier
  { except = [] }: { except?: (keyof ObjectDefinitionBlock<T>["model"])[] } = {}
): void => {
  Object.entries(t.model)
    .filter(([fieldName]) => !(fieldName in except))
    .forEach(([, expose]) => expose());
};
