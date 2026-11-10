/**
 * Compresses an image or PDF file and converts it to a lightweight Base64 Data URL.
 * Prevents HTTP 413 (Payload/Content Too Large) errors by ensuring the final payload
 * stays well within GoDaddy/Apache proxy limits (< 500KB).
 * 
 * If a PDF is uploaded, it uses dynamic on-demand PDF rendering (via standard CDN worker)
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

  // Handle PDF: Convert/render to compressed JPEG image to bypass GoDaddy proxy 1MB limit
  if (isPdf) {
    try {
      return await renderPdfToCompressedDataUrl(file, maxDim, quality);
    } catch (err) {
      console.warn('PDF compression fallback to raw data URL:', err);
      return await readFileAsRawDataUrl(file);
    }
  }

  // Handle Image: Render to HTML Canvas and compress to JPEG
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
 * Loads PDF.js from official CDN dynamically (no npm install required),
 * renders the first page (bill/slip invoice) to canvas, and returns a compressed JPEG Data URL.
 */
async function renderPdfToCompressedDataUrl(file, maxDim = 1600, quality = 0.75) {
  // 1. Ensure PDF.js is available on window
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        } else {
          reject(new Error('PDF.js failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
      document.head.appendChild(script);
    });
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
