# API Documentation

This is an extension to the [api-docs](./../api-docs/README.md) plugin which is responsible for indexing the API specification content surfaced via the API tab of a catalog entity.

The plugin provides an `APIDocumentCollatorFactory` which is an implementation of the `DocumentCollatorFactory`. Once integrated into the search plugin, users will be able to search API specification content and navigate to the corresponding API definition.

![Search API Specs](./docs/api_search_example.png)

Right now, the following API formats are supported:

- [OpenAPI](https://swagger.io/specification/) 2 & 3

Other formats can be contributed to this plugin by implementing a `SpecParser` for the format you wish to add support for and adding it to the `SpecHandler`. You may use `OpenAPISpecParser` as an example.

## Getting Started

1. Follow the Guide On [Setting up Search in Backstage](./../../docs/features/search/getting-started.md)

2. Install the API docs backend plugin

```bash
# From your Backstage root directory
yarn add --cwd packages/app @backstage/plugin-search-backend-module-api-docs
```

3. Add a `APIDocumentCollatorFactory` to the IndexBuilder

```typescript
import { APIDocumentCollatorFactory } from '@backstage/plugin-search-backend-module-api-docs';
```

```typescript
indexBuilder.addCollator({
  schedule,
  factory: APIDocumentCollatorFactory.fromConfig(env.config, {
    discovery: env.discovery,
    tokenManager: env.tokenManager,
  }),
});
```

Congrats! You can now search the API specs registered in Backstage with the core search plugin.

If you would like to add a category to the main search page's (/search) Result Type Facet you may add a type with `value` set to `api-definition` to the
`<SearchType.Accordion>` components `types` prop:

```tsx
<SearchType.Accordion
  name="Result Type"
  defaultValue="software-catalog"
  types={[
    {
      value: 'software-catalog',
      name: 'Software Catalog',
      icon: <CatalogIcon />,
    },
    {
      value: 'techdocs',
      name: 'Documentation',
      icon: <DocsIcon />,
    },
    {
      value: 'api-definition',
      name: 'APIs',
      icon: <ExtensionIcon />,
    },
  ]}
/>
```

![API Search Full Page](./docs/api_search_full.png)
