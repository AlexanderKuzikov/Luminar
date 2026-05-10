import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff']);

// GET /api/select-folder — открывает нативный диалог Windows
router.get('/select-folder', (_req, res) => {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Select image folder'
    $dialog.ShowNewFolderButton = $false
    if ($dialog.ShowDialog() -eq 'OK') { Write-Output $dialog.SelectedPath }
  `.trim();

  exec(`powershell -NoProfile -NonInteractive -Command "${psScript}"`,
    { timeout: 60000 },
    (err, stdout) => {
      if (err) return res.status(500).json({ error: 'Dialog failed' });
      const folderPath = stdout.trim();
      if (!folderPath) return res.json({ cancelled: true, path: null, files: [] });
      res.json({ cancelled: false, path: folderPath, files: scanFolder(folderPath) });
    }
  );
});

// GET /api/scan-folder?path=... — сканирует папку без диалога
router.get('/scan-folder', (req, res) => {
  const folderPath = req.query.path as string;
  if (!folderPath || !fs.existsSync(folderPath)) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  res.json({ path: folderPath, files: scanFolder(folderPath) });
});

// GET /api/image?path=... — раздаёт локальные файлы изображений браузеру
router.get('/image', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  const ext = path.extname(filePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return res.status(403).json({ error: 'Forbidden file type' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

function scanFolder(folderPath: string): { name: string; path: string; size: number }[] {
  try {
    return fs.readdirSync(folderPath)
      .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .map(f => {
        const fullPath = path.join(folderPath, f);
        const stat = fs.statSync(fullPath);
        return { name: f, path: fullPath, size: stat.size };
      });
  } catch {
    return [];
  }
}

export default router;
