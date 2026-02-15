import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "tradingJournalScreenshots",
  access: (allow) => ({
    "screenshots/*": [
      allow.guest.to(["read", "write", "delete"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
