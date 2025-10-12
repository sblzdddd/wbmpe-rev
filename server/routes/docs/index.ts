import { eventHandler } from "h3";

// Served as /_scalar
export default eventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event);
  const title = runtimeConfig.nitro.openAPI?.meta?.title || "API Reference";
  const description = runtimeConfig.nitro.openAPI?.meta?.description || "";
  const openAPIEndpoint = "/docs/openapi";

  // https://github.com/scalar/scalar
  const scalarConfig = {
    theme: "kepler",
    hideClientButton: true,
    title: "API #1",
    slug: "api-1",
    showSidebar: true,
    showToolbar: "never",
    operationTitleSource: "summary",
    _integration: "html",
    persistAuth: false,
    telemetry: true,
    layout: "modern",
    isEditable: false,
    isLoading: false,
    hideModels: false,
    documentDownloadType: "both",
    hideTestRequestButton: false,
    hideSearch: false,
    showOperationId: false,
    hideDarkModeToggle: false,
    withDefaultFonts: true,
    defaultOpenAllTags: false,
    expandAllModelSections: false,
    expandAllResponses: false,
    orderSchemaPropertiesBy: "alpha",
    orderRequiredPropertiesFirst: true,
    url: "/docs/openapi",
  };

  // The default page title

  return /* html */ `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="${description}" />
        <title>${title}</title>
      </head>
      <body>
        <script
          id="api-reference"
          data-configuration="${JSON.stringify(scalarConfig)
            .split('"')
            .join("&quot;")}"
        ></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>`;
});
defineRouteMeta({
  openAPI: {
    tags: ["Docs"],
    description: "scalar UI documentation for the BakaAPI",
    responses: {
      '200': {
        description: 'OK'
      }
    }
  }
})
