/**
 * Upload an image to Vercel Blob storage
 * @param base64Image - Base64 encoded image string
 * @param filename - Filename for the uploaded image
 * @returns URL of the uploaded image
 */
export async function uploadImage(base64Image: string, filename: string): Promise<string> {
  try {
    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        filename,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Delete an image from Vercel Blob storage
 * @param url - URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    const response = await fetch('/api/delete-photo', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

/**
 * Generate a unique filename for attendance photos
 * @param partTimerId - ID of the part-timer
 * @param eventId - ID of the event
 * @param type - Type of photo (clock-in or clock-out)
 * @returns Unique filename
 */
export function generateAttendancePhotoFilename(
  partTimerId: string,
  eventId: string,
  date: string,
  type: 'clock-in' | 'clock-out'
): string {
  const timestamp = Date.now();
  return `attendance/${partTimerId}/${eventId}/${date}/${type}-${timestamp}.jpg`;
}
