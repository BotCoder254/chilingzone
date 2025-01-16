import { Request, Response } from "express";
import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { join } from "path";
import { createWriteStream, createReadStream, unlink } from "fs";
import { promisify } from "util";

const unlinkAsync = promisify(unlink);

export default async function downloadController(req: Request, res: Response) {
    const { url, title, quality } = req.body;
    
    if (!url || !title) {
        return res.status(400).json({
            success: false,
            message: "Missing required parameters"
        });
    }

    const tempDir = join(__dirname, "../temp");
    const tempInput = join(tempDir, `${Date.now()}_input.m3u8`);
    const tempOutput = join(tempDir, `${Date.now()}_output.mp4`);

    try {
        // Download the HLS stream
        const response = await axios.get(url, {
            responseType: 'stream'
        });

        // Save the m3u8 file
        await new Promise((resolve, reject) => {
            const writer = createWriteStream(tempInput);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Convert to MP4
        await new Promise((resolve, reject) => {
            ffmpeg(tempInput)
                .outputOptions([
                    '-c:v copy',
                    '-c:a copy',
                    '-bsf:a aac_adtstoasc'
                ])
                .output(tempOutput)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Stream the converted file to client
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        
        const readStream = createReadStream(tempOutput);
        readStream.pipe(res);

        // Clean up temp files after streaming
        readStream.on('end', async () => {
            try {
                await unlinkAsync(tempInput);
                await unlinkAsync(tempOutput);
            } catch (err) {
                console.error('Error cleaning up temp files:', err);
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to process download"
        });
        
        // Clean up temp files on error
        try {
            await unlinkAsync(tempInput);
            await unlinkAsync(tempOutput);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }
    }
} 