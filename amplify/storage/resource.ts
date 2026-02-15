import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "tradingJournalScreenshots",
  access: (allow) => ({
    "screenshots/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
