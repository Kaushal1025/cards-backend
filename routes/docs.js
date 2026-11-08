const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/**
 * Handler to serve raw OpenAPI YAML specification
 */
const serveOpenApiSpec = (req, res) => {
  const specPath = path.join(__dirname, '..', 'openapi.yaml');
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(fs.readFileSync(specPath, 'utf8'));
  } else {
    res.status(404).json({ error: 'OpenAPI spec file not found' });
  }
};

// GET /api/docs/openapi.yaml
router.get('/openapi.yaml', serveOpenApiSpec);

// GET /api/docs - Interactive Swagger UI documentation page
router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CardsDB API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/openapi.yaml",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ]
      });
    };
  </script>
</body>
</html>`);
});

module.exports = router;
