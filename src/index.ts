import { ApolloServer } from "apollo-server";

import { nexusPrisma } from "nexus-plugin-prisma";

import { makeSchema } from "nexus";
import * as types from "./types";

import * as path from "path";

import { createContext } from "./context";

const schema = makeSchema({
  types,
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
