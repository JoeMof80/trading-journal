import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Trade: a
    .model({
      symbol: a.string().required(),
      price: a.float().required(),
      quantity: a.float().required(),
      side: a.string().required(),
      type: a.string().required(),
      timeframe: a.string(),
      stopLoss: a.float().required(),
      takeProfit: a.float().required(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PreTradeAnalysis: a
    .model({
      pairId: a.string().required(),
      date: a.date().required(),
      weekly: a.string(),
      daily: a.string(),
      fourHr: a.string(),
      oneHr: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
