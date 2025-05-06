
// IMPORTANT: This API route saves files to the local `public/uploads` directory.
// This is for DEMONSTRATION PURPOSES ONLY and is NOT SUITABLE FOR PRODUCTION.
// In a production environment, you should use a dedicated cloud storage service
// (e.g., AWS S3, Google Cloud Storage, Firebase Storage) and properly secure
// your upload endpoint. Files stored in `public/uploads` might be lost on
// redeployments or in serverless environments.

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  // Server-side validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: `File is too large. Max size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.` }, { status: 413 }); // 413 Payload Too Large
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}.` }, { status: 415 }); // 415 Unsupported Media Type
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate a unique filename to prevent overwrites
  const extension = path.extname(file.name);
  const uniqueFilename = `${uuidv4()}${extension}`;
  
  // Define the path to save the file in the `public/uploads` directory
  // Ensure the `public/uploads` directory exists.
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const filePath = path.join(uploadsDir, uniqueFilename);

  try {
    await writeFile(filePath, buffer);
    console.log(`File saved to ${filePath}`);
    
    // Return the public URL of the uploaded file
    const publicUrl = `/uploads/${uniqueFilename}`;
    return NextResponse.json({ success: true, url: publicUrl, filename: file.name, filetype: file.type });
  } catch (error) {
    console.error('Error saving file:', error);
    // Check if error is an instance of Error to safely access message
    const errorMessage = error instanceof Error ? error.message : 'Error saving file.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

