"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const auth_context_1 = require("@/lib/auth-context");
const Navbar_1 = require("@/components/shared/Navbar");
const Footer_1 = require("@/components/shared/Footer");
const sora = (0, google_1.Sora)({
    subsets: ['latin'],
    variable: '--font-sora',
    display: 'swap',
});
const mono = (0, google_1.JetBrains_Mono)({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});
exports.metadata = {
    title: {
        default: 'CuliCars — Kenya Vehicle History Intelligence',
        template: '%s | CuliCars',
    },
    description: 'Search any Kenya number plate or VIN to reveal the full history: theft records, damage, odometer fraud, legal status, and more.',
    keywords: ['Kenya vehicle history', 'number plate check', 'VIN check Kenya', 'car history Kenya', 'NTSA records'],
    openGraph: {
        type: 'website',
        url: 'https://culicars.com',
        title: 'CuliCars — Kenya Vehicle History Intelligence',
        description: 'Search any Kenya number plate or VIN.',
        siteName: 'CuliCars',
    },
};
function RootLayout({ children }) {
    return (<html lang="en" className={`${sora.variable} ${mono.variable}`}>
      <body className="bg-cc-bg text-cc-text antialiased">
        <auth_context_1.AuthProvider>
          <Navbar_1.Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer_1.Footer />
        </auth_context_1.AuthProvider>
      </body>
    </html>);
}
