/**
 * Compresses an image or PDF file and converts it to a lightweight Base64 Data URL.
 * Prevents HTTP 413 (Payload/Content Too Large) errors by ensuring the final payload
 * stays well within GoDaddy/Apache proxy limits (< 500KB).
 * 
 * If a PDF is uploaded, it uses locally bundled PDF rendering (with CDN fallback)
 * to render the document page to an optimized compressed JPEG image.
 * 
 * @param {File} file - The uploaded file object
 * @param {number} maxDim - Maximum width/height dimension in pixels (default: 1600)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default: 0.75)
 * @returns {Promise<string>} - Resolves to the compressed Base64 Data URL
 */
export async function compressFileToDataUrl(file, maxDim = 1600, quality = 0.75) {
  if (!file) {
    throw new Error('No file provided');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // Maximum allowed Base64 string length (~850KB), well below GoDaddy Apache proxy 1MB limit
  const MAX_PAYLOAD_LENGTH = 850 * 1024;

  let resultDataUrl = '';

  // Handle PDF: Convert/render to compressed JPEG image to bypass GoDaddy proxy 1MB limit
  if (isPdf) {
    try {
      resultDataUrl = await renderPdfToCompressedDataUrl(file, maxDim, quality);
    } catch (err) {
      console.warn('PDF compression failed, falling back to raw data URL:', err);
      resultDataUrl = await readFileAsRawDataUrl(file);
    }
  } else {
    // Handle Image: Render to HTML Canvas and compress to JPEG
    resultDataUrl = await compressImageToDataUrl(file, maxDim, quality);
  }

  // Safety guard: ensure the payload will never trigger a server 413 error
  if (resultDataUrl && resultDataUrl.length > MAX_PAYLOAD_LENGTH) {
    const sizeKB = Math.round(resultDataUrl.length / 1024);
    throw new Error(
      `Attachment payload is too large (${sizeKB} KB) for server transfer (max ~800 KB). ` +
      `Please upload an image snapshot or a compressed single-page invoice.`
    );
  }

  return resultDataUrl;
}

/**
 * Compresses an image file to a JPEG Data URL using an HTML canvas.
 */
function compressImageToDataUrl(file, maxDim = 1600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => resolve(event.target.result);
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          // Fill white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with specified quality (~100-200 KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (_) {
          resolve(event.target.result);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Loads a script dynamically into the document.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Loads PDF.js (first from local bundled /vendor/pdfjs/, then fallback to CDN),
 * renders the first page (bill/slip invoice) to canvas, and returns a compressed JPEG Data URL.
 */
async function renderPdfToCompressedDataUrl(file, maxDim = 1600, quality = 0.75) {
  // 1. Ensure PDF.js is available on window
  if (!window.pdfjsLib) {
    try {
      // Primary: load from local application bundle (works offline and inside firewalls)
      await loadScript('/vendor/pdfjs/pdf.min.js');
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
      }
    } catch (localErr) {
      console.warn('Local PDF.js load failed, attempting CDN fallback:', localErr);
      // Secondary: CDN fallback
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    }
  }

  if (!window.pdfjsLib) {
    throw new Error('PDF.js library is not available');
  }

  // 2. Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // 3. Compute scale to fit within maxDim
  const viewportUnscaled = page.getViewport({ scale: 1.0 });
  const scale = Math.min(maxDim / viewportUnscaled.width, maxDim / viewportUnscaled.height, 1.8);
  const viewport = page.getViewport({ scale: Math.max(scale, 1.0) });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  // 4. Return as compressed JPEG (~120KB - 250KB)
  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsRawDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
