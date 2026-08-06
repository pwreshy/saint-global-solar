/**
 * Utility to compress and resize images client-side before uploading.
 * This drastically speeds up upload times and keeps site image sizes lightweight.
 * 
 * @param {File} file The original file uploaded by the user.
 * @param {number} maxWidth The maximum allowed width of the compressed image.
 * @param {number} maxHeight The maximum allowed height of the compressed image.
 * @param {number} quality Compression quality between 0.0 and 1.0 (default 0.8).
 * @returns {Promise<File>} A promise that resolves to the compressed File object.
 */
export async function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) {
  // If the file is not an image or is a GIF (which loses animation on canvas), skip compression
  if (!file || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and clamp width/height
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            
            // Generate JPG extension filename
            let baseName = file.name;
            const dotIndex = baseName.lastIndexOf('.');
            if (dotIndex !== -1) {
              baseName = baseName.substring(0, dotIndex);
            }
            const cleanName = `${baseName}.jpg`;

            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(`[ImageCompressor] Compressed "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB) -> "${compressedFile.name}" (${(compressedFile.size / 1024).toFixed(1)}KB)`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
