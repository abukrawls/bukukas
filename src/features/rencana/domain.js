const BULAN_ID = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  Mei: 4,
  Jun: 5,
  Jul: 6,
  Agu: 7,
  Sep: 8,
  Okt: 9,
  Nov: 10,
  Des: 11,
};

export const KATEGORI_TARGET_MENABUNG = [
  "Barang",
  "Jalan-jalan",
  "Dana Darurat",
  "Pendidikan",
  "Ibadah",
  "Lainnya",
];

export const BAGIAN_RENCANA = ["anggaran", "target", "cicilan", "hutang"];

export const angkaAman = (nilai) => {
  const angka = Number(nilai);
  return Number.isFinite(angka) ? angka : 0;
};

export function parseTanggalKeuangan(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const teks = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(teks)) {
    const [tahun, bulan, hari] = teks.split("-").map(Number);
    const tanggal = new Date(tahun, bulan - 1, hari);
    if (
      tanggal.getFullYear() !== tahun ||
      tanggal.getMonth() !== bulan - 1 ||
      tanggal.getDate() !== hari
    ) return null;
    tanggal.setHours(0, 0, 0, 0);
    return tanggal;
  }

  const [hariRaw, bulanRaw, tahunRaw] = teks.split(/\s+/);
  const hari = Number(hariRaw);
  const bulan = BULAN_ID[bulanRaw];
  const tahun = Number(tahunRaw);
  if (!Number.isInteger(hari) || bulan == null || !Number.isInteger(tahun)) return null;

  const tanggal = new Date(tahun, bulan, hari);
  if (
    tanggal.getFullYear() !== tahun ||
    tanggal.getMonth() !== bulan ||
    tanggal.getDate() !== hari
  ) return null;
  tanggal.setHours(0, 0, 0, 0);
  return tanggal;
}

export function formatTanggalRencana(value) {
  const tanggal = parseTanggalKeuangan(value);
  if (!tanggal) return "-";
  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rentangBulan(tanggal = new Date()) {
  const awal = new Date(tanggal.getFullYear(), tanggal.getMonth(), 1);
  const akhir = new Date(tanggal.getFullYear(), tanggal.getMonth() + 1, 1);
  return [awal.getTime(), akhir.getTime()];
}

export function penggunaanAnggaran(item, transaksi = [], sekarang = new Date()) {
  const [awal, akhir] = rentangBulan(sekarang);
  return transaksi.reduce((total, tx) => {
    if (tx?.kat !== item?.kategori || angkaAman(tx?.jumlah) >= 0) return total;
    const tanggal = parseTanggalKeuangan(tx?.tgl);
    if (!tanggal) return total;
    const waktu = tanggal.getTime();
    if (waktu < awal || waktu >= akhir) return total;
    return total + Math.abs(angkaAman(tx.jumlah));
  }, 0);
}

export function ringkasanAnggaran(anggaran = [], transaksi = [], sekarang = new Date()) {
  const batas = anggaran.reduce((total, item) => total + Math.max(0, angkaAman(item?.batas)), 0);
  const terpakai = anggaran.reduce(
    (total, item) => total + penggunaanAnggaran(item, transaksi, sekarang),
    0
  );
  const persen = batas > 0 ? (terpakai / batas) * 100 : 0;
  return {
    batas,
    terpakai,
    sisa: batas - terpakai,
    persen,
  };
}

export function progresTarget(item) {
  const target = Math.max(0, angkaAman(item?.target));
  const terkumpul = Math.max(0, angkaAman(item?.terkumpul));
  const persen = target > 0 ? Math.min(100, (terkumpul / target) * 100) : 0;
  return {
    target,
    terkumpul,
    kurang: Math.max(0, target - terkumpul),
    persen,
    tercapai: target > 0 && terkumpul >= target,
  };
}

export function totalAlokasiTarget(daftar = []) {
  return daftar.reduce((total, item) => total + Math.max(0, angkaAman(item?.terkumpul)), 0);
}

export function saldoBebasTarget(daftar = [], saldoPerencanaan = 0) {
  return Math.max(0, angkaAman(saldoPerencanaan) - totalAlokasiTarget(daftar));
}

export function nominalAngsuranCicilan(item) {
  const total = Math.max(0, angkaAman(item?.total));
  const tenor = Math.max(1, Math.trunc(angkaAman(item?.tenor)) || 1);
  return total > 0 ? Math.ceil(total / tenor) : 0;
}

export function totalTerbayarCicilan(item) {
  const total = Math.max(0, angkaAman(item?.total));
  const angsuran = nominalAngsuranCicilan(item);
  const tenor = Math.max(1, Math.trunc(angkaAman(item?.tenor)) || 1);
  const angsuranAwal = Math.min(tenor, Math.max(0, Math.trunc(angkaAman(item?.angsuranAwal))));
  const saldoAwal = Math.min(total, angsuran * angsuranAwal);
  const pembayaran = Array.isArray(item?.pembayaran)
    ? item.pembayaran.reduce((jumlah, bayar) => jumlah + Math.max(0, angkaAman(bayar?.jumlah)), 0)
    : 0;
  return Math.min(total, saldoAwal + pembayaran);
}

export function sisaCicilan(item) {
  return Math.max(0, angkaAman(item?.total) - totalTerbayarCicilan(item));
}

function tambahBulanTerjaga(isoDate, jumlahBulan) {
  const tanggal = parseTanggalKeuangan(isoDate);
  if (!tanggal) return "";
  const hari = tanggal.getDate();
  const tahun = tanggal.getFullYear();
  const bulan = tanggal.getMonth() + jumlahBulan;
  const hariTerakhir = new Date(tahun, bulan + 1, 0).getDate();
  const hasil = new Date(tahun, bulan, Math.min(hari, hariTerakhir));
  return `${hasil.getFullYear()}-${String(hasil.getMonth() + 1).padStart(2, "0")}-${String(hasil.getDate()).padStart(2, "0")}`;
}

export function ringkasanCicilan(item, sekarang = new Date()) {
  const total = Math.max(0, angkaAman(item?.total));
  const tenor = Math.max(1, Math.trunc(angkaAman(item?.tenor)) || 1);
  const angsuran = nominalAngsuranCicilan(item);
  const terbayar = totalTerbayarCicilan(item);
  const sisa = Math.max(0, total - terbayar);
  const angsuranSelesai = angsuran > 0 ? Math.min(tenor, Math.floor(terbayar / angsuran)) : 0;
  const jatuhTempo = sisa > 0 ? tambahBulanTerjaga(item?.jatuhTempoPertama, angsuranSelesai) : "";
  const tanggalJatuhTempo = parseTanggalKeuangan(jatuhTempo);
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const hariMenuju = tanggalJatuhTempo
    ? Math.ceil((tanggalJatuhTempo.getTime() - hariIni.getTime()) / 86400000)
    : null;

  let status = "Aktif";
  if (sisa <= 0 && total > 0) status = "Lunas";
  else if (hariMenuju != null && hariMenuju < 0) status = "Terlambat";
  else if (hariMenuju != null && hariMenuju <= 7) status = "Jatuh Tempo";

  return {
    total,
    tenor,
    angsuran,
    terbayar,
    sisa,
    angsuranSelesai,
    jatuhTempo,
    hariMenuju,
    status,
    tagihanBerikut: Math.min(angsuran, sisa),
    persen: total > 0 ? Math.min(100, (terbayar / total) * 100) : 0,
  };
}

export function totalSisaCicilan(daftar = []) {
  return daftar.reduce((total, item) => total + sisaCicilan(item), 0);
}

export function cicilanTerdekat(daftar = [], sekarang = new Date()) {
  return daftar
    .map((item) => ({ item, info: ringkasanCicilan(item, sekarang) }))
    .filter(({ info }) => info.sisa > 0 && info.jatuhTempo)
    .sort((a, b) => {
      const aTgl = parseTanggalKeuangan(a.info.jatuhTempo)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTgl = parseTanggalKeuangan(b.info.jatuhTempo)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTgl - bTgl;
    })[0] || null;
}

export function buatNotifikasiRencana({
  cicilan = [],
  targetMenabung = [],
  anggaran = [],
  transaksi = [],
  saldoPerencanaan = 0,
  sekarang = new Date(),
} = {}) {
  const hasil = [];

  cicilan.forEach((item) => {
    const info = ringkasanCicilan(item, sekarang);
    if (info.status === "Terlambat") {
      hasil.push({
        id: `cicilan-terlambat-${item.id}`,
        bagian: "cicilan",
        level: "bahaya",
        judul: `${item.nama} melewati jatuh tempo`,
        detail: `Tagihan berikutnya ${formatTanggalRencana(info.jatuhTempo)}.`,
      });
    } else if (info.status === "Jatuh Tempo") {
      hasil.push({
        id: `cicilan-dekat-${item.id}`,
        bagian: "cicilan",
        level: "peringatan",
        judul: `${item.nama} segera jatuh tempo`,
        detail: info.hariMenuju === 0
          ? "Jatuh tempo hari ini."
          : `${info.hariMenuju} hari lagi, tagihan ${Math.round(info.tagihanBerikut).toLocaleString("id-ID")}.`,
      });
    }
  });

  anggaran.forEach((item) => {
    const batas = Math.max(0, angkaAman(item?.batas));
    if (!batas) return;
    const terpakai = penggunaanAnggaran(item, transaksi, sekarang);
    const persen = (terpakai / batas) * 100;
    if (persen >= 100) {
      hasil.push({
        id: `anggaran-lewat-${item.id}`,
        bagian: "anggaran",
        level: "bahaya",
        judul: `Anggaran ${item.kategori} terlampaui`,
        detail: `${Math.round(persen)}% dari batas bulan ini sudah terpakai.`,
      });
    } else if (persen >= 85) {
      hasil.push({
        id: `anggaran-dekat-${item.id}`,
        bagian: "anggaran",
        level: "peringatan",
        judul: `Anggaran ${item.kategori} mendekati batas`,
        detail: `${Math.round(persen)}% dari batas bulan ini sudah terpakai.`,
      });
    }
  });

  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  targetMenabung.forEach((item) => {
    const progress = progresTarget(item);
    if (progress.tercapai || !item?.targetDate) return;
    const targetDate = parseTanggalKeuangan(item.targetDate);
    if (!targetDate) return;
    const sisaHari = Math.ceil((targetDate.getTime() - hariIni.getTime()) / 86400000);
    if (sisaHari < 0) {
      hasil.push({
        id: `target-terlambat-${item.id}`,
        bagian: "target",
        level: "peringatan",
        judul: `Target ${item.nama} melewati tenggat`,
        detail: `${Math.round(progress.persen)}% dana sudah dialokasikan.`,
      });
    } else if (sisaHari <= 14) {
      hasil.push({
        id: `target-dekat-${item.id}`,
        bagian: "target",
        level: "info",
        judul: `Target ${item.nama} tinggal ${sisaHari} hari`,
        detail: `${Math.round(progress.persen)}% dana sudah dialokasikan.`,
      });
    }
  });

  const alokasi = totalAlokasiTarget(targetMenabung);
  if (alokasi > Math.max(0, angkaAman(saldoPerencanaan))) {
    hasil.push({
      id: "target-saldo-tidak-cukup",
      bagian: "target",
      level: "bahaya",
      judul: "Alokasi target melebihi dana tersedia",
      detail: "Tinjau kembali alokasi agar sesuai dengan saldo likuid dan tabungan.",
    });
  }

  const prioritas = { bahaya: 0, peringatan: 1, info: 2 };
  return hasil.sort((a, b) => (prioritas[a.level] ?? 9) - (prioritas[b.level] ?? 9));
}
