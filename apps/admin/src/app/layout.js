"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const Sidebar_1 = require("@/components/Sidebar");
const AdminAuthGuard_1 = require("@/components/AdminAuthGuard");
const inter = (0, google_1.Inter)({ subsets: ['latin'] });
exports.metadata = {
    title: 'CuliCars Admin',
    description: 'CuliCars Administration Dashboard',
};
function RootLayout({ children }) {
    return (<html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0E0E0E] text-zinc-100 min-h-screen`}>
        <AdminAuthGuard_1.AdminAuthGuard>
          <div className="flex min-h-screen">
            <Sidebar_1.Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </AdminAuthGuard_1.AdminAuthGuard>
      </body>
    </html>);
}
