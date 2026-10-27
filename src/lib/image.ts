/** Resize uploads before storage; retain the original only when it is smaller. */
export async function compressImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Image processing is unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.8),
  );
  if (!blob) throw new Error("Unable to process this image");
  return blob.size < file.size
    ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      })
    : file;
}
