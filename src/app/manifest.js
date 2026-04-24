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
        src: '/opengraph-image.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
