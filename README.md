# Buku Kas

Aplikasi pencatatan pemasukan & pengeluaran (PWA, siap dibungkus APK via PWABuilder).

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
Data transaksi tersimpan di `localStorage` browser/perangkat pengguna — tidak terkirim ke server mana pun.
