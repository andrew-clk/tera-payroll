/**
 * Upload an image to Vercel Blob storage
 * @param base64Image - Base64 encoded image string
 * @param filename - Filename for the uploaded image
 * @returns URL of the uploaded image
 */
export async function uploadImage(base64Image: string, filename: string): Promise<string> {
  try {
    console.log('uploadImage called with filename:', filename);

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

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Upload failed:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    console.log('Upload successful, URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('Upload error in imageStorage:', error);
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
