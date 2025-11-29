import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PlayerBar from "@/components/PlayerBar";

export const metadata: Metadata = {
  title: "Groove",
  description: "Music Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <div style={{ display: "flex", height: "100vh" }}>
          
          {/* Сайдбар */}
          <Sidebar />

          {/* Контент (занимает всё оставшееся место) */}
          <main style={{ 
            flex: 1, 
            overflowY: "auto", 
            paddingBottom: "var(--player-height)", // Отступ снизу под плеер
            position: "relative"
          }}>
            {children}
          </main>

          {/* Плеер */}
          <PlayerBar />
        </div>
      </body>
    </html>
  );
}