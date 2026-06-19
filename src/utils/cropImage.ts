/**
 * Tạo và lấy ảnh đã crop từ canvas dưới dạng Blob
 * 
 * @param imageSrc Đường dẫn chứa nội dung ảnh gốc (base64 hoặc object URL)
 * @param pixelCrop Đối tượng chứa tọa độ và kích thước vùng cắt thực tế (tính theo pixel)
 * @returns Promise chứa dữ liệu Blob của hình ảnh đã cắt
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous"; // Tránh các lỗi liên quan đến bảo mật canvas (CORS)

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Không thể khởi tạo 2d context cho canvas."));
      }

      // Đặt kích thước canvas bằng kích thước vùng cắt thực tế
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Vẽ phân đoạn ảnh được cắt lên canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Xuất kết quả canvas dưới dạng tệp Blob JPEG chất lượng cao (0.95)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Canvas rỗng hoặc không thể xuất Blob."));
          }
          resolve(blob);
        },
        "image/jpeg",
        0.95
      );
    };

    image.onerror = (error) => {
      reject(error);
    };
  });
};
