/* eslint-disable @typescript-eslint/no-explicit-any */
import { type HTTPMethod, eventHandler, getRequestURL } from "h3";
import type {
  OpenAPI3,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
} from "openapi-typescript";
import { joinURL } from "ufo";
import { defu } from "defu";
// @ts-expect-error Nitro internal virtual file
import { handlersMeta } from "#nitro-internal-virtual/server-handlers-meta";
import { createDocument, type ZodOpenApiParameterObject, type ZodOpenApiSchemaObject } from "zod-openapi";
import type { z } from "zod";

const logger = BakaLogger.child({
  service: "openapi",
});

/**
 * Dynamically import all Zod schemas from the validators directory
 */
async function getAllValidatorSchemas(): Promise<{
  schemas: Record<string, ZodOpenApiSchemaObject>;
  parameters: Record<string, ZodOpenApiParameterObject>;
}> {
  const schemas: Record<string, ZodOpenApiSchemaObject> = {};
  const parameters: Record<string, ZodOpenApiParameterObject> = {};
  
  try {
    // Import all validator modules directly
    const validatorModules = [
      () => import("../../../shared/validators/common"),
      () => import("../../../shared/validators/auth"),
      () => import("../../../shared/validators/playlist"),
      () => import("../../../shared/validators/queue"),
      () => import("../../../shared/validators/register"),
      () => import("../../../shared/validators/search"),
    ];

    // Import each validator file and extract Zod schemas
    for (const importFn of validatorModules) {
      try {
        const module = await importFn();
        
        // Extract all exported schemas that are Zod objects
        for (const [exportName, exportValue] of Object.entries(module)) {
          if(!exportValue) continue;
          let zodSchema: z.ZodSchema;
          if (typeof exportValue === 'object' && '_def' in exportValue && exportValue._def) {
            zodSchema = exportValue as z.ZodSchema;
          } else if (typeof exportValue === 'function' && exportName.endsWith('Schema')) {
            zodSchema = exportValue() as z.ZodSchema;
          } else continue;
          if (exportName.endsWith('Request') || exportName.endsWith('Response') || exportName.endsWith('Schema')) {
            schemas[exportName] = zodSchema;
          } else if (exportName.endsWith('Param')) {
            parameters[exportName] = zodSchema;
          }
        }
      } catch (error) {
        console.warn(`Failed to import validator module:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to scan validator schemas:", error);
  }

  return { schemas, parameters };
}

export default eventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);

  const base = runtimeConfig.app?.baseURL;
  const url = joinURL(getRequestURL(event).origin, base);

  const meta = {
    title: "Nitro Server Routes",
    ...runtimeConfig.nitro?.openAPI?.meta,
  };

  // const { paths, globals } = getHandlersMeta();
  const { paths } = getHandlersMeta();

  // Get all validator schemas dynamically
  const { schemas, parameters } = await getAllValidatorSchemas();
  logger.info(`Discovered ${Object.keys(schemas).length} schemas`);
  logger.info(`Discovered ${Object.keys(parameters).length} parameters`);

  const zodApiDoc = createDocument({
    openapi: "3.1.0",
    info: {
      title: meta?.title,
      version: meta?.version || "1.0.0",
      description: meta?.description,
    },
    servers: [
      {
        url,
        description: "Local Development Server",
        variables: {},
      },
    ],
    paths: {},
    components: {
      schemas,
      parameters,
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  });
  (zodApiDoc as any).paths = paths;
  return zodApiDoc;
});

type OpenAPIGlobals = Pick<OpenAPI3, "components">;

function getHandlersMeta(): {
  paths: PathsObject;
  globals: OpenAPIGlobals;
} {
  const paths: PathsObject = {};
  let globals: OpenAPIGlobals = {
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  };

  for (const h of handlersMeta) {
    // const { route, parameters } = normalizeRoute(h.route || "");
    if(h.route?.startsWith('/_')) continue
    const { route } = normalizeRoute(h.route || "");
    const tags = defaultTags(h.route || "");
    const method = (h.method || "get").toLowerCase() as Lowercase<HTTPMethod>;
    const { $global, ...openAPI } = h.meta?.openAPI || {};

    const item: PathItemObject = {
      [method]: <OperationObject>{
        tags,
        // parameters,
        responses: {
          200: { description: "OK" },
        },
        // ...defu(openAPI, { parameters }),
        ...defu(openAPI),
      },
    };

    if ($global) {
      // TODO: Warn on conflicting global definitions?
      globals = defu($global, globals);
    }

    if (paths[route] === undefined) {
      paths[route] = item;
    } else {
      Object.assign(paths[route], item);
    }
  }

  return { paths, globals };
}

function normalizeRoute(_route: string) {
  const parameters: ParameterObject[] = [];

  let anonymousCtr = 0;
  const route = _route
    .replace(/:(\w+)/g, (_, name) => `{${name}}`)
    .replace(/\/(\*)\//g, () => `/{param${++anonymousCtr}}/`)
    .replace(/\*\*{/, "{")
    .replace(/\/(\*\*)$/g, () => `/{*param${++anonymousCtr}}`);

  const paramMatches = route.matchAll(/{(\*?\w+)}/g);
  for (const match of paramMatches) {
    const name = match[1];
    if (!parameters.some((p) => p.name === name)) {
      parameters.push({
        name,
        in: "path",
        required: true,
        schema: { type: "string" },
      });
    }
  }

  return {
    route,
    parameters,
  };
}

function defaultTags(route: string) {
  const tags: string[] = [];

  if (route.startsWith("/api/")) {
    tags.push("API Routes");
  } else if (route.startsWith("/_")) {
    tags.push("Internal");
  } else {
    tags.push("App Routes");
  }

  return tags;
}


defineRouteMeta({
  openAPI: {
    tags: ["Docs"],
    description: "openapi.json for the BakaAPI",
    responses: {
      '200': {
        description: 'OK'
      }
    }
  }
})
