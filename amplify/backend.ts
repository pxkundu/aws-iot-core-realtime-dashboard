import { defineBackend } from "@aws-amplify/backend";
import { myAuth } from "./auth/resource";

export const backend = defineBackend({
  auth: myAuth,
}); 