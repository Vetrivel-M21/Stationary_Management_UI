/**
 * Compresses an image file (if applicable) and converts it to a lightweight Base64 Data URL.
 * Prevents HTTP 413 (Payload/Content Too Large) errors when submitting attachments.
 * Non-image files (like PDFs) are read directly as Data URLs.
 * 
 * @param {File} file - The uploaded file object
 * @param {number} maxDim - Maximum width/height dimension in pixels (default: 1600)
 * @param {number} quality - JPEG compression quality 0.0 - 1.0 (default: 0.8)
 * @returns {Promise<string>} - Resolves to the Base64 Data URL
 */
export function compressFileToDataUrl(file, maxDim = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    // For non-images (e.g. PDF), read directly as Data URL
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw data url if image decode fails
        resolve(event.target.result);
      };
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
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG format with specified quality
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
