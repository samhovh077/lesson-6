import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

let videos = [];

const storage = multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, callback) => {
        callback(null, `${Date.now()}_${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/ogg', 'video/webm'];
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid video file!'), false);
};

const upload = multer({ storage, fileFilter });

app.get('/videos', (req, res) => {
    res.json(videos);
});

app.get('/videos/:id', (req, res) => {
    const video = videos.find((v) => v.id === parseInt(req.params.id));
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const filePath = path.join(UPLOADS_DIR, video.filePath);

    try {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (!range) return res.status(400).json({ error: 'Requires Range header' });

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = Math.min(start + 10 * 1024 * 1024, fileSize - 1);
        const chunkSize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        });

        file.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'File not found on server' });
    }
});

app.post('/video', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const newVideo = {
        id: Date.now(),
        title: req.body.title,
        filePath: req.file.filename,
    };

    videos.push(newVideo);
    res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
});

app.put('/videos/:id', (req, res) => {
    const videoIndex = videos.findIndex((video) => video.id === parseInt(req.params.id));
    if (videoIndex === -1) return res.status(404).json({ error: 'Video not found' });
    if (videos[videoIndex].title === req.body.title)  return res.status(204).send();

    videos[videoIndex].title = req.body.title;
    res.json({ message: 'Video updated successfully', video: videos[videoIndex] });
});

app.delete('/videos/:id', (req, res) => {
    const index = videos.findIndex((video) => video.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Video not found' });
    const filePath = path.join(UPLOADS_DIR, videos[index].filePath)

    videos.splice(index, 1);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete video file' });
        }
        res.json({ message: 'Video deleted successfully' });
    });

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


//There are few bugs in front code. 