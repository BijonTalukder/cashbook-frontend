/**
 * Print an arbitrary HTML element as a PDF using the browser's native
 * `window.print()` dialog ("Save as PDF"). The element is cloned into a
 * hidden iframe so the user's current view is not disturbed, then a
 * print stylesheet hides everything except the report body.
 *
 * Cross-origin images (e.g. a Cloudinary business logo) are rewritten as
 * base64 data URIs before being injected into the iframe. Without that
 * step, browsers either refuse to render the image inside the print
 * document or print a blank placeholder because the image never loads
 * in time. Fetching + encoding is CORS-aware: if it fails we fall back
 * to the original URL and let the browser try.
 *
 * Returns a promise that resolves once the iframe document is fully
 * loaded and the print dialog has been opened (the dialog itself is
 * user-controlled; we cannot detect "Save" vs "Cancel").
 */

interface PrintOptions {
  /** Window title — shows up in the print dialog's title bar / PDF metadata. */
  title?: string;
  /** Extra CSS to inject into the iframe. Useful for page-specific tweaks. */
  extraCss?: string;
}

/** Try to fetch an image and return it as a base64 data URI. Returns the
 *  original URL on any failure (network, CORS, decode) so the iframe can
 *  still attempt a normal load. */
const inlineImage = async (url: string): Promise<string> => {
  // Already a data URI — nothing to do.
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        resolve(typeof result === "string" ? result : url);
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
};

/** Walk the cloned subtree and rewrite every <img src="…"> to a base64
 *  data URI, in parallel. */
const inlineAllImages = async (root: HTMLElement): Promise<void> => {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img[src]"));
  await Promise.all(
    imgs.map(async (img) => {
      const original = img.getAttribute("src");
      if (!original || original.startsWith("data:")) return;
      const inlined = await inlineImage(original);
      if (inlined !== original) img.setAttribute("src", inlined);
    }),
  );
};

export const printElementAsReport = (
  node: HTMLElement,
  options: PrintOptions = {},
): Promise<void> => {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const trigger = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Browsers can throw if the iframe is gone; fall back to the
        // current page's print dialog so the user is never silently
        // stranded.
        window.print();
      }
      // Give the dialog a moment to open, then remove the iframe.
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          /* already gone */
        }
        resolve();
      }, 400);
    };

    const writeAndPrint = async () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        document.body.removeChild(iframe);
        resolve();
        return;
      }

      // Inline external images into the clone BEFORE writing into the
      // iframe. The on-screen node still has the original src (so the UI
      // is unchanged); we only swap it on a deep clone destined for print.
      const cloned = node.cloneNode(true) as HTMLElement;
      await inlineAllImages(cloned);

      const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map((el) => el.outerHTML)
        .join("\n");

      const baseCss = `
        html, body { background: #ffffff !important; color: #111827 !important; }
        body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        @page { size: A4; margin: 12mm; }
        @media print {
          body { padding: 0; }
        }
      `;

      doc.open();
      doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${options.title ?? "Report"}</title>
  ${styles}
  <style>${baseCss}${options.extraCss ?? ""}</style>
</head>
<body>${cloned.outerHTML}</body>
</html>`);
      doc.close();

      // Wait for the iframe document to fully load before printing so
      // images, fonts, and external stylesheets are resolved.
      if (iframe.contentDocument?.readyState === "complete") {
        trigger();
      } else {
        iframe.addEventListener("load", trigger, { once: true });
        // Safety net — some browsers don't fire load for static documents.
        setTimeout(trigger, 800);
      }
    };

    void writeAndPrint();
  });
};
