/** Экспорт статьи в файлы. Работает в браузере без backend. */

function inlineToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const inner = Array.from(node.childNodes).map(inlineToMarkdown).join("");
  switch (node.tagName) {
    case "STRONG":
    case "B":
      return `**${inner}**`;
    case "EM":
    case "I":
      return `*${inner}*`;
    case "A":
      return `[${inner}](${node.getAttribute("href") ?? ""})`;
    case "BR":
      return "\n";
    default:
      return inner;
  }
}

export function htmlToMarkdown(title: string, html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  const blocks: string[] = [`# ${title}`];

  root.childNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const text = inlineToMarkdown(node).trim();
    switch (node.tagName) {
      case "H2":
        blocks.push(`## ${text}`);
        break;
      case "H3":
        blocks.push(`### ${text}`);
        break;
      case "UL":
        blocks.push(Array.from(node.children).map((li) => `- ${inlineToMarkdown(li).trim()}`).join("\n"));
        break;
      case "OL":
        blocks.push(Array.from(node.children).map((li, i) => `${i + 1}. ${inlineToMarkdown(li).trim()}`).join("\n"));
        break;
      case "BLOCKQUOTE":
        blocks.push(`> ${text}`);
        break;
      default:
        if (text) blocks.push(text);
    }
  });
  return blocks.join("\n\n") + "\n";
}

export function htmlDocument(title: string, html: string, description: string) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, "&quot;")}">
</head>
<body>
<article>
<h1>${title}</h1>
${html}
</article>
</body>
</html>
`;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
