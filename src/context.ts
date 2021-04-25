import { PrismaClient } from "@prisma/client";

import { PubSub } from "graphql-subscriptions";

import { Request } from "express";

const prisma = new PrismaClient();

export interface Context {
  request: Request;
  prisma: PrismaClient;
  pubsub: PubSub;
}

export const pubsub = new PubSub();

export function createContext(request: Request): Context {
  return {
    request,
    prisma,
    pubsub,
  };
}
