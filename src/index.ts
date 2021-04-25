import { ApolloServer, gql } from 'apollo-server'

import { nexusPrisma } from 'nexus-plugin-prisma'

import { enumType, makeSchema, objectType, subscriptionField } from 'nexus'

import * as path from 'path'

import { ObjectDefinitionBlock } from 'nexus/dist/blocks'

import { Context, createContext, pubsub } from './context'
import { CreateSubscription, IEventPayload } from './listiningToPGEvents'

import { Todo } from '.prisma/client'
import { TODO_INSERT, TODO_UPDATE, TODO_DELETE, TASK_INSERT, TASK_UPDATE, TASK_DELETE } from './channels'

export const exposeAllFields = <T extends string>(
  t: ObjectDefinitionBlock<T>,
  // eslint-disable-next-line prettier/prettier
  { except = [] }: { except?: (keyof ObjectDefinitionBlock<T>['model'])[] } = {}
): void => {
  Object.entries(t.model)
    .filter(([fieldName]) => !(fieldName in except))
    .forEach(([, expose]) => expose())
}

const Todo = objectType({
  name: 'Todo',
  definition(t) {
    exposeAllFields(t)
  }
})

const Task = objectType({
  name: 'Task',
  definition(t) {
    exposeAllFields(t)
  }
})

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.crud.todo()
    t.crud.todos({
      filtering: true,
      pagination: true
    })
  }
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.crud.createOneTask()
    t.crud.createOneTodo()
    t.crud.updateOneTodo()
    t.crud.deleteOneTodo()
    t.crud.updateManyTask()
  }
})

const operationEnum = enumType({
  name: 'OperationsTypeEnum',
  members: ['INSERT', 'UPDATE', 'DELETE']
})

const whenEnum = enumType({
  name: 'WhenTypeEnum',
  members: ['BEFORE', 'AFTER']
})

const TodoSubscriptionType = objectType({
  name: 'TodoSubscriptionType',
  definition(t) {
    t.field('table_name', {
      type: 'String'
    })
    t.field('operation', {
      type: 'OperationsTypeEnum'
    })
    t.field('when', {
      type: 'WhenTypeEnum'
    })
    t.nullable.field('new', {
      type: 'Todo'
    })
    t.nullable.field('old', {
      type: 'Todo'
    })
  }
})

const TaskSubscriptionType = objectType({
  name: 'TaskSubscriptionType',
  definition(t) {
    t.field('table_name', {
      type: 'String'
    })
    t.field('operation', {
      type: 'OperationsTypeEnum'
    })
    t.field('when', {
      type: 'WhenTypeEnum'
    })
    t.nullable.field('new', {
      type: 'Task'
    })
    t.nullable.field('old', {
      type: 'Task'
    })
  }
})

const TodoCreated = subscriptionField('todoSubscription', {
  type: 'TodoSubscriptionType',
  subscribe: (root, args, ctx: Context) => ctx.pubsub.asyncIterator([TODO_INSERT, TODO_UPDATE, TODO_DELETE]),
  resolve: (payload) => payload
})

const TaskCreated = subscriptionField('taskSubscription', {
  type: 'TaskSubscriptionType',
  subscribe: (root, args, ctx: Context) => ctx.pubsub.asyncIterator([TASK_INSERT, TASK_UPDATE, TASK_DELETE]),
  resolve: (payload) => payload
})

const subscriptionClient = new CreateSubscription(process.env.DATABASE_URL)

subscriptionClient.createListeners(['Todo', 'Task'])
subscriptionClient.recieveEvents((payload) => {
  const channel = `${payload.table_name.toUpperCase()}_${payload.operation}`
  pubsub.publish(channel, payload)
})

const schema = makeSchema({
  types: [
    Query,
    Todo,
    Task,
    Mutation,
    TodoCreated,
    TaskSubscriptionType,
    operationEnum,
    whenEnum,
    TaskCreated,
    TodoSubscriptionType
  ],
  plugins: [nexusPrisma({ experimentalCRUD: true })],
  outputs: {
    typegen: path.join(process.cwd(), 'src/nexus-typegen.ts'),
    schema: path.join(process.cwd(), 'src/schema.graphql')
  }
})

const server = new ApolloServer({ schema, context: createContext })

const port = process.env.PORT || 5155

subscriptionClient.recieveEvents((payload) => {
  const channel = `${payload.table_name.toUpperCase()}_${payload.operation}`
  pubsub.publish(channel, payload)
})

server.listen(port).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
