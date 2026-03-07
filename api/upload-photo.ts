import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename } = req.body;

    console.log('Upload request received:', { filename, imageLength: image?.length });

    if (!image || !filename) {
      console.error('Missing required fields:', { hasImage: !!image, hasFilename: !!filename });
      return res.status(400).json({ error: 'Missing image or filename' });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('Buffer created, size:', buffer.length);

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    console.log('Upload successful:', blob.url);

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to upload image', details: errorMessage });
  }
}
