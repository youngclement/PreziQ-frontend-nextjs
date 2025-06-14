import axiosClient from './axios-client';

interface UploadResponse {
  success: boolean;
  message: string;
  data:
    | {
        fileName: string;
        fileUrl: string;
      }
    | {
        name: string;
        fileUrl: string;
      }
    | {
        fileNames: string[];
        fileUrls: string[];
      };
  meta: {
    timestamp: string;
    instance: string;
  };
}

// const extractRelativePath = (fullUrl: string): string => {
//   // Extract everything after the S3 bucket name
//   const match = fullUrl.match(/[^/]+\/[^/]+$/);
//   return match ? match[0] : fullUrl;
// };
const extractRelativePath = (fullUrl: string): string => {
  const url = new URL(fullUrl);

  // Kiểm tra nếu URL trỏ đến S3
  if (url.hostname.includes('s3.amazonaws.com')) {
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  }

  // Trường hợp khác: giữ nguyên logic cũ
  const match = fullUrl.match(/[^/]+\/[^/]+$/);
  return match ? match[0] : fullUrl;
};

console.log(
  extractRelativePath(
    'https://preziq-spring-uploader.s3.amazonaws.com/sounds/custom/HolaHola-a2bb650f-f022-4863-bcb3-e45504b96a1a.mp3'
  )
);

export const storageApi = {
  /**
   * Upload a single file
   * @param file - File to be uploaded
   * @param folderName - Name of the folder where the file will be stored
   * @returns Promise with upload response
   */
  uploadSingleFile(file: File, folderName: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderName', folderName);

    return axiosClient.post('/storage/aws-s3/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Upload multiple files
   * @param files - Array of files to be uploaded
   * @param folderName - Name of the folder where the files will be stored
   * @returns Promise with upload response
   */
  uploadMultipleFiles(
    files: File[],
    folderName: string
  ): Promise<UploadResponse> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('folderName', folderName);

    return axiosClient.post('/storage/aws-s3/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteSingleFile(filePath: string): Promise<UploadResponse> {
    const relativePath = extractRelativePath(filePath);
    return axiosClient.delete('/storage/aws-s3/delete/single', {
      params: {
        filePath: relativePath,
      },
    });
  },
};
