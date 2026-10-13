export interface VideoEmbedResult {
  type: "iframe" | "video" | "link";
  embedUrl: string;
}

export function getVideoEmbedUrl(rawUrl: string): VideoEmbedResult | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const url = rawUrl.trim();

  // YouTube (standard, short, embed)
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "iframe",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      type: "iframe",
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "iframe",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct MP4 / WebM / OGG video
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return { type: "video", embedUrl: url };
  }

  return { type: "link", embedUrl: url };
}
