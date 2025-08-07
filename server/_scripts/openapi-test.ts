import { createDocument } from "zod-openapi";
import { loginSchema } from "../../shared/validators/auth";

const doc = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Test",
    version: "1.0.0",
    description: "Test",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
      variables: {},
    },
  ],
  paths: {},
  components: {
    schemas: {
      loginSchema,
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
});

console.log(JSON.stringify(doc, null, 2));