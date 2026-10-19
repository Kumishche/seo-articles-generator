#!/bin/sh
# Собирает openapi.html из openapi.yaml: спецификация встраивается в страницу, Redoc грузится с CDN.
cd "$(dirname "$0")"
{
cat <<'HEAD'
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SEO Article AI API</title>
<style>body{margin:0;background:#fff}</style>
</head>
<body>
<div id="redoc"></div>
<script type="text/yaml" id="spec">
HEAD
cat openapi.yaml
cat <<'TAIL'
</script>
<script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script>
<script>
  var spec = jsyaml.load(document.getElementById("spec").textContent);
  Redoc.init(spec, {
    hideDownloadButton: false,
    expandResponses: "200,201,202",
    jsonSampleExpandLevel: 3,
    theme: { colors: { primary: { main: "#4f46e5" } }, typography: { fontFamily: "system-ui, sans-serif", headings: { fontFamily: "system-ui, sans-serif" } } }
  }, document.getElementById("redoc"));
</script>
</body>
</html>
TAIL
} > openapi.html
