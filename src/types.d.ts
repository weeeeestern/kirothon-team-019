declare module '*kiro-avatar-soft.js';
interface Window {
  KiroAvatar: {
    render: (options: Record<string, unknown>) => string;
    EXPRESSIONS: Record<string, unknown>;
    OUTFITS: Record<string, unknown>;
    SITUATIONS: Record<string, unknown>;
  };
}
