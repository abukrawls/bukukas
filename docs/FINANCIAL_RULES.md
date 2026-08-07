# Aturan Domain Keuangan Buku Kas

Dokumen ini adalah kontrak logika antarfitur. Perubahan fitur baru harus menjaga aturan berikut agar saldo, laporan, dan kekayaan bersih tidak terhitung ganda.

## 1. Transaksi / Ledger

- Ledger mencatat pergerakan uang yang benar-benar terjadi.
- Pemasukan dan pengeluaran operasional membentuk statistik bulanan dan anggaran.
- Transfer hanya memindahkan dana antar akun, sehingga pokok transfer bukan pemasukan atau pengeluaran.
- Transaksi terjadwal belum memengaruhi saldo sampai tanggal efektif dan saldo sumber mencukupi.

## 2. Aset dan Kekayaan Bersih

- Aset menyimpan posisi kas bernama, tabungan, investasi, kendaraan, properti, barang berharga, dan piutang yang relevan.
- Kekayaan bersih = total aset - hutang aktif - sisa cicilan.
- Perubahan aset yang berasal dari transfer tidak boleh dihitung lagi sebagai pemasukan/pengeluaran.

## 3. Anggaran

- Anggaran adalah batas pengeluaran bulanan per kategori.
- Membuat, mengedit, atau menghapus anggaran tidak mengubah saldo dan tidak membuat transaksi.
- Pemakaian anggaran hanya membaca transaksi pengeluaran operasional yang sudah efektif pada bulan berjalan.
- Cicilan mempunyai domain jadwal sendiri, sehingga pokok cicilan tidak menjadi pemakaian anggaran.

## 4. Target Menabung

- Target Menabung adalah alokasi atau earmark dari dana yang sudah dimiliki.
- Alokasi dan pelepasan dana tidak mengubah saldo, total aset, pemasukan, atau pengeluaran.
- Total alokasi tidak boleh melebihi dana likuid dan tabungan yang tersedia.
- Jika saldo kemudian turun di bawah total alokasi, aplikasi memberi notifikasi agar alokasi ditinjau.

## 5. Cicilan

- Cicilan adalah kewajiban terjadwal dan tidak diduplikasi ke Hutang & Piutang.
- Membuat cicilan tidak otomatis membuat transaksi karena belum tentu ada kas yang diterima.
- Pembayaran pokok membuat transaksi `pembayaran-cicilan`: saldo berkurang dan sisa kewajiban berkurang dengan nilai yang sama.
- Pokok cicilan bukan pengeluaran operasional. Biaya atau denda dicatat terpisah sebagai `biaya-cicilan` dan merupakan pengeluaran.
- Transaksi yang dibuat Cicilan tidak boleh diedit atau dihapus langsung dari ledger karena riwayat pembayaran adalah sumber sisa kewajiban.

## 6. Hutang dan Piutang

- Domain ini dipakai untuk pinjaman umum, bukan kontrak cicilan pembelian.
- Pencairan hutang, pemberian piutang, dan pembayaran pokok adalah mutasi posisi keuangan, bukan pendapatan atau biaya operasional.
- Bunga, denda, dan biaya pinjaman adalah pengeluaran operasional.
- Transaksi relasi dikelola dari domain Hutang & Piutang agar ledger dan sisa pokok selalu sinkron.

## 7. Backup dan Kompatibilitas

- Backup versi saat ini adalah skema `versi: 3`.
- Backup mencakup transaksi, aset, hutang/piutang, anggaran, target menabung, cicilan, dan snapshot aset bulanan.
- Restore tetap menerima backup lama yang belum memiliki tiga domain Rencana; data yang tidak tersedia dimulai sebagai daftar kosong.
