# Buku Kas

Aplikasi keuangan pribadi berbasis PWA untuk transaksi, aset, anggaran, target menabung, cicilan, serta hutang dan piutang.

## Struktur keuangan
- **Transaksi** adalah ledger pergerakan kas.
- **Aset** menyimpan posisi kekayaan non-ledger dan menghitung kekayaan bersih.
- **Anggaran** adalah batas pengeluaran bulanan dan tidak mengubah saldo.
- **Target Menabung** mengalokasikan dana yang sudah ada dan tidak membuat pemasukan/pengeluaran baru.
- **Cicilan** adalah kewajiban terjadwal. Pembayaran pokok mengurangi saldo dan kewajiban; biaya/denda menjadi pengeluaran.
- **Hutang & Piutang** tetap untuk pinjaman umum di luar kontrak cicilan.

Aturan integrasi lengkap ada di [`docs/FINANCIAL_RULES.md`](docs/FINANCIAL_RULES.md).

## Menjalankan lokal
```
npm install
npm run dev
```

## Build produksi
```
npm run build
```
Hasil build ada di folder `dist/`.

## Upload ke GitHub & aktifkan Pages
1. Push repo ini ke GitHub (branch `main`).
2. Buka **Settings → Pages** di repo, pilih source **GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` akan build & deploy otomatis setiap push ke `main`.
4. URL live akan muncul di tab **Actions** setelah workflow selesai (contoh: `https://username.github.io/nama-repo/`).

## Membuat APK dengan PWABuilder
1. Buka https://www.pwabuilder.com
2. Masukkan URL GitHub Pages dari langkah di atas.
3. Klik **Package for Stores → Android**, unduh APK/AAB.

## Data
Data keuangan tersimpan di `localStorage` browser/perangkat pengguna dan dapat dicadangkan melalui menu **Akun > Backup & Restore**.
