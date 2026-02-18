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
      timestamp: a.datetime().required(),
      weekly: a.string(),
      weeklyScreenshot: a.string(),
      weeklySentiment: a.string(),
      daily: a.string(),
      dailyScreenshot: a.string(),
      dailySentiment: a.string(),
      fourHr: a.string(),
      fourHrScreenshot: a.string(),
      fourHrSentiment: a.string(),
      oneHr: a.string(),
      oneHrScreenshot: a.string(),
      oneHrSentiment: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  PairSettings: a
    .model({
      pairId: a.string().required(),
      flag: a.string(),
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
