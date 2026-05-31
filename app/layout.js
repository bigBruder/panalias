import './globals.css';

export const metadata = {
  title: 'Alias — Гра в Слова',
  description: 'Мобільна гра Alias — пояснюй слова, грай з друзями! Українські слова, командна гра, рівні складності.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alias',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a1a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>
        <div className="bg-gradient" />
        <div className="bg-orb bg-orb--purple" />
        <div className="bg-orb bg-orb--blue" />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
