interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Tạo ảnh đã được cắt từ ảnh gốc và vùng cắt
 * @param imageSrc - URL của ảnh gốc
 * @param cropArea - Vùng cắt với tọa độ x, y, width, height
 * @returns Promise<Blob | null> - Blob của ảnh đã cắt hoặc null nếu có lỗi
 */
export const getCroppedImg = async (
	imageSrc: string,
	cropArea: CropArea
): Promise<Blob | null> => {
	try {
		const image = await createImage(imageSrc);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return null;
		}

		// Thiết lập kích thước canvas bằng với vùng cắt
		canvas.width = cropArea.width;
		canvas.height = cropArea.height;

		// Vẽ phần ảnh được cắt lên canvas
		ctx.drawImage(
			image,
			cropArea.x,
			cropArea.y,
			cropArea.width,
			cropArea.height,
			0,
			0,
			cropArea.width,
			cropArea.height
		);

		// Chuyển canvas thành blob
		return new Promise((resolve) => {
			canvas.toBlob(
				(blob) => {
					resolve(blob);
				},
				'image/jpeg',
				0.95
			); // Chất lượng 95%
		});
	} catch (error) {
		console.error('Error cropping image:', error);
		return null;
	}
};

/**
 * Tạo đối tượng Image từ URL
 * @param url - URL của ảnh
 * @returns Promise<HTMLImageElement> - Đối tượng Image đã tải
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous'); // Cho phép xử lý ảnh từ các nguồn khác
		image.src = url;
	});
