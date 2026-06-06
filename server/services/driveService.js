const IMAGE_MIME_PREFIX = 'image/';

const extractFolderId = (url) => {
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const extractFileId = (url) => {
  if (!url) return null;
  const filePathMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (filePathMatch) return filePathMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  const proxyMatch = url.match(/\/api\/images\/proxy\/([a-zA-Z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  return null;
};

const toImageUrl = (fileId) => `/api/images/proxy/${fileId}`;

exports.extractDriveFileId = extractFileId;
exports.toImageUrl = toImageUrl;

const getApiKey = () => {
  const key = process.env.GOOGLE_API_KEY;
  if (!key?.trim()) {
    const error = new Error(
      'Chưa cấu hình GOOGLE_API_KEY trong server/.env. Xem hướng dẫn trong README.'
    );
    error.code = 'MISSING_API_KEY';
    throw error;
  }
  return key.trim();
};

const listFolderContents = async (folderId, apiKey) => {
  const items = [];
  let pageToken = null;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken,files(id,name,mimeType)',
      pageSize: '1000',
      key: apiKey,
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );
    const data = await response.json();

    if (!response.ok) {
      let message =
        data.error?.message ||
        'Không thể đọc folder Google Drive. Kiểm tra link và quyền chia sẻ.';

      if (data.error?.code === 404 || data.error?.reason === 'notFound') {
        message =
          'Folder chưa public. Bạn thấy ảnh vì đã đăng nhập Google, nhưng server cần Share → "Anyone with the link" → Viewer.';
      }

      const error = new Error(message);
      error.code = 'DRIVE_API_ERROR';
      throw error;
    }

    items.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
};

const listImagesInFolder = async (folderId, apiKey, depth = 0, maxDepth = 5) => {
  const items = await listFolderContents(folderId, apiKey);
  const images = items.filter((file) => file.mimeType?.startsWith(IMAGE_MIME_PREFIX));
  const subfolders = items.filter(
    (file) => file.mimeType === 'application/vnd.google-apps.folder'
  );

  if (depth < maxDepth) {
    for (const subfolder of subfolders) {
      const nested = await listImagesInFolder(subfolder.id, apiKey, depth + 1, maxDepth);
      images.push(...nested);
    }
  }

  return images;
};

exports.getImagesFromLink = async (driveLink) => {
  const link = driveLink?.trim();
  if (!link) {
    const error = new Error('Chưa có link Google Drive.');
    error.code = 'NO_DRIVE_LINK';
    throw error;
  }

  const fileId = extractFileId(link);
  if (fileId) {
    const apiKey = getApiKey();
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name&key=${apiKey}`
    );
    const data = await response.json();
    return [
      {
        url: toImageUrl(fileId),
        fileName: data.name || `image-${fileId}.jpg`,
      },
    ];
  }

  const folderId = extractFolderId(link);
  if (!folderId) {
    const error = new Error(
      'Link Google Drive không hợp lệ. Dùng link folder hoặc file ảnh.'
    );
    error.code = 'INVALID_DRIVE_LINK';
    throw error;
  }

  const apiKey = getApiKey();
  const files = await listImagesInFolder(folderId, apiKey);

  if (files.length === 0) {
    const error = new Error(
      'Không tìm thấy ảnh. Kiểm tra: (1) Folder có file JPG/PNG, (2) Share → "Anyone with the link" → Viewer, (3) Ảnh nằm trong folder hoặc subfolder.'
    );
    error.code = 'NO_IMAGES';
    throw error;
  }

  return files.map((file) => ({
    url: toImageUrl(file.id),
    fileName: file.name,
  }));
};

// backward compat
exports.getImageUrlsFromLink = async (driveLink) => {
  const images = await exports.getImagesFromLink(driveLink);
  return images.map((img) => img.url);
};
