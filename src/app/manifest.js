export default function manifest() {
  return {
    name: 'YDT Focus',
    short_name: 'YDT Focus',
    description: 'YDT Focus — Profesyonel YDT Çalışma Platformu',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/opengraph-image.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
