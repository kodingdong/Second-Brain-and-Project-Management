# Retraq — User Guide & Documentation

Selamat datang di **Retraq**, aplikasi *Second Brain* dan *Project Management* offline-first yang menggabungkan keunggulan **Notion** (database views, workspace terstruktur) dan **Obsidian** (knowledge graph, bi-directional linking).

Aplikasi ini berjalan **100% offline** di browser Anda menggunakan IndexedDB, memastikan kecepatan maksimal dan privasi penuh.

---

## 🚀 Fitur Utama

### 1. Command Palette (Shortcut Utama)
Tekan <kbd>Ctrl</kbd> + <kbd>K</kbd> (atau <kbd>Cmd</kbd> + <kbd>K</kbd> di Mac) dari mana saja untuk membuka **Command Palette**. 
Dari sini Anda bisa:
- **Navigasi Cepat:** Pindah ke halaman Dashboard, Projects, Inbox, dll.
- **Pencarian Universal:** Ketik judul project, nama task, atau isi catatan untuk langsung membukanya.
- **Buat Catatan Cepat:** Ketik teks yang belum ada, lalu tekan `Enter` untuk langsung membuat catatan baru dengan judul tersebut.

### 2. Workspace & Projects (Notion-style)
Menu **Projects** menyediakan manajemen proyek dengan 3 tampilan (*views*) yang bisa diganti-ganti sesuai kebutuhan Anda:
- **▦ Gallery View:** Tampilan kartu visual dengan cover emoji dan progress bar. Cocok untuk melihat *big picture* dari semua proyek.
- **⊞ Kanban View:** Papan geser (*drag-and-drop*) berdasarkan status (Idea, Planning, Active, Paused, Done). Tarik kartu dari satu kolom ke kolom lain untuk otomatis mengupdate statusnya.
- **≡ Table View:** Tampilan spreadsheet padat informasi untuk melihat deadline (Target Date) dan jumlah task yang selesai.

### 3. Knowledge Management (Obsidian-style)
Retraq dirancang untuk menghubungkan ide-ide Anda:
- **Bi-directional Links (Backlinks):** Saat Anda menulis catatan, gunakan format `[[Judul Catatan]]` untuk membuat tautan ke catatan lain. Saat Anda membuka catatan yang dituju, Anda akan melihat bagian **Backlinks** di bawah yang menunjukkan catatan mana saja yang merujuk padanya.
- **Knowledge Graph:** Buka menu **Graph** untuk melihat visualisasi jaringan pemikiran Anda. Titik-titik (nodes) mewakili catatan dan proyek, sedangkan garis mewakili relasi (tautan). Anda bisa zoom, pan, dan men-drag node, serta *double-click* untuk langsung membuka catatan tersebut.
- **Daily Notes:** Catatan khusus yang terikat pada tanggal tertentu, cocok untuk jurnal harian.

### 4. Review & Resurface
- Fitur **Review** membantu Anda melakukan evaluasi mingguan (*Weekly Review*) terpandu untuk membersihkan Inbox dan mengecek proyek aktif.
- Algoritma **Spaced Repetition / Resurface** akan memunculkan kembali catatan-catatan lama (di atas 14 hari) agar ide-ide lama tidak terkubur dan bisa di-review kembali.

---

## ⌨️ Shortcut Keyboard

Retraq dirancang untuk *power user* yang ingin bekerja cepat tanpa mouse:

| Shortcut | Fungsi | Keterangan |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Buka Command Palette | Pencarian universal dan navigasi cepat |
| <kbd>N</kbd> | New Project | Langsung membuka modal pembuatan proyek baru (dari menu apapun) |
| <kbd>C</kbd> | Quick Capture | Langsung membuka modal untuk mencatat ide cepat ke Inbox |
| <kbd>Esc</kbd> | Tutup Modal | Menutup Command Palette atau pop-up modal apapun |

---

## ⚙️ Pengaturan & Backup Data

Karena Retraq bersifat *offline-first*, **data Anda hanya tersimpan di perangkat (browser) Anda saat ini.** 

Buka menu **Settings** untuk mengelola data Anda:
1. **Appearance (Light/Dark Mode):** Ubah tema aplikasi sesuai kenyamanan mata Anda.
2. **Export JSON:** ⚠️ **SANGAT PENTING!** Lakukan export secara berkala untuk mem-backup data Anda. File `.json` akan terunduh ke komputer Anda.
3. **Import JSON:** Gunakan ini untuk memulihkan data dari perangkat lama atau setelah membersihkan *cache* browser.
4. **Save as Seed:** Menyimpan kondisi data saat ini sebagai file `seed.json`. Jika file ini diletakkan di folder `retraq/data/`, pengguna baru yang membuka web app ini akan otomatis mendapatkan data tersebut sebagai data awal.

---

## 📱 PWA (Progressive Web App)

Retraq bisa diinstal seperti aplikasi *native* di HP atau PC Anda:
- **Di Desktop (Chrome/Edge):** Klik ikon "Install" (layar dengan tanda panah ke bawah) di ujung kanan *address bar* browser Anda.
- **Di Android (Chrome):** Buka menu Chrome (titik tiga) lalu pilih **"Add to Home screen"** atau **"Install app"**.
- **Di iOS (Safari):** Buka menu Share (kotak dengan panah ke atas) lalu pilih **"Add to Home Screen"**.

Setelah diinstal, Retraq dapat dibuka dari *App Drawer* tanpa *address bar*, memberikan pengalaman layar penuh layaknya aplikasi profesional.
