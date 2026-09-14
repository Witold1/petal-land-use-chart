/** Download the chart poster as .svg or .png (2×), matching khans / reign-arcs. */

const EXPORT_FAIL = "Could not save PNG. Try SVG instead.";
const EXPORT_WIDTH = 1180;
const EXPORT_PIXEL_RATIO = 2;
const CANVAS_MAX_AREA = 16777216;
const CANVAS_MAX_SIDE = 4096;
const SOURCE_REPO_URL = "https://github.com/Witold1/petal-land-use-chart";
const SOURCE_REPO_LABEL = "petal-land-use-chart";

const DOWNLOAD_ICON =
  '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M8 2v8.2M5.2 7.5 8 10.3l2.8-2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M3 12.5h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  "</svg>";

let htmlToImage = null;

async function loadHtmlToImage() {
  if (htmlToImage) return htmlToImage;
  htmlToImage = await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm");
  return htmlToImage;
}

function pageBackground() {
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--face").trim() || "#f9ede2"
  );
}

function fileTimestamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `-${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`
  );
}

function slugify(title) {
  const slug = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "land-use-petal-chart";
}

function exportFilename(ext) {
  const title = document.querySelector("#chart-title")?.textContent?.trim() || "land-use-petal-chart";
  return `${slugify(title)}-${fileTimestamp()}.${ext}`;
}

function isAppleTouch() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isSafariFamily() {
  const ua = navigator.userAgent;
  if (isAppleTouch()) return true;
  return /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Android/i.test(ua);
}

function exportPixelRatio(width, height) {
  const areaCap = Math.sqrt(CANVAS_MAX_AREA / Math.max(1, width * height));
  const sideCap = Math.min(CANVAS_MAX_SIDE / width, CANVAS_MAX_SIDE / height);
  return Math.max(1, Math.min(EXPORT_PIXEL_RATIO, areaCap, sideCap));
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(",");
  const isBase64 = /;base64/i.test(header);
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  if (!isBase64) {
    return new Blob([decodeURIComponent(data)], { type: mime });
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function downloadViaAnchor(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
}

async function deliverFile(blob, filename) {
  const type = blob.type || "application/octet-stream";
  const file = new File([blob], filename, { type });
  const url = URL.createObjectURL(blob);

  try {
    if (isAppleTouch() && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    downloadViaAnchor(url, filename);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function exportFilter(node) {
  if (!(node instanceof Element)) return true;
  if (
    node.classList.contains("controls") ||
    node.classList.contains("export-tools") ||
    node.classList.contains("footer-export") ||
    node.classList.contains("footer-source") ||
    node.id === "tooltip" ||
    node.id === "readout" ||
    node.id === "error"
  ) {
    return false;
  }
  return true;
}

/** Keep ring % labels in SVG user units — html-to-image otherwise inlines computed px. */
function preserveGridLabelSizes(clonedDoc) {
  clonedDoc.querySelectorAll(".grid-label").forEach((el) => {
    el.style.removeProperty("font-size");
  });
}

function lockExportRootType(doc) {
  const root = doc.documentElement;
  const body = doc.body;
  if (root) {
    root.style.fontSize = "16px";
    root.style.webkitTextSizeAdjust = "100%";
    root.style.textSizeAdjust = "100%";
  }
  if (body) {
    body.classList.add("is-exporting");
    body.style.fontSize = "18px";
    body.style.webkitTextSizeAdjust = "100%";
    body.style.textSizeAdjust = "100%";
    body.style.padding = "0";
  }
}

function prepareLiveExportDom() {
  document.querySelector(".page")?.classList.add("is-export-capture");
  document.querySelector("#chart")?.classList.remove("is-filtered");
  document.querySelectorAll(".petal.is-active").forEach((el) => {
    el.classList.remove("is-active");
  });
  const scroll = document.querySelector(".chart-scroll");
  if (scroll) scroll.style.overflow = "visible";
}

function restoreLiveExportDom() {
  document.querySelector(".page")?.classList.remove("is-export-capture");
  const scroll = document.querySelector(".chart-scroll");
  if (scroll) scroll.style.overflow = "";
}

async function withExportLayout(fn) {
  const tip = document.getElementById("tooltip");
  if (tip) tip.hidden = true;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  document.body.classList.add("is-exporting");
  lockExportRootType(document);
  window.scrollTo(0, 0);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    prepareLiveExportDom();
    return await fn();
  } finally {
    restoreLiveExportDom();
    document.body.classList.remove("is-exporting");
    document.documentElement.style.fontSize = "";
    document.documentElement.style.webkitTextSizeAdjust = "";
    document.documentElement.style.textSizeAdjust = "";
    document.body.style.fontSize = "";
    document.body.style.webkitTextSizeAdjust = "";
    document.body.style.textSizeAdjust = "";
    document.body.style.padding = "";
    window.scrollTo(scrollX, scrollY);
  }
}

function captureOptions(poster) {
  const width = EXPORT_WIDTH;
  const height = Math.ceil(poster.scrollHeight);
  const pixelRatio = exportPixelRatio(width, height);

  return {
    filter: exportFilter,
    width,
    height,
    pixelRatio,
    cacheBust: true,
    backgroundColor: pageBackground(),
    onclone: (_doc, node) => {
      const doc = node?.ownerDocument || _doc;
      preserveGridLabelSizes(doc);
    },
    style: {
      margin: "0",
      transform: "none",
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: `${width}px`,
      overflow: "visible",
      fontSize: "18px",
      webkitTextSizeAdjust: "100%",
      textSizeAdjust: "100%",
    },
  };
}

async function captureUntilStable(run, maxPasses = 3) {
  let best = await run();
  if (!isSafariFamily()) return best;

  for (let i = 1; i < maxPasses; i++) {
    const next = await run();
    const bestScore = typeof best === "string" ? best.length : best?.size || 0;
    const nextScore = typeof next === "string" ? next.length : next?.size || 0;
    if (nextScore > bestScore) best = next;
    if (nextScore === bestScore && nextScore > 1000) return best;
  }
  return best;
}

function exportRoot() {
  const poster = document.querySelector(".page");
  if (!poster) throw new Error("Chart page not found");
  return poster;
}

async function saveSvg() {
  const { toSvg } = await loadHtmlToImage();
  const dataUrl = await withExportLayout(async () => {
    const poster = exportRoot();
    const options = captureOptions(poster);
    return captureUntilStable(() => toSvg(poster, options));
  });
  await deliverFile(dataUrlToBlob(dataUrl), exportFilename("svg"));
}

async function savePng() {
  const { toBlob, toPng } = await loadHtmlToImage();
  const blob = await withExportLayout(async () => {
    const poster = exportRoot();
    const options = captureOptions(poster);

    if (typeof toBlob === "function") {
      const result = await captureUntilStable(() => toBlob(poster, options));
      if (result && result.size > 1000) return result;
    }

    const dataUrl = await captureUntilStable(() => toPng(poster, options));
    return dataUrlToBlob(dataUrl);
  });

  if (!blob || blob.size < 1000) throw new Error("Empty PNG capture");
  await deliverFile(blob, exportFilename("png"));
}

function makeExportTools() {
  const tools = document.createElement("div");
  tools.className = "export-tools";
  tools.id = "export-tools";
  tools.setAttribute("role", "group");
  tools.setAttribute("aria-label", "Download chart");

  const icon = document.createElement("span");
  icon.className = "export-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = DOWNLOAD_ICON;

  const prefix = document.createElement("span");
  prefix.className = "export-prefix";
  prefix.textContent = "Save image: ";

  const svgBtn = document.createElement("button");
  svgBtn.type = "button";
  svgBtn.textContent = "SVG";
  svgBtn.title = "Save SVG";
  svgBtn.setAttribute("aria-label", "Save SVG");
  svgBtn.addEventListener("click", async () => {
    svgBtn.disabled = true;
    try {
      await saveSvg();
    } catch (err) {
      console.error(err);
      alert(
        "Could not save SVG. If you opened the file directly, try a local server so the page loads fully."
      );
    } finally {
      svgBtn.disabled = false;
    }
  });

  const sep = document.createElement("span");
  sep.className = "export-sep";
  sep.textContent = "/";
  sep.setAttribute("aria-hidden", "true");

  const pngBtn = document.createElement("button");
  pngBtn.type = "button";
  pngBtn.textContent = "PNG";
  pngBtn.title = "Save PNG";
  pngBtn.setAttribute("aria-label", "Save PNG");
  pngBtn.addEventListener("click", async () => {
    pngBtn.disabled = true;
    try {
      await savePng();
    } catch (err) {
      console.error(err);
      alert(EXPORT_FAIL);
    } finally {
      pngBtn.disabled = false;
    }
  });

  tools.append(icon, prefix, svgBtn, sep, pngBtn);
  return tools;
}

export function initExport() {
  const poster = document.querySelector(".page");
  if (!poster || poster.dataset.exportAttached === "1") return;

  const footer = poster.querySelector(".caption");
  const tools = makeExportTools();
  const sourceLine = document.createElement("p");
  sourceLine.className = "footer-source";
  sourceLine.append("Source code: ");
  const sourceLink = document.createElement("a");
  sourceLink.href = SOURCE_REPO_URL;
  sourceLink.textContent = SOURCE_REPO_LABEL;
  sourceLink.rel = "noopener";
  sourceLine.append(sourceLink);
  if (footer) {
    const line = document.createElement("p");
    line.className = "footer-export";
    line.append(tools);
    footer.append(line, sourceLine);
  } else {
    poster.append(tools, sourceLine);
  }
  poster.dataset.exportAttached = "1";
}
