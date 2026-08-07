import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { Home, Receipt, PieChart as PieIcon, FileText, ArrowDownLeft, ArrowUpRight, Search, Download, ChevronRight, Plus, X, Trash2, HandCoins, Pencil, Wallet, Landmark, CreditCard, TrendingUp, TrendingDown, Car, Building2, Gem, MoreHorizontal, UploadCloud, DownloadCloud, ArrowLeft, ArrowRight, Users, Check, Minus, ChevronDown, ArrowUp, ArrowDown, ArrowLeftRight, ArrowUpDown, PiggyBank, Info, History, HelpCircle, ShieldCheck, User, BarChart3, Bell, Layers, Eye, EyeOff, Lightbulb, Sprout, Quote, Target, UtensilsCrossed, ShoppingCart, HeartPulse, Gamepad2, Briefcase, ShoppingBag, Percent, Banknote, Gift, Zap, Wifi, Droplet, Fuel, BookOpen, Smartphone, FileBadge2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  buatNotifikasiRencana,
  cicilanTerdekat,
  progresTarget,
  ringkasanAnggaran,
  ringkasanCicilan,
  totalAlokasiTarget,
  totalTerbayarCicilan,
  totalSisaCicilan,
} from "./features/rencana/domain.js";

const Rencana = React.lazy(() => import("./features/rencana/Rencana.jsx"));

// ---------- DATA CONTOH ----------

const KATEGORI_PENGELUARAN = ["Makan", "Belanja", "Transportasi", "Tagihan", "Kesehatan", "Hiburan", "Cicilan", "Biaya Admin", "Biaya Cicilan", "Lainnya"];
// Sumber yang benar-benar menambah pendapatan. "Investasi" tidak dipakai sebagai
// sumber pemasukan karena perpindahan modal ke/dari instrumen investasi bukan pendapatan.
const SUMBER_PEMASUKAN = ["Gaji", "Bonus", "Freelance", "Penjualan", "Hadiah", "Cashback", "Bunga Bank", "Lainnya"];

// ---------- ICON REGISTRY ----------
// Satu sumber kebenaran untuk seluruh icon di aplikasi. Setiap bagian UI cukup memanggil
// <Icon name="..." /> — mengganti tampilan sebuah icon di seluruh aplikasi cukup dengan
// mengubah satu baris pemetaan di sini (atau menggantinya dengan aset SVG kustom nanti,
// tanpa menyentuh halaman manapun). Semua icon memakai proporsi, stroke, dan gaya yang
// seragam (outline, rounded, modern) agar terasa satu keluarga ikon yang premium.
const IKON_REGISTRY = {
  // Navigasi & aksi utama
  home: Home,
  transaction: Receipt,
  transfer: ArrowLeftRight,
  asset: Layers,
  planning: Target,
  search: Search,
  notification: Bell,
  profile: User,
  calendar: History,
  category: Layers,
  chart: BarChart3,
  graph: PieIcon,
  eye: Eye,

  // Metode & akun
  wallet: Wallet,
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
  card: CreditCard,
  saving: PiggyBank,
  investment: TrendingUp,

  // Pemasukan
  salary: Briefcase,
  bonus: Gift,
  freelance: FileText,
  sale: ShoppingBag,
  gift: Gift,
  cashback: Percent,
  interest: Landmark,

  // Pengeluaran
  food: UtensilsCrossed,
  shopping: ShoppingBag,
  transport: Car,
  bill: Receipt,
  health: HeartPulse,
  entertainment: Gamepad2,
  adminFee: FileBadge2,
  education: BookOpen,
  fuel: Fuel,
  electricity: Zap,
  internet: Wifi,
  water: Droplet,

  // Hutang, piutang & aset fisik
  loan: CreditCard,
  receivable: HandCoins,
  vehicle: Car,
  property: Building2,
  valuables: Gem,

  more: MoreHorizontal,
};

// Komponen Icon universal — memanggil icon lewat nama dari IKON_REGISTRY sehingga seluruh
// aplikasi memiliki ukuran, stroke, dan kualitas yang sama persis di manapun dipakai.
function Icon({ name, size = 18, strokeWidth = 1.9, className = "", style }) {
  const Komponen = IKON_REGISTRY[name] || IKON_REGISTRY.more;
  return <Komponen aria-hidden="true" size={size} strokeWidth={strokeWidth} className={className} style={style} />;
}

// Icon kategori pengeluaran — setiap kategori otomatis mendapat icon yang merepresentasikan
// artinya (piring untuk Makan, keranjang untuk Belanja, dst.), dengan warna merah yang konsisten.
const IKON_KATEGORI_PENGELUARAN = {
  Makan: "food",
  Belanja: "shopping",
  Transportasi: "transport",
  Tagihan: "bill",
  Kesehatan: "health",
  Hiburan: "entertainment",
  "Biaya Admin": "adminFee",
  "Biaya Cicilan": "loan",
  Cicilan: "loan",
  Piutang: "receivable",
  Hutang: "loan",
  Lainnya: "more",
};
const WARNA_KATEGORI_PENGELUARAN_ICON = "#B5533C";
const BG_KATEGORI_PENGELUARAN_ICON = "#F3E7E1";

// Icon kategori pemasukan — warna hijau yang konsisten untuk seluruh sumber pemasukan.
const IKON_KATEGORI_PEMASUKAN = {
  Gaji: "salary",
  Bonus: "bonus",
  Freelance: "freelance",
  Penjualan: "sale",
  Investasi: "investment",
  Hadiah: "gift",
  Cashback: "cashback",
  "Bunga Bank": "interest",
  Piutang: "receivable",
  Hutang: "loan",
  Lainnya: "more",
};
const WARNA_KATEGORI_PEMASUKAN_ICON = "#2F6F5E";
const BG_KATEGORI_PEMASUKAN_ICON = "#EAF2EE";

// Ikon metode memakai satu pemetaan global agar form, ringkasan, detail, dan daftar
// selalu menampilkan simbol yang sama untuk akun yang sama.
const IKON_METODE = {
  kas: "cash",
  cash: "cash",
  bank: "bank",
  transfer: "bank",
  ewallet: "ewallet",
  "e-wallet": "ewallet",
};

function namaIkonMetode(metode = "") {
  return IKON_METODE[String(metode).trim().toLowerCase()] || "wallet";
}


// Sumber tunggal daftar kategori gabungan — dipakai di filter Transaksi & Laporan agar selalu konsisten

// Status hutang/piutang, dipakai untuk filter & urutkan (di menu Hutang & di Laporan)
const STATUS_HUTANG_OPSI = ["Terjadwal", "Aktif", "Terlambat", "Gagal Bayar", "Hangus", "Lunas"];
const PRIORITAS_STATUS = { "Gagal Bayar": 0, Terlambat: 1, Aktif: 2, Hangus: 3, Lunas: 4, Terjadwal: 5 };

const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];


const INITIAL_TRANSAKSI = [];

const UI_PREFERENSI_DEFAULT = {
  font: "inter",
  ukuran: "normal",
};

const OPSI_FONT_APLIKASI = [
  { id: "inter", label: "Inter", css: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: "poppins", label: "Poppins", css: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { id: "system", label: "Sistem", css: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
];

const SKALA_FONT_APLIKASI = {
  kecil: "92%",
  normal: "100%",
  besar: "110%",
};

const rupiah = (n) => {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("id-ID");
  return (n < 0 ? "-Rp " : "Rp ") + s;
};

// Untuk kolom tabel yang headernya sudah mencantumkan "(Rp)" — isi baris tak perlu ulang "Rp"
const angkaSaja = (n) => {
  const abs = Math.abs(n);
  return (n < 0 ? "-" : "") + abs.toLocaleString("id-ID");
};

// Angka ringkas berskala otomatis (jt/M/T) — dipakai di kartu ringkasan agar tidak pernah merusak tata letak
const SATUAN_RINGKAS = [
  { bagi: 1_000_000_000_000, label: "T" },
  { bagi: 1_000_000_000, label: "M" },
  { bagi: 1_000_000, label: "jt" },
];

const cariSatuan = (abs) => {
  const idx = SATUAN_RINGKAS.findIndex((s) => abs >= s.bagi);
  return SATUAN_RINGKAS[idx === -1 ? SATUAN_RINGKAS.length - 1 : idx];
};

// Potong ke 1 desimal (truncate, BUKAN bulatkan) untuk satuan jt/M/T.
// Desimal cuma tampil kalau tidak nol; "+" cuma muncul kalau memang ada digit yang disembunyikan.
const formatSatuanBesar = (abs, bagi, label) => {
  const terpotong = Math.floor((abs / bagi) * 10) / 10;
  const bagianBulat = Math.floor(terpotong);
  const bagianDesimal = Math.round((terpotong - bagianBulat) * 10);
  const adaDisembunyikan = abs / bagi > terpotong + 1e-9;
  const teksAngka = bagianDesimal === 0 ? `${bagianBulat}` : `${bagianBulat},${bagianDesimal}`;
  return `${teksAngka} ${label}${adaDisembunyikan ? "+" : ""}`;
};

// Format ringkas untuk kartu (Pemasukan/Pengeluaran, dsb):
// < Rp10rb tampil penuh, Rp10rb–999rb pakai "rb" (bulat, tanpa desimal), ≥Rp1jt pakai jt/M/T (1 desimal)

// Format tampilan nominal untuk area sempit (card, ringkasan, saldo). Input tetap
// menyimpan angka penuh; hanya teks presentasinya yang dibuat adaptif agar tidak
// pernah menabrak area lain.
const rupiahRingkasArea = (nilai) => {
  const angka = Number(nilai) || 0;
  const negatif = angka < 0;
  const abs = Math.abs(angka);
  const satuan = [
    { batas: 1e12, pembagi: 1e12, label: "t" },
    { batas: 1e9, pembagi: 1e9, label: "m" },
    { batas: 1e6, pembagi: 1e6, label: "jt" },
    { batas: 1e4, pembagi: 1e3, label: "rb" },
  ].find((item) => abs >= item.batas);
  const isi = satuan
    ? `${formatDesimalAdaptif(abs / satuan.pembagi)} ${satuan.label}`
    : abs.toLocaleString("id-ID");
  return `${negatif ? "-" : ""}Rp ${isi}`;
};

// Format untuk Saldo Total: tampil penuh sampai < Rp10jt (±7 digit), di atasnya pakai jt/M/T (tanpa tahap "rb")

// Ubah angka menjadi teks terbilang Bahasa Indonesia, mis. 1250000 -> "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah"
const SATUAN_TERBILANG = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
const terbilangAngka = (n) => {
  if (n < 12) return SATUAN_TERBILANG[n];
  if (n < 20) return `${terbilangAngka(n - 10)} Belas`;
  if (n < 100) return `${terbilangAngka(Math.floor(n / 10))} Puluh${n % 10 !== 0 ? " " + terbilangAngka(n % 10) : ""}`;
  if (n < 200) return `Seratus${n % 100 !== 0 ? " " + terbilangAngka(n % 100) : ""}`;
  if (n < 1000) return `${terbilangAngka(Math.floor(n / 100))} Ratus${n % 100 !== 0 ? " " + terbilangAngka(n % 100) : ""}`;
  if (n < 2000) return `Seribu${n % 1000 !== 0 ? " " + terbilangAngka(n % 1000) : ""}`;
  if (n < 1_000_000) return `${terbilangAngka(Math.floor(n / 1000))} Ribu${n % 1000 !== 0 ? " " + terbilangAngka(n % 1000) : ""}`;
  if (n < 1_000_000_000) return `${terbilangAngka(Math.floor(n / 1_000_000))} Juta${n % 1_000_000 !== 0 ? " " + terbilangAngka(n % 1_000_000) : ""}`;
  if (n < 1_000_000_000_000) return `${terbilangAngka(Math.floor(n / 1_000_000_000))} Miliar${n % 1_000_000_000 !== 0 ? " " + terbilangAngka(n % 1_000_000_000) : ""}`;
  return `${terbilangAngka(Math.floor(n / 1_000_000_000_000))} Triliun${n % 1_000_000_000_000 !== 0 ? " " + terbilangAngka(n % 1_000_000_000_000) : ""}`;
};

// ---------- FORMAT NOMINAL ADAPTIF (dipakai di seluruh aplikasi KECUALI Beranda) ----------
// Format nominal adaptif untuk area aplikasi di luar ringkasan utama Beranda.
// Di bawah Rp10 Miliar tampil angka penuh; mulai Rp10 Miliar
// disingkat ke satuan besar Indonesia (Miliar → Triliun → Kuadriliun → …), dan daftar satuan
// ini bisa ditambah kapan saja tanpa mengubah logika perhitungannya.
const SATUAN_BESAR_ID = [
  { bagi: 1e9, label: "Miliar" },
  { bagi: 1e12, label: "Triliun" },
  { bagi: 1e15, label: "Kuadriliun" },
  { bagi: 1e18, label: "Kuintiliun" },
  { bagi: 1e21, label: "Sekstiliun" },
  { bagi: 1e24, label: "Septiliun" },
  { bagi: 1e27, label: "Oktiliun" },
  { bagi: 1e30, label: "Noniliun" },
  { bagi: 1e33, label: "Desiliun" },
];
const AMBANG_SINGKAT_BESAR = 10_000_000_000; // Rp10 Miliar

const cariSatuanBesar = (abs) => {
  let cocok = SATUAN_BESAR_ID[0];
  for (const s of SATUAN_BESAR_ID) {
    if (abs >= s.bagi) cocok = s;
  }
  return cocok;
};

// Maks. 2 desimal, dibulatkan (bukan dipotong), nol di belakang koma dihilangkan.
// 12.50 -> "12,5"  |  15.00 -> "15"  |  12.505 -> "12,51"
const formatDesimalAdaptif = (n) => {
  const dibulatkan = Math.round(n * 100) / 100;
  const [bulat, desimal] = dibulatkan.toFixed(2).split(".");
  const desimalRingkas = desimal.replace(/0+$/, "");
  return desimalRingkas ? `${bulat},${desimalRingkas}` : bulat;
};

// Versi dengan prefiks "Rp"/"-Rp" — dipakai di card, detail, ringkasan, dsb.
const rupiahBesar = (n) => {
  const neg = n < 0;
  const abs = Math.abs(n);
  if (abs < AMBANG_SINGKAT_BESAR) return rupiah(n);
  const { bagi, label } = cariSatuanBesar(abs);
  return (neg ? "-Rp " : "Rp ") + `${formatDesimalAdaptif(abs / bagi)} ${label}`;
};

// Versi tanpa prefiks "Rp" — dipakai di kolom tabel yang headernya sudah mencantumkan "(Rp)"
// (mengikuti pola angkaSaja), supaya tidak dobel menulis "Rp".
const angkaBesar = (n) => {
  const neg = n < 0;
  const abs = Math.abs(n);
  if (abs < AMBANG_SINGKAT_BESAR) return angkaSaja(n);
  const { bagi, label } = cariSatuanBesar(abs);
  return (neg ? "-" : "") + `${formatDesimalAdaptif(abs / bagi)} ${label}`;
};

// Helper format angka Indonesia (pemisah ribuan ".") — dipakai ulang oleh semua input nominal
const angkaMurni = (str) => (str || "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
const formatRibuan = (digitStr) => (digitStr ? digitStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");

// ---------- NOMINAL RESPONSIF (GLOBAL) ----------
// Satu algoritma yang sama dipakai di SELURUH aplikasi untuk menampilkan nominal uang.
// Angka tidak pernah dipotong/di-ellipsis — yang beradaptasi hanyalah satuan (Ribu→Rb, dst,
// singkatan konsisten di seluruh app), dipilih berdasarkan ruang yang benar-benar tersedia
// (bukan berdasar besar angka atau halaman). Bila bahkan bentuk paling ringkas masih tidak
// muat, ukuran font diperkecil secara proporsional (bukan ellipsis) sampai batas minimum.
const SATUAN_NOMINAL = [
  { bagi: 1e3, singkat: "Rb" },
  { bagi: 1e6, singkat: "Jt" },
  { bagi: 1e9, singkat: "M" },
  { bagi: 1e12, singkat: "T" },
  { bagi: 1e15, singkat: "Q" },
  { bagi: 1e18, singkat: "Qi" },
  { bagi: 1e21, singkat: "Sx" },
  { bagi: 1e24, singkat: "Sp" },
  { bagi: 1e27, singkat: "O" },
  { bagi: 1e30, singkat: "N" },
  { bagi: 1e33, singkat: "D" },
];

const cariSatuanNominal = (abs) => {
  let cocok = null;
  for (const s of SATUAN_NOMINAL) {
    if (abs >= s.bagi) cocok = s;
    else break;
  }
  return cocok; // null bila < 1000 (angka penuh sudah paling ringkas)
};

// Bangun daftar opsi tampilan dari yang paling lengkap -> paling ringkas (angka tidak pernah
// berubah/terpotong; maks. 2 desimal, dibulatkan, ",00" dihilangkan lewat formatDesimalAdaptif)
const opsiNominal = (n, prefix = "Rp ") => {
  const bulat = Math.round(n);
  const neg = bulat < 0;
  const abs = Math.abs(bulat);
  const tanda = neg ? "-" : "";
  const penuh = `${tanda}${prefix}${abs.toLocaleString("id-ID")}`;
  const satuan = cariSatuanNominal(abs);
  if (!satuan) return [penuh];
  const angka = formatDesimalAdaptif(abs / satuan.bagi);
  return [penuh, `${tanda}${prefix}${angka} ${satuan.singkat}`];
};

// Kanvas terbagi untuk mengukur lebar teks sesuai font elemen sesungguhnya
let _kanvasUkur = null;
const lebarTeksPx = (teks, font) => {
  if (!_kanvasUkur) _kanvasUkur = document.createElement("canvas");
  const ctx = _kanvasUkur.getContext("2d");
  ctx.font = font;
  return ctx.measureText(teks).width;
};

// Komponen tampilan nominal — mengukur ruang yang BENAR-BENAR tersedia (lebar elemen hasil layout
// flex/grid/card induk, dihitung ulang otomatis setiap render/resize) lalu memilih representasi
// paling detail yang masih muat. Ukuran font SELALU tetap (bagian dari desain, tidak pernah
// diperkecil/diperbesar) — bila bentuk paling ringkas pun belum muat, bentuk paling ringkas itu
// tetap ditampilkan apa adanya (angka tidak pernah dipotong/ellipsis). Dipakai secara global; tidak
// ada logika khusus per halaman/card/besar nominal.
function Nominal({ n, prefix = "Rp ", className = "", style, block = true }) {
  const ref = useRef(null);
  const [lebar, setLebar] = useState(null);
  const fontRef = useRef(null); // font CSS aktual elemen, dipakai untuk mengukur lebar teks kandidat

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!fontRef.current) {
      const cs = getComputedStyle(el);
      fontRef.current = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    }
    const ukur = () => setLebar(el.getBoundingClientRect().width);
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const opsi = useMemo(() => opsiNominal(n, prefix), [n, prefix]);

  const teks = useMemo(() => {
    const font = fontRef.current;
    if (lebar == null || !font) return opsi[0];
    for (const kandidat of opsi) {
      if (lebarTeksPx(kandidat, font) <= lebar + 0.5) return kandidat;
    }
    // Bentuk paling ringkas pun belum muat — tetap tampilkan apa adanya (font tidak diperkecil,
    // angka tidak pernah dipotong/ellipsis).
    return opsi[opsi.length - 1];
  }, [lebar, opsi]);

  return (
    <span
      ref={ref}
      className={`${block ? "block w-full" : "inline-block max-w-full"} min-w-0 whitespace-nowrap ${className}`}
      style={style}
      title={opsi[0]}
    >
      {teks}
    </span>
  );
}

// Input nominal reusable: tampilkan format ribuan real-time, kursor stabil, value/onChange selalu angka murni tanpa titik
function InputNominal({ value, onChange, className = "", placeholder = "0", ...rest }) {
  const ref = useRef(null);
  const posRef = useRef(null);
  const tampilan = formatRibuan(value || "");

  useLayoutEffect(() => {
    if (posRef.current !== null && ref.current) {
      ref.current.setSelectionRange(posRef.current, posRef.current);
      posRef.current = null;
    }
  }, [tampilan]);

  const handleChange = (e) => {
    const input = e.target;
    const posLama = input.selectionStart ?? input.value.length;
    const digitSebelumKursor = input.value.slice(0, posLama).replace(/[^0-9]/g, "").length;
    const digitBaru = angkaMurni(input.value);
    const formattedBaru = formatRibuan(digitBaru);

    let hitung = 0;
    let posBaru = formattedBaru.length;
    if (digitSebelumKursor === 0) {
      posBaru = 0;
    } else {
      for (let i = 0; i < formattedBaru.length; i++) {
        if (/[0-9]/.test(formattedBaru[i])) hitung++;
        if (hitung === digitSebelumKursor) {
          posBaru = i + 1;
          break;
        }
      }
    }

    posRef.current = posBaru;
    onChange(digitBaru);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      value={tampilan}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}

const BULAN_ID = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
const parseTglID = (str) => {
  if (typeof str !== "string") return NaN;
  const bagian = str.trim().split(/\s+/);
  if (bagian.length !== 3) return NaN;

  const [d, b, y] = bagian;
  const hari = Number(d);
  const tahun = Number(y);
  const bulan = BULAN_ID[b];
  if (!Number.isInteger(hari) || !Number.isInteger(tahun) || bulan == null) return NaN;

  const tanggal = new Date(tahun, bulan, hari);
  // Validasi ulang agar tanggal seperti 31 Feb tidak diam-diam bergeser ke bulan lain.
  if (
    tanggal.getFullYear() !== tahun ||
    tanggal.getMonth() !== bulan ||
    tanggal.getDate() !== hari
  ) return NaN;

  tanggal.setHours(0, 0, 0, 0);
  return tanggal.getTime();
};

// "YYYY-MM-DD" (input type=date) -> "7 Mei 2026" (format tampilan aplikasi)
const formatTglDariInput = (isoStr) => {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// "7 Mei 2026" -> "2026-05-07" (untuk value input type=date)
const BULAN_KE_ANGKA = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06", Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12" };
const tglKeInput = (str) => {
  if (!str) return "";
  const [d, b, y] = str.split(" ");
  return `${y}-${BULAN_KE_ANGKA[b] ?? "01"}-${String(d).padStart(2, "0")}`;
};

const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---------- TRANSAKSI TERJADWAL ----------
// Transaksi dengan tanggal di masa depan berstatus "Terjadwal" dan belum dihitung
// ke saldo/statistik. Status dihitung dari tanggal, jadi otomatis berubah
// menjadi "Selesai" begitu tanggalnya tiba.
const akhirHariIni = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
};

const isTanggalTerjadwal = (tglID) => !!tglID && parseTglID(tglID) > akhirHariIni();
const isTerjadwal = (t) => isTanggalTerjadwal(t?.tgl);

// transaksi yang sudah efektif (status Selesai) — dipakai untuk semua perhitungan
const transaksiEfektifDari = (daftar) => daftar.filter((t) => !isTerjadwal(t));

// Klasifikasi transaksi: hanya transaksi operasional yang membentuk ringkasan
// Pemasukan/Pengeluaran. Mutasi hutang, piutang, dan transfer hanya memindahkan
// posisi keuangan sehingga tetap memengaruhi saldo, tetapi tidak menjadi pendapatan
// atau biaya operasional (kecuali biaya/bunga yang memang dicatat terpisah).
const TIPE_NON_OPERASIONAL = new Set([
  "transfer",
  "pencairan-hutang",
  "pembayaran-hutang",
  "pemberian-piutang",
  "pembayaran-piutang",
  "pembayaran-cicilan",
]);
const isTransaksiOperasional = (t) => !TIPE_NON_OPERASIONAL.has(t?.tipe);
const transaksiOperasionalDari = (daftar = []) => daftar.filter(isTransaksiOperasional);
const akunVirtualLabel = (id) =>
  id === "bank-transaksi" ? "Bank" : id === "ewallet-transaksi" ? "E-Wallet" : "Kas";

// re-render otomatis saat hari berganti supaya status Terjadwal ikut diperbarui
function useHariIni() {
  const [hari, setHari] = useState(todayInput());
  useEffect(() => {
    const timer = setInterval(() => {
      const kini = todayInput();
      setHari((prev) => (prev === kini ? prev : kini));
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  return hari;
}

// Snapshot bulanan Total Aset/Hutang/Kekayaan Bersih — dasar perhitungan tren "vs bulan
// lalu" pada kartu ringkasan Aset. Snapshot bulan berjalan terus ditimpa dengan nilai
// terbaru; bulan-bulan sebelumnya tidak pernah disentuh lagi begitu bulan berganti,
// sehingga jadi angka pembanding yang benar-benar tercatat (bukan estimasi/rekaan).
const KUNCI_SNAPSHOT_ASET = "buku-kas-snapshot-aset-bulanan";

function bacaSnapshotAsetBulanan() {
  try {
    const raw = localStorage.getItem(KUNCI_SNAPSHOT_ASET);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function simpanSnapshotAsetBulanan(data) {
  try {
    localStorage.setItem(KUNCI_SNAPSHOT_ASET, JSON.stringify(data));
  } catch {
    // localStorage tidak tersedia/penuh — tren cukup tidak tampil, tidak fatal
  }
}

// null artinya tren tidak bisa dihitung (belum ada data pembanding) — pemanggil WAJIB
// menampilkan fallback yang jelas, bukan memaksakan angka 0%.
function persenPerubahan(sekarang, lalu) {
  if (lalu === undefined || lalu === null) return null;
  if (lalu === 0) return sekarang === 0 ? 0 : null;
  return ((sekarang - lalu) / Math.abs(lalu)) * 100;
}

// Baris kecil "+x,xx% dari bulan lalu" di kartu ringkasan. indikatorNaikBaik menandai
// apakah kenaikan itu hal baik (Aset/Kekayaan Bersih) atau buruk (Hutang, naik = merah).
function BarisTren({ persen, indikatorNaikBaik = true, warnaNetral }) {
  if (persen === null) {
    return <div className="text-[10px] mt-1.5" style={{ color: warnaNetral }}>Data bulan lalu belum ada</div>;
  }
  const naik = persen >= 0;
  const bagus = indikatorNaikBaik ? naik : !naik;
  const warna = bagus ? "#2F6F5E" : "#B5533C";
  const Ikon = naik ? ArrowUp : ArrowDown;
  const teks = Math.abs(persen).toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return (
    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-medium" style={{ color: warna }}>
      <Ikon size={10} />
      <span>{naik ? "+" : "-"}{teks}%</span>
      <span className="font-normal" style={{ color: warnaNetral }}>dari bulan lalu</span>
    </div>
  );
}

// Badge "Terjadwal" — hanya untuk data bertanggal masa depan. Transaksi biasa
// tidak punya status, jadi tidak diberi badge apa pun.
// Style identik dengan badge status "Aktif" di menu Hutang & Piutang.
// Lebar badge status disamakan (berdasarkan teks terpanjang, "Menunggu Saldo") agar
// seluruh card terlihat rapi & sejajar, teks tetap center — bukan mengikuti panjang tulisan.
// Badge dibuat menyerupai chip modern: pipih (padding vertikal tipis), lebar
// mengikuti isi teks (padding horizontal lebih longgar), teks center.
const KELAS_BADGE_DASAR = "text-[10px] leading-none font-medium px-2.5 py-[3px] rounded-full inline-block whitespace-nowrap";

const KELAS_BADGE_TERJADWAL = `${KELAS_BADGE_DASAR} text-[#8B8579] bg-[#EFEBDD]`;

function BadgeTerjadwal() {
  return <span className={KELAS_BADGE_TERJADWAL}>Terjadwal</span>;
}

// Badge "Menunggu Saldo" — tanggal eksekusi sudah tiba tapi saldo akun tidak cukup.
// Warna kuning/oranye lembut (bukan merah) karena ini bukan error, hanya butuh tindakan.
const KELAS_BADGE_MENUNGGU_SALDO = `${KELAS_BADGE_DASAR} text-[#966A22] bg-[#F5E9D2]`;

function BadgeMenungguSaldo() {
  return <span className={KELAS_BADGE_MENUNGGU_SALDO}>Menunggu Saldo</span>;
}

// Transaksi pernah berstatus Terjadwal bila sedang Terjadwal sekarang, atau
// ditandai pernah terjadwal saat dibuat/diedit (lihat flag `terjadwal` di FormTambah/transferDana)
const pernahTerjadwalTransaksi = (t) => t?.terjadwal === true || isTerjadwal(t);

const buatId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const NAMA_PENGGUNA = "Tania";
// Pastikan sapaan selalu menampilkan satu nama saja meski data pengguna
// tersimpan ganda, misalnya "Tania, Tania" atau "Tania Tania".
const namaPenggunaRingkas = (nama = NAMA_PENGGUNA) => {
  const bagian = String(nama)
    .split(/[;,]+|\s{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const unik = bagian.filter((item, index, daftar) =>
    daftar.findIndex((nilai) => nilai.toLowerCase() === item.toLowerCase()) === index
  );
  return unik[0] || "Pengguna";
};

const salamWaktu = () => {
  const jam = new Date().getHours();
  if (jam >= 5 && jam < 11) return `Selamat Pagi, ${namaPenggunaRingkas()}`;
  if (jam >= 11 && jam < 15) return `Selamat Siang, ${namaPenggunaRingkas()}`;
  if (jam >= 15 && jam < 18) return `Selamat Sore, ${namaPenggunaRingkas()}`;
  return `Selamat Malam, ${namaPenggunaRingkas()}`;
};

// Hitung rentang tanggal (timestamp) berdasarkan pilihan filter laporan
function rentangTanggal(rentang, dariKustom, sampaiKustom) {
  const now = new Date();
  const mulaiHari = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const akhirHari = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

  if (rentang === "hari") return { dari: mulaiHari(now), sampai: akhirHari(now) };

  if (rentang === "minggu") {
    const dow = (now.getDay() + 6) % 7; // 0 = Senin
    const senin = new Date(now);
    senin.setDate(now.getDate() - dow);
    const minggu = new Date(senin);
    minggu.setDate(senin.getDate() + 6);
    return { dari: mulaiHari(senin), sampai: akhirHari(minggu) };
  }

  if (rentang === "bulan") {
    const awal = new Date(now.getFullYear(), now.getMonth(), 1);
    const akhir = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { dari: mulaiHari(awal), sampai: akhirHari(akhir) };
  }

  if (rentang === "tahun") {
    return { dari: mulaiHari(new Date(now.getFullYear(), 0, 1)), sampai: akhirHari(new Date(now.getFullYear(), 11, 31)) };
  }

  // kustom
  if (dariKustom && sampaiKustom) {
    const [y1, m1, d1] = dariKustom.split("-").map(Number);
    const [y2, m2, d2] = sampaiKustom.split("-").map(Number);
    return { dari: mulaiHari(new Date(y1, m1 - 1, d1)), sampai: akhirHari(new Date(y2, m2 - 1, d2)) };
  }
  return { dari: -Infinity, sampai: Infinity };
}

const JENIS_DATA_OPSI = [
  ["semua", "Semua"],
  ["pemasukan", "Pemasukan"],
  ["pengeluaran", "Pengeluaran"],
  ["aset", "Aset"],
  ["hutang", "Hutang"],
  ["piutang", "Piutang"],
];
const RENTANG_OPSI = [
  ["hari", "Hari Ini"],
  ["minggu", "Minggu Ini"],
  ["bulan", "Bulan Ini"],
  ["tahun", "Tahun Ini"],
  ["kustom", "Kustom"],
];

function statusHutang(item) {
  const sisa = Math.max(0, Number(item.jumlah || 0) - Number(item.terbayar || 0));
  // Status Hangus disiapkan khusus piutang yang sudah tidak mempunyai nilai ekonomis.
  // Piutang hangus tetap tersimpan sebagai riwayat, tetapi dikeluarkan dari Total Aset
  // dan tidak dapat dipakai sebagai saldo/transaksi sampai ada pembayaran nyata.
  if (item.jenis === "piutang" && (item.hangus === true || item.statusManual === "Hangus")) {
    return { sisa, status: "Hangus" };
  }
  // Belum aktif: tanggal pencatatan masih di masa depan (Terjadwal -> Aktif -> Lunas)
  if (isTanggalTerjadwal(item.tanggal)) return { sisa, status: "Terjadwal" };
  if (sisa <= 0) return { sisa, status: "Lunas" };

  if (!item.jatuhTempo) return { sisa, status: "Aktif" };
  const jatuhTempoTs = parseTglID(item.jatuhTempo);
  const hariIni = new Date().setHours(0, 0, 0, 0);
  if (jatuhTempoTs >= hariIni) return { sisa, status: "Aktif" };
  const hariTerlambat = Math.floor((hariIni - jatuhTempoTs) / 86400000);
  return { sisa, status: hariTerlambat > 90 ? "Gagal Bayar" : "Terlambat" };
}

// Hutang/Piutang aktif ditampilkan sebagai aktivitas keuangan mandiri tanpa
// mengubah saldo transaksi. Catatan Terjadwal dan Lunas tidak dibuat ulang di
// Data Transaksi karena belum/ tidak lagi memerlukan representasi aktivitas aktif.
function aktivitasAktifHutangPiutang(daftar = []) {
  return daftar.flatMap((item) => {
    const info = statusHutang(item);
    if (info.status === "Terjadwal" || info.status === "Lunas") return [];
    const piutang = item.jenis === "piutang";
    return [{
      id: `relasi-${item.id}`,
      nama: piutang ? `Piutang — ${item.nama}` : `Hutang — ${item.nama}`,
      tgl: item.tanggal,
      kat: piutang ? "Piutang" : "Hutang",
      metode: piutang ? "Dana dipinjamkan" : "Dana pinjaman",
      jumlah: piutang ? -Math.abs(item.jumlah) : Math.abs(item.jumlah),
      tipe: piutang ? "piutang-aktif" : "hutang-aktif",
      statusRelasi: info.status,
      sumberData: "hutang-piutang",
      nonSaldo: true,
      relasiId: item.id,
    }];
  });
}

const KATEGORI_ASET = ["Kas & Bank", "E-Wallet", "Tabungan", "Investasi", "Kendaraan", "Properti", "Barang Berharga"];
// Kategori tampilan di halaman Aset (termasuk Piutang, yang datanya otomatis dari menu Hutang — bukan input manual)
const KATEGORI_ASET_TAMPIL = [...KATEGORI_ASET, "Piutang"];
const IKON_KATEGORI_ASET = {
  "Kas & Bank": Landmark,
  "E-Wallet": Smartphone,
  Tabungan: PiggyBank,
  Investasi: TrendingUp,
  Kendaraan: Car,
  Properti: Building2,
  "Barang Berharga": Gem,
  Piutang: HandCoins,
};
const WARNA_KATEGORI_ASET = {
  "Kas & Bank": "#3E7CB1",
  "E-Wallet": "#C9A24B",
  Tabungan: "#C9A24B",
  Investasi: "#5B7B8C",
  Kendaraan: "#B5533C",
  Properti: "#A3763F",
  "Barang Berharga": "#8B8579",
  Piutang: "#3F8F7A",
};

const PALET_KATEGORI = ["#2F6F5E", "#C9A24B", "#B5533C", "#5B7B8C", "#A3763F", "#8B8579"];
// ---------- FORM ASET: sub-jenis per kategori (Investasi, Tabungan, Kendaraan, Properti, Barang Berharga) ----------
// Daftar bawaan (maksimal 4 pilihan utama + "Lainnya"). Kategori di luar daftar ini
// (mis. Kas & Bank, E-Wallet) tidak memakai dropdown Jenis.
const JENIS_ASET_DEFAULT = {
  Investasi: ["Deposito", "Saham", "Reksa Dana", "Obligasi", "Lainnya"],
  Tabungan: ["Darurat", "Pendidikan", "Haji", "Lainnya"],
  Kendaraan: ["Motor", "Mobil", "Truk", "Lainnya"],
  Properti: ["Rumah", "Tanah", "Apartemen", "Ruko", "Lainnya"],
  "Barang Berharga": ["Emas", "Perhiasan", "Jam Tangan", "Barang Koleksi", "Lainnya"],
};
const KATEGORI_PUNYA_JENIS = Object.keys(JENIS_ASET_DEFAULT);

// Kategori aset yang saldonya benar-benar dapat dipindahkan (dipakai sebagai Sumber/Tujuan
// Dana di Transfer & Kelola, dan sebagai pilihan Akun di form Pemasukan/Pengeluaran).
// Aset fisik (Kendaraan, Properti, Barang Berharga) sengaja dikecualikan karena harus
// melalui transaksi jual-beli di menu Aset, bukan dipindah langsung.
const KATEGORI_AKUN_TRANSFERABLE = ["Kas & Bank", "E-Wallet", "Tabungan", "Investasi"];

// Jenis buatan pengguna disimpan terpisah per kategori & bersifat persistent,
// supaya daftar bawaan (KATEGORI_ASET, JENIS_ASET_DEFAULT) tidak pernah tersentuh.
function muatJenisAsetCustom() {
  try {
    const saved = localStorage.getItem("buku-kas-jenis-aset-custom");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // abaikan, pakai daftar kosong
  }
  return {};
}
function simpanJenisAsetCustom(data) {
  try {
    localStorage.setItem("buku-kas-jenis-aset-custom", JSON.stringify(data));
  } catch (e) {
    // abaikan
  }
}

// ---------- RINGKASAN ASET: struktur kartu (fondasi) ----------
// Konfigurasi khusus untuk grid kartu di menu Ringkasan Aset — TERPISAH dari
// KATEGORI_ASET_TAMPIL (yang tetap dipakai apa adanya oleh Data Aset, filter,
// sorting, dan FormAset) agar perubahan tampilan Ringkasan tidak memengaruhi
// fitur-fitur tersebut.
//
// `filterKategori` menyimpan daftar kategori KATEGORI_ASET_TAMPIL yang akan
// dipakai untuk mengarahkan & memfilter otomatis ke halaman Data Aset saat
// kartu ini diklik — fondasi untuk tahap pengembangan berikutnya. Navigasi
// klik BELUM diaktifkan pada tahap ini.
const RINGKASAN_ASET_FINANSIAL = [
  { key: "saldo-total", label: "Saldo Transaksi", sub: "Kas, Bank & E-Wallet", ikon: Landmark, warna: "#2F6F5E", warnaSub: "#7C9C8E", filterKategori: ["Kas & Bank", "E-Wallet"] },
  { key: "tabungan", label: "Tabungan", sub: "Darurat, Haji & Pendidikan", ikon: PiggyBank, warna: "#C9A24B", warnaSub: "#B9A06B", filterKategori: ["Tabungan"] },
  { key: "investasi", label: "Investasi", sub: "Saham, Reksa Dana & Lainnya", ikon: TrendingUp, warna: "#5B7B8C", warnaSub: "#7C97A0", filterKategori: ["Investasi"] },
  { key: "piutang", label: "Piutang", sub: "Pribadi, Usaha & Lainnya", ikon: HandCoins, warna: "#3F8F7A", warnaSub: "#6FA089", filterKategori: ["Piutang"] },
];
const RINGKASAN_ASET_FISIK = [
  { key: "kendaraan", label: "Kendaraan", sub: "Motor, Mobil & Lainnya", ikon: Car, warna: "#B5533C", warnaSub: "#B98671", filterKategori: ["Kendaraan"] },
  { key: "properti", label: "Properti", sub: "Rumah, Apartemen & Lainnya", ikon: Building2, warna: "#A3763F", warnaSub: "#AD9270", filterKategori: ["Properti"] },
  { key: "barang-berharga", label: "Barang Berharga", sub: "Emas, Perak & Lainnya", ikon: Gem, warna: "#8B8579", warnaSub: "#B7A06E", filterKategori: ["Barang Berharga"] },
];
function hitungKategori(transaksi) {
  const pengeluaranList = transaksi.filter((t) => t.jumlah < 0);
  const total = pengeluaranList.reduce((a, t) => a + Math.abs(t.jumlah), 0);
  if (!total) return [];
  const map = {};
  pengeluaranList.forEach((t) => {
    map[t.kat] = (map[t.kat] || 0) + Math.abs(t.jumlah);
  });
  return Object.entries(map)
    .map(([name, val], i) => ({ name, value: Math.round((val / total) * 100), color: PALET_KATEGORI[i % PALET_KATEGORI.length] }))
    .sort((a, b) => b.value - a.value);
}

function hitungTren(transaksi) {
  const map = {};
  transaksi.forEach((t) => {
    if (!map[t.tgl]) map[t.tgl] = { tgl: t.tgl, masuk: 0, keluar: 0 };
    if (t.jumlah > 0) map[t.tgl].masuk += t.jumlah / 1000000;
    else map[t.tgl].keluar += Math.abs(t.jumlah) / 1000000;
  });
  return Object.values(map).sort((a, b) => parseTglID(a.tgl) - parseTglID(b.tgl));
}

// ---------- ELEMEN VISUAL ----------

// Dropdown kecil untuk header kartu Beranda (mis. pilih rentang periode / mode tampilan).
// Gaya & interaksi konsisten dengan popup Urutkan di menu Transaksi: rounded-xl, shadow tipis,
// menutup otomatis saat memilih atau saat klik di luar area.
function DropdownKecilBeranda({ opsi, aktif, onPilih, ikon: Ikon }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka]);

  const aktifOpt = opsi.find((o) => o.key === aktif) || opsi[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setBuka((v) => !v)}
        className={`flex items-center gap-1 rounded-full border pl-2.5 pr-2 py-1.5 text-[10.5px] font-medium whitespace-nowrap backdrop-blur-md transition-all ${
          buka
            ? "border-white/35 bg-[#1B2A26]/88 text-white shadow-sm"
            : "border-[#DDE5E1]/90 bg-white/42 text-[#1B2A26] shadow-[0_3px_12px_rgba(27,42,38,0.06)]"
        }`}
      >
        {Ikon && <Ikon size={11} className={buka ? "text-white/75" : "text-[#587068]"} />}
        {aktifOpt.label}
        <ChevronDown size={11} className={`transition-transform duration-200 ${buka ? "rotate-180 text-white/75" : "text-[#6E7D77]"}`} />
      </button>

      <div
        className={`absolute top-full right-0 mt-1.5 min-w-[136px] origin-top-right z-20 transition-all duration-150 ease-out ${
          buka ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="rounded-xl border border-white/65 bg-white/82 backdrop-blur-xl shadow-[0_12px_28px_rgba(27,42,38,0.13)] overflow-hidden">
          <div className="divide-y divide-[#E8EEEB]/80">
            {opsi.map((o) => (
              <button
                key={o.key}
                onClick={() => { onPilih(o.key); setBuka(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
              >
                <span className={`text-[12.5px] ${aktif === o.key ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>{o.label}</span>
                {aktif === o.key && <Check size={13} className="text-[#1B2A26]" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- LAYAR: BERANDA ----------
function Beranda({ goTo, onBukaDetail, transaksi, saldo, pemasukan, pengeluaran, aset = [], hutang = [], anggaran = [], targetMenabung = [], cicilan = [], onBukaRencana, onPilihFab }) {
  const adaData = transaksi.length > 0;
  const cashFlow = pemasukan - pengeluaran;
  const [saldoTersembunyi, setSaldoTersembunyi] = useState(false);
  const [rentangArus, setRentangArus] = useState("7hari");
  const [tipeGrafikArus, setTipeGrafikArus] = useState("batang");
  const JUMLAH_INSIGHT = 6;
  const [insightAktif, setInsightAktif] = useState(() => {
    try {
      const sebelumnya = Number(window.localStorage.getItem("bukukas-insight-aktif"));
      const berikutnya = Number.isFinite(sebelumnya) ? (sebelumnya + 1) % JUMLAH_INSIGHT : 0;
      window.localStorage.setItem("bukukas-insight-aktif", String(berikutnya));
      return berikutnya;
    } catch {
      return 0;
    }
  });

  const pindahInsight = (arah) => {
    setInsightAktif((index) => {
      const berikutnya = (index + arah + JUMLAH_INSIGHT) % JUMLAH_INSIGHT;
      try {
        window.localStorage.setItem("bukukas-insight-aktif", String(berikutnya));
      } catch {
        // Penyimpanan lokal bersifat opsional; carousel tetap berfungsi tanpa ini.
      }
      return berikutnya;
    });
  };

  const nonTransfer = useMemo(
    () => transaksiOperasionalDari(transaksi),
    [transaksi]
  );

  // Saldo Total adalah posisi uang likuid saat ini (Kas + Bank + E-Wallet),
  // sedangkan tiga kartu kecil selalu memakai periode bulan berjalan.
  const ringkasanUtama = useMemo(() => {
    const sekarang = new Date();
    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1).getTime();
    const awalBulanDepan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 1).getTime();
    const bulanIni = nonTransfer.filter((t) => {
      const waktu = parseTglID(t.tgl);
      return Number.isFinite(waktu) && waktu >= awalBulan && waktu < awalBulanDepan;
    });
    const totalPemasukan = bulanIni
      .filter((t) => Number(t.jumlah) > 0)
      .reduce((jumlah, t) => jumlah + (Number(t.jumlah) || 0), 0);
    const totalPengeluaran = Math.abs(
      bulanIni
        .filter((t) => Number(t.jumlah) < 0)
        .reduce((jumlah, t) => jumlah + (Number(t.jumlah) || 0), 0)
    );
    const cashFlow = totalPemasukan - totalPengeluaran;
    return { totalPemasukan, totalPengeluaran, cashFlow, saldoTotal: Number(saldo) || 0 };
  }, [nonTransfer, saldo]);

  const tren = useMemo(() => {
    const now = new Date();
    const awalIni = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const awalDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const awalLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const total = (arr, positif) =>
      arr
        .filter((t) => (positif ? t.jumlah > 0 : t.jumlah < 0))
        .reduce((sum, t) => sum + Math.abs(Number(t.jumlah) || 0), 0);

    const txIni = nonTransfer.filter((t) => {
      const waktu = parseTglID(t.tgl);
      return Number.isFinite(waktu) && waktu >= awalIni && waktu < awalDepan;
    });
    const txLalu = nonTransfer.filter((t) => {
      const waktu = parseTglID(t.tgl);
      return Number.isFinite(waktu) && waktu >= awalLalu && waktu < awalIni;
    });

    const masukIni = total(txIni, true);
    const keluarIni = total(txIni, false);
    const masukLalu = total(txLalu, true);
    const keluarLalu = total(txLalu, false);
    const cashFlowIni = masukIni - keluarIni;
    const cashFlowLalu = masukLalu - keluarLalu;

    // Tren selalu membandingkan bulan kalender berjalan dengan bulan kalender sebelumnya.
    // Saat pembanding nol, jangan memaksakan angka 100%; tampilkan status "Baru" agar tidak menyesatkan.
    const hitungTren = (sekarang, lalu, jenis) => {
      const selisih = sekarang - lalu;
      if (sekarang === 0 && lalu === 0) {
        return { status: "tetap", persen: 0, arah: "tetap", membaik: true };
      }
      if (lalu === 0) {
        const arah = selisih > 0 ? "naik" : selisih < 0 ? "turun" : "tetap";
        const membaik = jenis === "pengeluaran" ? arah !== "naik" : arah !== "turun";
        return { status: "baru", persen: null, arah, membaik };
      }
      const persen = (selisih / Math.abs(lalu)) * 100;
      const arah = selisih > 0 ? "naik" : selisih < 0 ? "turun" : "tetap";
      const membaik = jenis === "pengeluaran" ? arah !== "naik" : arah !== "turun";
      return { status: "persen", persen, arah, membaik };
    };

    return {
      pemasukan: hitungTren(masukIni, masukLalu, "pemasukan"),
      pengeluaran: hitungTren(keluarIni, keluarLalu, "pengeluaran"),
      cashFlow: hitungTren(cashFlowIni, cashFlowLalu, "cashFlow"),
      masukIni,
      keluarIni,
      cashFlowIni,
      masukLalu,
      keluarLalu,
      cashFlowLalu,
    };
  }, [nonTransfer]);

  const kondisiKeuangan = useMemo(() => {
    const pemasukanTotal = Number(ringkasanUtama.totalPemasukan) || 0;
    const pengeluaranTotal = Number(ringkasanUtama.totalPengeluaran) || 0;
    const saldoTotal = Number(ringkasanUtama.saldoTotal) || 0;

    if (pemasukanTotal === 0 && pengeluaranTotal === 0) {
      return { label: "Belum ada data", icon: Info, tone: "netral" };
    }
    if (saldoTotal < 0) {
      return { label: "Minus", icon: TrendingDown, tone: "warning" };
    }
    return { label: "Sehat", icon: ShieldCheck, tone: "sehat" };
  }, [ringkasanUtama]);

  const dataArus = useMemo(() => {
    const batasPeriode = rentangArus === "12bulan" ? 12 : 7;

    const jumlahArus = (daftar, positif) => daftar
      .filter((item) => (positif ? Number(item.jumlah) > 0 : Number(item.jumlah) < 0))
      .reduce((sum, item) => sum + Math.abs(Number(item.jumlah) || 0), 0);

    const normalisasiHari = (waktu) => {
      const tanggal = new Date(waktu);
      tanggal.setHours(0, 0, 0, 0);
      return tanggal;
    };

    const awalBulan = (waktu) => {
      const tanggal = new Date(waktu);
      return new Date(tanggal.getFullYear(), tanggal.getMonth(), 1);
    };

    // Timeline ditentukan oleh seluruh transaksi efektif, bukan hanya jenis grafik
    // yang sedang dipilih. Dengan begitu mengganti Pemasukan/Pengeluaran atau
    // menghapus satu transaksi tidak membuat hari lain tiba-tiba berpindah/hilang.
    const semuaTanggalTimeline = nonTransfer
      .map((t) => parseTglID(t.tgl))
      .filter((waktu) => Number.isFinite(waktu))
      .sort((a, b) => a - b);

    const sekarang = normalisasiHari(Date.now());
    const tanggalPertama = semuaTanggalTimeline.length ? normalisasiHari(semuaTanggalTimeline[0]) : null;
    const tanggalTerakhir = semuaTanggalTimeline.length
      ? normalisasiHari(semuaTanggalTimeline[semuaTanggalTimeline.length - 1])
      : sekarang;

    if (rentangArus === "12bulan") {
      const namaBulan = Object.keys(BULAN_ID);
      const bulanPertama = tanggalPertama ? awalBulan(tanggalPertama) : new Date(sekarang.getFullYear(), sekarang.getMonth() - 11, 1);
      const bulanTerakhir = awalBulan(tanggalTerakhir);
      const selisihBulan =
        (bulanTerakhir.getFullYear() - bulanPertama.getFullYear()) * 12 +
        (bulanTerakhir.getMonth() - bulanPertama.getMonth());

      // Selama belum penuh 12 bulan, timeline dimulai dari bulan data pertama dan
      // bertambah ke kanan. Setelah penuh, jendela bergeser sehingga data terbaru
      // selalu berada di paling kanan.
      const bulanAwal = new Date(
        bulanPertama.getFullYear(),
        bulanPertama.getMonth() + Math.max(0, selisihBulan - (batasPeriode - 1)),
        1
      );

      return Array.from({ length: batasPeriode }, (_, index) => {
        const awal = new Date(bulanAwal.getFullYear(), bulanAwal.getMonth() + index, 1);
        const akhir = new Date(awal.getFullYear(), awal.getMonth() + 1, 1);
        const transaksiPeriode = nonTransfer.filter((t) => {
          const waktu = parseTglID(t.tgl);
          return waktu >= awal.getTime() && waktu < akhir.getTime();
        });
        return {
          label: namaBulan[awal.getMonth()],
          pemasukan: jumlahArus(transaksiPeriode, true),
          pengeluaran: jumlahArus(transaksiPeriode, false),
          adaData: transaksiPeriode.length > 0,
        };
      });
    }

    const hariPertama = tanggalPertama || new Date(sekarang.getTime() - (batasPeriode - 1) * 86400000);
    const selisihHari = Math.max(0, Math.round((tanggalTerakhir - hariPertama) / 86400000));

    // Ketika data belum memenuhi seluruh rentang, slot pertama tetap dimulai dari
    // hari data pertama. Hari kosong di tengah tetap dipertahankan. Setelah rentang
    // penuh, timeline bergeser satu hari demi satu hari dan data terbaru berada di kanan.
    const hariAwal = new Date(hariPertama);
    hariAwal.setDate(hariAwal.getDate() + Math.max(0, selisihHari - (batasPeriode - 1)));

    return Array.from({ length: batasPeriode }, (_, index) => {
      const tanggal = new Date(hariAwal);
      tanggal.setDate(hariAwal.getDate() + index);
      const transaksiHari = nonTransfer.filter((t) => {
        const tx = normalisasiHari(parseTglID(t.tgl));
        return tx.getTime() === tanggal.getTime();
      });
      return {
        label: HARI_ID[tanggal.getDay()],
        pemasukan: jumlahArus(transaksiHari, true),
        pengeluaran: jumlahArus(transaksiHari, false),
        adaData: transaksiHari.length > 0,
      };
    });
  }, [nonTransfer, rentangArus]);

  const insight = useMemo(() => {
    const now = new Date();
    const awalIni = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const awalDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const awalLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const perubahan = (sekarang, lalu, jenis = "positif") => {
      const current = Number(sekarang) || 0;
      const previous = Number(lalu) || 0;
      const selisih = current - previous;

      if (current === 0 && previous === 0) {
        return { status: "stabil", arah: "tetap", persen: 0, membaik: true };
      }
      if (previous === 0) {
        const arah = current > 0 ? "naik" : current < 0 ? "turun" : "tetap";
        const membaik = jenis === "pengeluaran" ? arah !== "naik" : arah !== "turun";
        return { status: "baru", arah, persen: null, membaik };
      }

      const persen = (selisih / Math.abs(previous)) * 100;
      const arah = selisih > 0 ? "naik" : selisih < 0 ? "turun" : "tetap";
      const membaik = jenis === "pengeluaran" ? arah !== "naik" : arah !== "turun";
      return { status: arah === "tetap" ? "stabil" : "persen", arah, persen, membaik };
    };

    const asetDalamPeriode = (awal, akhir) =>
      aset.reduce((sum, item) => {
        const waktu = parseTglID(item.tanggal || item.tgl);
        if (!Number.isFinite(waktu) || waktu < awal || waktu >= akhir) return sum;
        return sum + Math.max(0, Number(item.nilai) || 0);
      }, 0);

    const asetIni = asetDalamPeriode(awalIni, awalDepan);
    const asetLalu = asetDalamPeriode(awalLalu, awalIni);
    const trenAset = perubahan(asetIni, asetLalu, "positif");

    const targetDenganProgres = targetMenabung.map((item) => ({ item, progres: progresTarget(item) }));
    const urutTarget = (a, b) => {
        const aTgl = a.item.targetDate ? Date.parse(`${a.item.targetDate}T00:00:00`) : Number.MAX_SAFE_INTEGER;
        const bTgl = b.item.targetDate ? Date.parse(`${b.item.targetDate}T00:00:00`) : Number.MAX_SAFE_INTEGER;
        return aTgl - bTgl;
      };
    const targetPrioritas = targetDenganProgres.filter(({ progres }) => !progres.tercapai).sort(urutTarget)[0]
      || [...targetDenganProgres].sort(urutTarget)[0]
      || null;
    const target = targetPrioritas?.progres.target || 0;
    const tabunganAktual = targetPrioritas?.progres.terkumpul || 0;
    const capaian = targetPrioritas ? Math.round(targetPrioritas.progres.persen) : null;
    const capaianTampilan = capaian == null ? null : Math.min(100, capaian);
    const statusTarget =
      !targetPrioritas
        ? "belum-ada-target"
        : capaian >= 100
        ? "tercapai"
        : capaian >= 80
        ? "hampir"
        : capaian >= 20
        ? "proses"
        : "belum-dimulai";

    const txDalamPeriode = (awal, akhir) =>
      nonTransfer.filter((item) => {
        const waktu = parseTglID(item.tgl);
        return Number.isFinite(waktu) && waktu >= awal && waktu < akhir;
      }).length;
    const aktivitasIni = txDalamPeriode(awalIni, awalDepan);
    const aktivitasLalu = txDalamPeriode(awalLalu, awalIni);
    const trenAktivitas = perubahan(aktivitasIni, aktivitasLalu, "positif");

    return {
      asetIni,
      asetLalu,
      trenAset,
      target,
      targetNama: targetPrioritas?.item.nama || "",
      tabunganAktual,
      capaian,
      capaianTampilan,
      statusTarget,
      aktivitasIni,
      aktivitasLalu,
      trenAktivitas,
    };
  }, [aset, nonTransfer, tren, targetMenabung]);

  const teksPerubahanInsight = (data, satuan = "%") => {
    if (!data || data.status === "stabil") return "Stabil dibanding bulan lalu";
    if (data.status === "baru") return "Baru tercatat bulan ini";
    const persen = Math.abs(Math.round((Number(data.persen) || 0) * 10) / 10);
    return `${data.arah === "naik" ? "Naik" : "Turun"} ${persen.toLocaleString("id-ID", { maximumFractionDigits: 1 })}${satuan} dari bulan lalu`;
  };


  const insightCards = useMemo(() => {
    const now = new Date();
    const awalIni = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const awalDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const hariBerjalan = Math.max(1, now.getDate());

    const transaksiBulanIni = nonTransfer.filter((item) => {
      const waktu = parseTglID(item.tgl);
      return Number.isFinite(waktu) && waktu >= awalIni && waktu < awalDepan;
    });
    const pengeluaranBulanIni = transaksiBulanIni.filter((item) => Number(item.jumlah) < 0);

    const kategoriPengeluaran = pengeluaranBulanIni.reduce((hasil, item) => {
      const namaKategori = item.kat || "Lainnya";
      hasil[namaKategori] = (hasil[namaKategori] || 0) + Math.abs(Number(item.jumlah) || 0);
      return hasil;
    }, {});
    const kategoriTerbesar = Object.entries(kategoriPengeluaran)
      .sort((a, b) => b[1] - a[1])[0] || ["Belum ada", 0];
    const porsiKategori = tren.keluarIni > 0 ? (kategoriTerbesar[1] / tren.keluarIni) * 100 : 0;

    const rataPengeluaranHarian = tren.keluarIni / hariBerjalan;
    const dayaTahanHari = rataPengeluaranHarian > 0
      ? Math.max(0, Math.floor((Number(saldo) || 0) / rataPengeluaranHarian))
      : null;

    const relasiAktif = hutang
      .map((item) => ({ item, info: statusHutang(item) }))
      .filter(({ info }) => !["Lunas", "Terjadwal", "Hangus"].includes(info.status));
    const relasiBermasalah = relasiAktif.filter(({ info }) => ["Terlambat", "Gagal Bayar"].includes(info.status));
    const nilaiRelasiAktif = relasiAktif.reduce((jumlah, { info }) => jumlah + Math.max(0, Number(info.sisa) || 0), 0);

    const biayaAdminBulanIni = transaksiBulanIni
      .filter((item) => item.tipe === "biaya-transfer" || item.kat === "Biaya Admin")
      .reduce((jumlah, item) => jumlah + Math.abs(Number(item.jumlah) || 0), 0);
    const jumlahBiayaAdmin = transaksiBulanIni.filter((item) => item.tipe === "biaya-transfer" || item.kat === "Biaya Admin").length;

    const pengeluaranNaik = tren.pengeluaran?.arah === "naik";
    const cashFlowPositif = tren.cashFlowIni > 0;
    const targetTercapai = insight.statusTarget === "tercapai";
    const asetBertambah = insight.trenAset?.arah === "naik" || insight.trenAset?.status === "baru";

    return [
      {
        key: "kategori-pengeluaran",
        eyebrow: "Fokus bulan ini",
        title: kategoriTerbesar[1] > 0 ? `${kategoriTerbesar[0]} paling besar` : "Belum ada pengeluaran",
        description: kategoriTerbesar[1] > 0
          ? `${porsiKategori.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari seluruh pengeluaran bulan ini.`
          : "Tambahkan transaksi agar pola pengeluaran dapat dianalisis.",
        metric: kategoriTerbesar[1],
        metricLabel: "Nilai kategori",
        footnote: kategoriTerbesar[1] > 0
          ? (pengeluaranNaik ? "Periksa transaksi terbesar sebelum menambah belanja." : "Pengeluaran masih lebih terkendali dari bulan lalu.")
          : "Insight akan muncul setelah ada data.",
        icon: UtensilsCrossed,
        color: kategoriTerbesar[1] > 0 ? "#A24F3D" : "#708078",
        surface: kategoriTerbesar[1] > 0 ? "rgba(181,83,60,0.075)" : "rgba(91,123,140,0.065)",
      },
      {
        key: "daya-tahan",
        eyebrow: "Daya tahan saldo",
        title: dayaTahanHari == null ? "Belum dapat dihitung" : `Cukup sekitar ${dayaTahanHari} hari`,
        description: dayaTahanHari == null
          ? "Belum ada pengeluaran bulan ini sebagai dasar perhitungan."
          : "Perkiraan berdasarkan rata-rata pengeluaran harian bulan berjalan.",
        metric: Number(saldo) || 0,
        metricLabel: "Saldo tersedia",
        footnote: dayaTahanHari != null && dayaTahanHari < 14
          ? "Prioritaskan kebutuhan penting dan tunda pengeluaran fleksibel."
          : "Jaga ritme pengeluaran agar daya tahan saldo tetap aman.",
        icon: ShieldCheck,
        color: dayaTahanHari != null && dayaTahanHari < 14 ? "#B5533C" : "#26745D",
        surface: dayaTahanHari != null && dayaTahanHari < 14 ? "rgba(181,83,60,0.075)" : "rgba(38,116,93,0.075)",
      },
      {
        key: "cashflow",
        eyebrow: "Perubahan saldo",
        title: cashFlowPositif ? "Arus kas berada di zona positif" : tren.cashFlowIni < 0 ? "Arus kas perlu diseimbangkan" : "Arus kas masih seimbang",
        description: cashFlowPositif
          ? "Pemasukan bulan ini masih lebih besar daripada pengeluaran."
          : tren.cashFlowIni < 0
          ? "Pengeluaran bulan ini lebih besar daripada pemasukan."
          : "Pemasukan dan pengeluaran bulan ini berada pada nilai yang sama.",
        metric: tren.cashFlowIni,
        metricLabel: "Perubahan bulan ini",
        footnote: cashFlowPositif
          ? "Sisihkan sebagian surplus sebelum terserap pengeluaran rutin."
          : "Kurangi pengeluaran fleksibel sebelum membuat komitmen baru.",
        icon: cashFlowPositif ? TrendingUp : TrendingDown,
        color: cashFlowPositif ? "#26745D" : tren.cashFlowIni < 0 ? "#B5533C" : "#5B7B8C",
        surface: cashFlowPositif ? "rgba(38,116,93,0.075)" : tren.cashFlowIni < 0 ? "rgba(181,83,60,0.075)" : "rgba(91,123,140,0.065)",
      },
      {
        key: "target",
        eyebrow: "Target tabungan",
        title: insight.capaian == null ? "Belum ada target menabung" : targetTercapai ? `${insight.targetNama} tercapai` : insight.statusTarget === "hampir" ? `${insight.targetNama} hampir tercapai` : `${insight.targetNama} masih berjalan`,
        description: insight.capaian == null
          ? "Buat tujuan menabung untuk barang, perjalanan, atau kebutuhan lain."
          : `${insight.capaianTampilan}% dari target menabung telah dialokasikan.`,
        metric: insight.tabunganAktual,
        metricLabel: "Dana disisihkan",
        footnote: insight.capaian == null
          ? "Kelola target dan alokasi dana di menu Rencana."
          : targetTercapai
          ? "Pertahankan dana tersebut dan lanjutkan ke tujuan berikutnya."
          : `Target saat ini ${rupiah(insight.target)}.`,
        icon: Target,
        color: "#287FA8",
        surface: "rgba(40,127,168,0.075)",
      },
      {
        key: "kewajiban",
        eyebrow: "Hutang & piutang",
        title: relasiBermasalah.length > 0 ? `${relasiBermasalah.length} catatan perlu perhatian` : relasiAktif.length > 0 ? `${relasiAktif.length} catatan masih aktif` : "Tidak ada kewajiban aktif",
        description: relasiBermasalah.length > 0
          ? "Ada hutang atau piutang yang sudah terlambat atau gagal bayar."
          : relasiAktif.length > 0
          ? "Seluruh catatan aktif masih berada dalam pemantauan."
          : "Belum ada hutang atau piutang aktif yang perlu dipantau.",
        metric: nilaiRelasiAktif,
        metricLabel: "Total nilai aktif",
        footnote: relasiBermasalah.length > 0
          ? "Tinjau jatuh tempo dan tentukan tindakan berikutnya."
          : "Pertahankan pencatatan pembayaran secara rutin.",
        icon: relasiBermasalah.length > 0 ? Bell : HandCoins,
        color: relasiBermasalah.length > 0 ? "#B5533C" : "#5B7B8C",
        surface: relasiBermasalah.length > 0 ? "rgba(181,83,60,0.075)" : "rgba(91,123,140,0.065)",
      },
      {
        key: "biaya-admin",
        eyebrow: "Biaya tersembunyi",
        title: jumlahBiayaAdmin > 0 ? `${jumlahBiayaAdmin} biaya admin tercatat` : "Belum ada biaya admin",
        description: jumlahBiayaAdmin > 0
          ? "Biaya kecil yang berulang tetap mengurangi saldo dan kekayaan bersih."
          : "Transfer bulan ini belum menimbulkan biaya admin.",
        metric: biayaAdminBulanIni,
        metricLabel: "Total biaya bulan ini",
        footnote: jumlahBiayaAdmin > 0
          ? "Bandingkan metode transfer untuk menekan biaya berulang."
          : (asetBertambah ? "Arahkan penghematan biaya ke aset atau tabungan." : "Pertahankan pilihan transaksi yang efisien."),
        icon: Percent,
        color: "#A86D21",
        surface: "rgba(168,109,33,0.075)",
      },
    ];
  }, [nonTransfer, hutang, saldo, tren, insight]);

  const insightTerpilih = insightCards[insightAktif] || insightCards[0];

  const ringkasanRencanaBeranda = useMemo(() => {
    const anggaranBulan = ringkasanAnggaran(anggaran, nonTransfer);
    const targetDenganInfo = targetMenabung.map((item) => ({ item, info: progresTarget(item) }));
    const urutTarget = (a, b) => {
        const aTgl = a.item.targetDate ? Date.parse(`${a.item.targetDate}T00:00:00`) : Number.MAX_SAFE_INTEGER;
        const bTgl = b.item.targetDate ? Date.parse(`${b.item.targetDate}T00:00:00`) : Number.MAX_SAFE_INTEGER;
        return aTgl - bTgl;
      };
    const targetUtama = targetDenganInfo.filter(({ info }) => !info.tercapai).sort(urutTarget)[0]
      || [...targetDenganInfo].sort(urutTarget)[0]
      || null;
    const cicilanBerikut = cicilanTerdekat(cicilan);
    return { anggaranBulan, targetUtama, cicilanBerikut };
  }, [anggaran, nonTransfer, targetMenabung, cicilan]);

  const aktivitasTerbaru = useMemo(() => {
    const relasiAktif = aktivitasAktifHutangPiutang(hutang);
    return [...transaksi, ...relasiAktif]
      .sort((a, b) => parseTglID(b.tgl) - parseTglID(a.tgl))
      .slice(0, 5);
  }, [transaksi, hutang]);

  const formatTren = (data) => {
    if (!data) return "0%";
    if (data.status === "baru") return "Baru";
    if (data.status === "tetap") return "0%";
    const nilai = Number(data.persen) || 0;
    const absolute = Math.abs(nilai);
    return `${nilai >= 0 ? "+" : "-"}${absolute.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  };

  // Format khusus tiga ringkasan Beranda. Satuan selalu konsisten dan ringkas
  // sehingga ukuran font dapat tetap proporsional tanpa keluar dari batas kolom.
  const formatNominalRingkasBeranda = (nilai) => {
    const angka = Number(nilai) || 0;
    const negatif = angka < 0;
    const absolut = Math.abs(angka);
    const satuan = [
      { batas: 1e12, pembagi: 1e12, label: "t" },
      { batas: 1e9, pembagi: 1e9, label: "m" },
      { batas: 1e6, pembagi: 1e6, label: "jt" },
      { batas: 1e3, pembagi: 1e3, label: "rb" },
    ].find((item) => absolut >= item.batas);

    return {
      negatif,
      angka: satuan
        ? (absolut / satuan.pembagi).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : absolut.toLocaleString("id-ID"),
      satuan: satuan?.label || "",
      teks: `${negatif ? "-" : ""}Rp ${satuan
        ? `${(absolut / satuan.pembagi).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${satuan.label}`
        : absolut.toLocaleString("id-ID")}`,
    };
  };

  const Ringkasan = ({ label, nilai, trenData, icon: Ikon, warna }) => (
    <div
      className="dashboard-stat"
      style={{
        minWidth: 0,
        width: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "grid",
        gridTemplateRows: "23px 30px 17px",
        alignContent: "center",
        rowGap: 3,
        padding: "7px 6px 6px",
        background: "rgba(255,255,255,0.055)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
      }}
    >
      <div
        className="dashboard-stat__title"
        style={{
          minWidth: 0,
          width: "100%",
          overflow: "visible",
          display: "grid",
          gridTemplateColumns: "20px minmax(0, 1fr)",
          alignItems: "center",
          columnGap: 5,
          fontSize: "clamp(8px, 2.15vw, 10.5px)",
          lineHeight: 1.05,
        }}
      >
        <span
          className="dashboard-stat__icon"
          style={{
            backgroundColor: warna,
            width: 20,
            height: 20,
            minWidth: 20,
            minHeight: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          <Ikon size={11.5} strokeWidth={2} style={{ overflow: "visible" }} />
        </span>
        <span
          className="dashboard-stat__label"
          style={{
            minWidth: 0,
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="dashboard-stat__value"
        style={{
          minWidth: 0,
          width: "100%",
          height: 30,
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          lineHeight: 1,
          fontWeight: 700,
        }}
        title={formatNominalRingkasBeranda(nilai).teks}
      >
        {saldoTersembunyi ? (
          <span style={{ fontSize: "clamp(20px, 5vw, 27px)", fontWeight: 750 }}>•••</span>
        ) : (
          (() => {
            const nominal = formatNominalRingkasBeranda(nilai);
            return (
              <span
                style={{
                  minWidth: 0,
                  maxWidth: "100%",
                  display: "inline-flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: "clamp(10px, 2.45vw, 13px)", fontWeight: 650 }}>
                  {nominal.negatif ? "-Rp" : "Rp"}
                </span>
                <span
                  style={{
                    minWidth: 0,
                    fontSize: "clamp(21px, 5.7vw, 30px)",
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {nominal.angka}
                </span>
                {nominal.satuan && (
                  <span style={{ fontSize: "clamp(11px, 2.7vw, 14px)", fontWeight: 700 }}>
                    {nominal.satuan}
                  </span>
                )}
              </span>
            );
          })()
        )}
      </div>
      <div
        className={`dashboard-stat__trend ${trenData?.arah === "turun" ? "is-down" : ""} ${trenData?.membaik ? "is-good" : "is-bad"}`}
        style={{
          minWidth: 0,
          width: "100%",
          height: 17,
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
          fontSize: "clamp(8px, 2.05vw, 10px)",
          lineHeight: 1,
        }}
      >
        {trenData?.arah === "turun" ? <TrendingDown size={12} /> : trenData?.arah === "tetap" ? <Minus size={12} /> : <TrendingUp size={12} />}
        <span>{formatTren(trenData)}</span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-balance dashboard-balance--compact" aria-label="Ringkasan saldo">
        <div className="dashboard-balance__main">
          <div className="dashboard-balance__label dashboard-balance__label--center">
            <span>Saldo Total</span>
            <button type="button" onClick={() => setSaldoTersembunyi((value) => !value)} aria-label={saldoTersembunyi ? "Tampilkan saldo" : "Sembunyikan saldo"}>
              {saldoTersembunyi ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="dashboard-balance__value dashboard-balance__value--center">
            {saldoTersembunyi ? "Rp ••••••" : (() => {
              const nominal = formatNominalRingkasBeranda(ringkasanUtama.saldoTotal);
              return <span className="dashboard-balance__amount"><span className="dashboard-balance__currency">{nominal.negatif ? "-Rp" : "Rp"}</span><span className="dashboard-balance__number">{nominal.angka}</span>{nominal.satuan && <span className="dashboard-balance__unit">{nominal.satuan}</span>}</span>;
            })()}
          </div>
          <div className="dashboard-balance__trend dashboard-balance__trend--center">
            {tren.cashFlow?.arah === "turun" ? <TrendingDown size={15} /> : tren.cashFlow?.arah === "tetap" ? <Minus size={15} /> : <TrendingUp size={15} />}
            <strong>{formatTren(tren.cashFlow)}</strong><span>dari bulan lalu</span>
          </div>
        </div>

        <div className="dashboard-balance__stats dashboard-balance__stats--two">
          <Ringkasan label="Total Pemasukan" nilai={ringkasanUtama.totalPemasukan} trenData={tren.pemasukan} icon={ArrowDownLeft} warna="#1bae72" />
          <Ringkasan label="Total Pengeluaran" nilai={ringkasanUtama.totalPengeluaran} trenData={tren.pengeluaran} icon={ArrowUpRight} warna="#f34242" />
        </div>

        <div className="dashboard-balance__footer">
          <div className="dashboard-balance__cashflow" aria-label="Cash Flow Bersih">
            <TrendingUp size={16} strokeWidth={2.3} />
            <span className="dashboard-balance__cashflow-label">Cash Flow (Bersih)</span>
            {saldoTersembunyi ? <strong>•••</strong> : (() => {
              const nominal = formatNominalRingkasBeranda(ringkasanUtama.cashFlow);
              return <strong className="dashboard-balance__cashflow-value"><span>{nominal.negatif ? "-Rp" : "Rp"}</span><span>{nominal.angka}</span>{nominal.satuan && <span>{nominal.satuan}</span>}</strong>;
            })()}
            <span className={`dashboard-balance__cashflow-trend ${tren.cashFlow?.membaik ? "is-good" : "is-bad"}`}>
              {tren.cashFlow?.arah === "turun" ? <TrendingDown size={12} /> : tren.cashFlow?.arah === "tetap" ? <Minus size={12} /> : <TrendingUp size={12} />}{formatTren(tren.cashFlow)}
            </span>
          </div>
          <div className={`dashboard-balance__health dashboard-balance__health--${kondisiKeuangan.tone}`} aria-label={`Kondisi keuangan: ${kondisiKeuangan.label}`}>
            {React.createElement(kondisiKeuangan.icon, { size: 14, strokeWidth: 2.2 })}<span>{kondisiKeuangan.label}</span>
          </div>
        </div>
      </section>

      <section className="dashboard-card dashboard-cashflow" aria-label="Arus kas">
        <div className="dashboard-section-heading">
          <div className="dashboard-section-heading__title">
            <BarChart3 size={20} strokeWidth={2.5} />
            <h2>Arus Kas</h2>
          </div>
          <div className="dashboard-chart-controls" aria-label="Kontrol grafik arus kas">
            <DropdownKecilBeranda
              opsi={[
                { key: "7hari", label: "7 Hari" },
                { key: "12bulan", label: "12 Bulan" },
              ]}
              aktif={rentangArus}
              onPilih={setRentangArus}
            />
            <DropdownKecilBeranda
              opsi={[
                { key: "batang", label: "Batang" },
                { key: "garis", label: "Garis" },
              ]}
              aktif={tipeGrafikArus}
              onPilih={setTipeGrafikArus}
            />
          </div>
        </div>
        <div className="mb-1 flex items-center justify-end gap-3 px-1 text-[8.5px] font-medium text-[#6F7974]" aria-label="Legenda grafik">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2F8B6C]" />Pemasukan</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#C55F49]" />Pengeluaran</span>
        </div>
        <div className="dashboard-chart">
          {!adaData ? (
            <div className="dashboard-empty">Tambahkan transaksi untuk melihat arus kas.</div>
          ) : tipeGrafikArus === "batang" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataArus} margin={{ top: 8, right: 2, left: 2, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#7f8792" }} interval={0} />
                <YAxis hide domain={[0, "auto"]} />
                <Bar dataKey="pemasukan" fill="#2F8B6C" radius={[4, 4, 0, 0]} maxBarSize={rentangArus === "7hari" ? 14 : 8} isAnimationActive={false} />
                <Bar dataKey="pengeluaran" fill="#C55F49" radius={[4, 4, 0, 0]} maxBarSize={rentangArus === "7hari" ? 14 : 8} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataArus} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#7f8792" }} interval={0} />
                <YAxis hide domain={[0, "auto"]} />
                <Line type="monotone" dataKey="pemasukan" stroke="#2F8B6C" strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="pengeluaran" stroke="#C55F49" strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section
        className="dashboard-card"
        aria-label="Insight keuangan"
        style={{ overflow: "hidden", paddingTop: 12, paddingBottom: 12 }}
      >
        <div className="dashboard-section-heading" style={{ marginBottom: 8 }}>
          <div className="dashboard-section-heading__title">
            <Lightbulb size={20} strokeWidth={2.2} />
            <h2>Insight Keuangan</h2>
          </div>
          <span style={{ fontSize: 9.5, color: "#7E8782", fontWeight: 750 }}>
            {insightAktif + 1} / {insightCards.length}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px minmax(0, 1fr) 24px",
            alignItems: "stretch",
            gap: 6,
            minWidth: 0,
            height: 98,
          }}
        >
          <button
            type="button"
            onClick={() => pindahInsight(-1)}
            aria-label="Insight sebelumnya"
            style={{
              width: 24,
              height: "100%",
              border: 0,
              background: "transparent",
              color: "#466159",
              display: "grid",
              placeItems: "center",
              padding: 0,
            }}
          >
            <ChevronRight size={18} strokeWidth={2.1} style={{ transform: "rotate(180deg)" }} />
          </button>

          <article
            key={insightTerpilih.key}
            style={{
              minWidth: 0,
              height: 98,
              padding: "7px 4px",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              gap: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "28px minmax(0, 1fr) auto",
                gap: 8,
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  color: insightTerpilih.color,
                  flexShrink: 0,
                }}
              >
                {React.createElement(insightTerpilih.icon, { size: 17, strokeWidth: 2.1 })}
              </span>

              <div style={{ minWidth: 0, paddingRight: 6 }}>
                <div
                  style={{
                    fontSize: 7.8,
                    lineHeight: 1,
                    color: insightTerpilih.color,
                    fontWeight: 800,
                    letterSpacing: "0.055em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {insightTerpilih.eyebrow}
                </div>
                <h3
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11.2,
                    lineHeight: 1.15,
                    color: "#17231F",
                    fontWeight: 780,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {insightTerpilih.title}
                </h3>
              </div>

              <div
                style={{
                  minWidth: 74,
                  maxWidth: 112,
                  textAlign: "right",
                  paddingLeft: 8,
                  borderLeft: "1px solid rgba(31,72,59,0.10)",
                }}
              >
                <div style={{ fontSize: 7.3, color: "#7E8782", lineHeight: 1 }}>
                  {insightTerpilih.metricLabel}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12.5,
                    lineHeight: 1,
                    fontWeight: 820,
                    color: insightTerpilih.color,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {rupiah(insightTerpilih.metric)}
                </div>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                minWidth: 0,
                padding: "6px 0 0 36px",
                borderTop: "1px solid rgba(31,72,59,0.08)",
                fontSize: 8.5,
                lineHeight: 1.24,
                color: "#56635D",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {insightTerpilih.description}
            </p>

            <div
              style={{
                minWidth: 0,
                display: "grid",
                gridTemplateColumns: "12px minmax(0, 1fr)",
                alignItems: "center",
                gap: 5,
                paddingLeft: 36,
                color: "#6B756F",
              }}
            >
              <Info size={11.5} strokeWidth={2} style={{ color: insightTerpilih.color }} />
              <p
                style={{
                  margin: 0,
                  minWidth: 0,
                  fontSize: 7.9,
                  lineHeight: 1.18,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {insightTerpilih.footnote}
              </p>
            </div>
          </article>

          <button
            type="button"
            onClick={() => pindahInsight(1)}
            aria-label="Insight berikutnya"
            style={{
              width: 24,
              height: "100%",
              border: 0,
              background: "transparent",
              color: "#466159",
              display: "grid",
              placeItems: "center",
              padding: 0,
            }}
          >
            <ChevronRight size={18} strokeWidth={2.1} />
          </button>
        </div>
      </section>

      <section className="dashboard-card" aria-label="Rencana keuangan">
        <div className="dashboard-section-heading">
          <div className="dashboard-section-heading__title">
            <Target size={20} strokeWidth={2.2} />
            <h2>Rencana Keuangan</h2>
          </div>
          <button className="dashboard-link" type="button" onClick={() => onBukaRencana?.("anggaran")}>Kelola</button>
        </div>
        <div className="divide-y divide-[#EDF0EE]">
          <button type="button" onClick={() => onBukaRencana?.("anggaran")} className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto_14px] items-center gap-2.5 py-2.5 text-left">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[#EEF3F0] text-[#2F6F5E]"><Receipt size={14} /></span>
            <span className="min-w-0"><strong className="block truncate text-[11px] font-semibold text-[#24322D]">Anggaran Bulanan</strong><small className="mt-0.5 block truncate text-[9px] text-[#7B847F]">{anggaran.length ? `${Math.round(ringkasanRencanaBeranda.anggaranBulan.persen)}% terpakai` : "Belum diatur"}</small></span>
            <span className="max-w-[120px] truncate text-right text-[10px] font-semibold text-[#45544D]">{anggaran.length ? rupiah(ringkasanRencanaBeranda.anggaranBulan.sisa) : "-"}</span>
            <ChevronRight size={14} className="text-[#A0A8A4]" />
          </button>
          <button type="button" onClick={() => onBukaRencana?.("target")} className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto_14px] items-center gap-2.5 py-2.5 text-left">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[#EEF3F0] text-[#2F6F5E]"><PiggyBank size={14} /></span>
            <span className="min-w-0"><strong className="block truncate text-[11px] font-semibold text-[#24322D]">Target Menabung</strong><small className="mt-0.5 block truncate text-[9px] text-[#7B847F]">{ringkasanRencanaBeranda.targetUtama?.item.nama || "Belum dibuat"}</small></span>
            <span className="max-w-[90px] truncate text-right text-[10px] font-semibold text-[#2F6F5E]">{ringkasanRencanaBeranda.targetUtama ? `${Math.round(ringkasanRencanaBeranda.targetUtama.info.persen)}%` : "-"}</span>
            <ChevronRight size={14} className="text-[#A0A8A4]" />
          </button>
          <button type="button" onClick={() => onBukaRencana?.("cicilan")} className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto_14px] items-center gap-2.5 py-2.5 text-left">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[#F5F0E6] text-[#8F6D30]"><CreditCard size={14} /></span>
            <span className="min-w-0"><strong className="block truncate text-[11px] font-semibold text-[#24322D]">Cicilan Berikutnya</strong><small className="mt-0.5 block truncate text-[9px] text-[#7B847F]">{ringkasanRencanaBeranda.cicilanBerikut ? `${ringkasanRencanaBeranda.cicilanBerikut.item.nama} | ${formatTglDariInput(ringkasanRencanaBeranda.cicilanBerikut.info.jatuhTempo)}` : "Tidak ada cicilan aktif"}</small></span>
            <span className="max-w-[110px] truncate text-right text-[10px] font-semibold text-[#45544D]">{ringkasanRencanaBeranda.cicilanBerikut ? rupiah(ringkasanRencanaBeranda.cicilanBerikut.info.tagihanBerikut) : "-"}</span>
            <ChevronRight size={14} className="text-[#A0A8A4]" />
          </button>
        </div>
      </section>

      <section className="dashboard-card dashboard-activity" aria-label="Aktivitas terbaru">
        <div className="dashboard-section-heading">
          <div className="dashboard-section-heading__title">
            <History size={20} strokeWidth={2.2} />
            <h2>Aktivitas Terbaru</h2>
          </div>
          <button className="dashboard-link" type="button" onClick={() => goTo("transaksi")}>Lihat Semua</button>
        </div>
        <div className="activity-list">
          {!adaData ? (
            <div className="dashboard-empty">Belum ada aktivitas transaksi.</div>
          ) : aktivitasTerbaru.map((item, index) => {
            const transfer = item.tipe === "transfer";
            const hutangAktif = item.tipe === "hutang-aktif";
            const piutangAktif = item.tipe === "piutang-aktif";
            const relasiAktif = hutangAktif || piutangAktif;
            const masuk = item.jumlah > 0;
            const iconName = transfer
              ? "transfer"
              : hutangAktif
              ? "loan"
              : piutangAktif
              ? "receivable"
              : masuk
              ? IKON_KATEGORI_PEMASUKAN[item.kat] || "salary"
              : IKON_KATEGORI_PENGELUARAN[item.kat] || "shopping";
            const judul = transfer
              ? (item.nama || `Transfer ${(item.transferInfo || {}).dari || "Akun"} → ${(item.transferInfo || {}).ke || "Akun"}`)
              : item.nama || item.kat || (masuk ? "Pemasukan" : "Pengeluaran");
            return (
              <button
                key={`${item.id || index}-${index}`}
                type="button"
                className="activity-row"
                onClick={() => onBukaDetail?.(item)}
              >
                <span
                  className={`activity-row__icon ${transfer ? "is-blue" : masuk ? "is-green" : "is-orange"}`}
                  style={hutangAktif ? { backgroundColor: "#F0ECFA", color: "#7158A5" } : piutangAktif ? { backgroundColor: "#FFF3DD", color: "#B87820" } : undefined}
                >
                  <Icon name={iconName} size={18} strokeWidth={2} />
                </span>
                <span className="activity-row__copy">
                  <strong>{judul}</strong>
                  <small>{item.tgl}</small>
                </span>
                <span
                  className={`activity-row__amount ${transfer || relasiAktif ? "" : !masuk ? "is-out" : "is-in"}`}
                  style={transfer ? { color: "#3E7CB1" } : hutangAktif ? { color: "#7158A5" } : piutangAktif ? { color: "#B87820" } : undefined}
                >
                  <Nominal
                    n={Math.abs(transfer ? (item.transferInfo?.nominal ?? item.jumlah) : item.jumlah)}
                    prefix={transfer ? "Rp " : hutangAktif ? "Rp " : piutangAktif ? "- Rp " : masuk ? "+ Rp " : "- Rp "}
                  />
                </span>
                <ChevronRight size={16} className="activity-row__chevron" />
              </button>
            );
          })}
        </div>
      </section>

      <blockquote className="dashboard-quote">
        <Quote size={22} />
        <span>Bukan seberapa banyak uang yang Anda miliki,<br />tetapi seberapa baik setiap rupiah dikelola.</span>
        <Sprout size={32} />
      </blockquote>

      <FabMenu opsi={OPSI_FAB_TRANSAKSI} onPilih={onPilihFab} />
    </div>
  );
}


// Nama akun yang dipakai pada pesan peringatan "Saldo ... tidak mencukupi" —
// untuk transfer diambil dari nama Sumber Dana, untuk baris Biaya Admin Transfer
// dipetakan dari akunId (karena field metode-nya selalu "Transfer").
function namaAkunUntukPesan(t) {
  if (t.tipe === "transfer") return (t.transferInfo || {}).dari || t.metode;
  if (t.tipe === "biaya-transfer") {
    if (t.akunId === ID_BANK_TRANSAKSI) return "Bank";
    if (t.akunId === ID_EWALLET_TRANSAKSI) return "E-Wallet";
    return "Kas";
  }
  return t.metode;
}

// Slot ATAS nominal: badge status (Terjadwal / Menunggu Saldo) bila ada, selain itu
// metode pembayaran sebagai teks kecil abu-abu (informasi pendukung, bukan fokus utama).
function InfoAtasNominal({ t, menunggu }) {
  if (menunggu) return <BadgeMenungguSaldo />;
  if (isTerjadwal(t)) return <BadgeTerjadwal />;
  return <div className="text-[11px] text-[#8B8579] truncate max-w-[132px]">{t.metode}</div>;
}

// Slot BAWAH nominal: hanya terisi untuk transaksi yang pernah terjadwal — peringatan
// saldo tidak cukup, atau caption "Penjadwalan selesai" setelah berhasil diproses.
function InfoBawahNominal({ t, menunggu }) {
  if (menunggu) {
    return <div className="text-[10px] text-[#966A22] truncate max-w-[132px]">Saldo {namaAkunUntukPesan(t)} tidak mencukupi</div>;
  }
  if (t.terjadwal === true && !isTerjadwal(t)) {
    return <div className="text-[10px] text-[#8B8579] truncate max-w-[132px]">Penjadwalan selesai</div>;
  }
  return null;
}

function TxRow({ t, last, menunggu, onInfo }) {
  const perluPerhatian = !!menunggu;
  const kelasCard = perluPerhatian
    ? "bg-[#FBF4E5] border-b border-[#F0DCAA]"
    : "active:bg-[#FAF8F2]";

  const hutangAktif = t.tipe === "hutang-aktif";
  const piutangAktif = t.tipe === "piutang-aktif";
  if (hutangAktif || piutangAktif) {
    const warna = hutangAktif ? "#7158A5" : "#B87820";
    const latar = hutangAktif ? "#F0ECFA" : "#FFF3DD";
    return (
      <button
        onClick={onInfo}
        className={`w-full grid grid-cols-[minmax(0,1fr)_minmax(108px,auto)] items-center gap-3 px-3.5 py-2.5 text-left rounded-[16px] border border-[#E2E7E3] bg-white shadow-[0_4px_14px_rgba(27,42,38,0.035)] overflow-hidden ${perluPerhatian ? "ring-1 ring-[#E9D49D]" : "active:bg-[#FAFBFA]"}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: latar, color: warna }}>
            <Icon name={hutangAktif ? "loan" : "receivable"} size={18} strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <strong className="block text-[14px] leading-tight text-[#1B2A26] font-semibold truncate">{t.nama}</strong>
            <small className="block text-[11px] leading-tight text-[#8B8579] mt-1 truncate">{t.tgl} · {t.statusRelasi}</small>
          </span>
        </div>
        <span className="min-w-0 text-right">
          <small className="block text-[10.5px] text-[#8B8579] mb-1 truncate">{hutangAktif ? "Dana pinjaman" : "Dana dipinjamkan"}</small>
          <strong className="block text-[15px] whitespace-nowrap" style={{ color: warna, fontFamily: "'JetBrains Mono', monospace" }}>
            <Nominal n={Math.abs(t.jumlah)} prefix={piutangAktif ? "- Rp " : "Rp "} />
          </strong>
        </span>
      </button>
    );
  }

  if (t.tipe === "transfer") {
    const info = t.transferInfo || {};
    return (
      <button
        onClick={onInfo}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left rounded-[16px] border border-[#E2E7E3] bg-white shadow-[0_4px_14px_rgba(27,42,38,0.035)] overflow-hidden ${perluPerhatian ? "ring-1 ring-[#E9D49D] bg-[#FFF9EC]" : "active:bg-[#FAFBFA]"}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[#EAEEF1] text-[#5B7B8C]">
            <Icon name="transfer" size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] text-[#1B2A26] font-medium truncate">{info.dari} → {info.ke}</div>
            <div className="text-[11px] text-[#8B8579] mt-1 truncate">{t.tgl}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 min-w-0 flex-1 basis-0">
          <InfoAtasNominal t={t} menunggu={menunggu} />
          <div
            className="text-[16px] font-semibold whitespace-nowrap text-[#3E7CB1] min-w-0 max-w-full"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Nominal n={info.nominal ?? Math.abs(t.jumlah)} className="text-right" />
          </div>
          <InfoBawahNominal t={t} menunggu={menunggu} />
        </div>
      </button>
    );
  }
  const positif = t.jumlah > 0;
  return (
    <button
      onClick={onInfo}
      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left rounded-[16px] border border-[#E2E7E3] bg-white shadow-[0_4px_14px_rgba(27,42,38,0.035)] overflow-hidden ${perluPerhatian ? "ring-1 ring-[#E9D49D] bg-[#FFF9EC]" : "active:bg-[#FAFBFA]"}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 basis-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: positif ? BG_KATEGORI_PEMASUKAN_ICON : BG_KATEGORI_PENGELUARAN_ICON, color: positif ? WARNA_KATEGORI_PEMASUKAN_ICON : WARNA_KATEGORI_PENGELUARAN_ICON }}
        >
          <Icon name={positif ? (IKON_KATEGORI_PEMASUKAN[t.kat] || "salary") : (IKON_KATEGORI_PENGELUARAN[t.kat] || "shopping")} size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-[#1B2A26] font-medium truncate">{t.nama}</div>
          <div className="text-[11px] text-[#8B8579] mt-1 truncate">{t.tgl}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 min-w-0 flex-1 basis-0">
        <InfoAtasNominal t={t} menunggu={menunggu} />
        <div
          className={`text-[16px] font-semibold whitespace-nowrap min-w-0 max-w-full ${positif ? "text-[#2F6F5E]" : "text-[#B5533C]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <Nominal n={t.jumlah} className="text-right" />
        </div>
        <InfoBawahNominal t={t} menunggu={menunggu} />
      </div>
    </button>
  );
}

// ---------- LAYAR: TRANSAKSI ----------
// Popup "Semua Kategori" — multi-select kategori spesifik, dengan grup Pemasukan/Pengeluaran
// yang berfungsi murni sebagai expand/collapse (bukan filter, bukan checkbox/radio).
// Checkbox hanya dipakai jika total kategori (gabungan kedua grup) lebih dari satu.
function GrupKategoriExpand({ label, grupKey, expandedGroup, onToggleGroup, anak, pakaiCheckbox, checked, indeterminate, onToggleCheckbox }) {
  const terbuka = expandedGroup === grupKey;
  return (
    <div>
      <div className="w-full flex items-center gap-2.5 px-3.5 py-2.5">
        {/* Tombol expand/collapse — logikanya TIDAK berubah */}
        <button
          onClick={() => onToggleGroup(grupKey)}
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
        >
          <ChevronRight
            size={13}
            className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${terbuka ? "rotate-90" : ""}`}
          />
          <span className="text-[13px] text-[#1B2A26] font-medium truncate">{label}</span>
        </button>
        {/* Checkbox "pilih semua kategori di grup ini" di sisi kanan — HANYA tampil pada
            kondisi yang sama persis dengan checkbox subkategori (pakaiCheckbox), sehingga
            kapan checkbox muncul tetap mengikuti aturan yang sudah berjalan sebelumnya. */}
        {pakaiCheckbox && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCheckbox(); }}
            className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${
              checked || indeterminate ? "bg-[#1B2A26] border-[#1B2A26]" : "border-[#C9C2B2] bg-white"
            }`}
          >
            {checked && <Check size={11} className="text-white" />}
            {indeterminate && !checked && <Minus size={11} className="text-white" />}
          </button>
        )}
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${terbuka ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">{anak}</div>
      </div>
    </div>
  );
}

function PanelKategoriDropdown({ buka, filterSet, kategoriMasukAda, kategoriKeluarAda, adaTransfer, adaHutang, adaPiutang, onSemua, onPilihTunggal, onToggleKategori, onToggleSemuaGrup, onClose }) {
  const ref = useRef(null);
  const [expandedGroup, setExpandedGroup] = useState(null); // null | 'masuk' | 'keluar'

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka, onClose]);

  // Setiap kali popup ditutup, status expand/collapse di-reset (filter kategori TIDAK ikut di-reset)
  useEffect(() => {
    if (!buka) setExpandedGroup(null);
  }, [buka]);

  // Checkbox ditentukan oleh jumlah KELOMPOK UTAMA (Pemasukan/Pengeluaran/Transfer & Kelola)
  // yang memiliki data — bukan oleh jumlah subkategori di dalamnya.
  const adaMasuk = kategoriMasukAda.length > 0;
  const adaKeluar = kategoriKeluarAda.length > 0;
  const totalKelompok = (adaMasuk ? 1 : 0) + (adaKeluar ? 1 : 0) + (adaTransfer ? 1 : 0) + (adaHutang ? 1 : 0) + (adaPiutang ? 1 : 0);
  const pakaiCheckbox = totalKelompok > 1;

  const toggleGroup = (grp) => setExpandedGroup((g) => (g === grp ? null : grp));

  // Status checkbox header grup: checked bila SEMUA subkategori grup itu terpilih,
  // indeterminate bila SEBAGIAN terpilih. Dipakai untuk header Pemasukan & Pengeluaran.
  const statusGrup = (arah, daftarKategori) => {
    const keys = daftarKategori.map((k) => `${arah}:${k}`);
    const jumlahTerpilih = keys.filter((k) => filterSet.includes(k)).length;
    return { checked: keys.length > 0 && jumlahTerpilih === keys.length, indeterminate: jumlahTerpilih > 0 && jumlahTerpilih < keys.length };
  };
  const statusMasuk = statusGrup("masuk", kategoriMasukAda);
  const statusKeluar = statusGrup("keluar", kategoriKeluarAda);

  const renderKategori = (arah, k) => {
    const key = `${arah}:${k}`;
    const aktif = filterSet.includes(key);
    return (
      <button
        key={key}
        onClick={() => (pakaiCheckbox ? onToggleKategori(key) : onPilihTunggal(key))}
        className="w-full flex items-center justify-between gap-2.5 pl-8 pr-3.5 py-2 text-left"
      >
        <span className="min-w-0 flex items-center gap-2">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${aktif ? "bg-[#F1F7F4]" : "bg-[#F7F5F0]"}`} style={{ color: arah === "masuk" ? WARNA_KATEGORI_PEMASUKAN_ICON : WARNA_KATEGORI_PENGELUARAN_ICON }}>
            <Icon name={arah === "masuk" ? (IKON_KATEGORI_PEMASUKAN[k] || "more") : (IKON_KATEGORI_PENGELUARAN[k] || "more")} size={13} />
          </span>
          <span className={`text-[12px] truncate ${aktif ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>{k}</span>
        </span>
        {pakaiCheckbox && (
          <span
            className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${
              aktif ? "bg-[#1B2A26] border-[#1B2A26]" : "border-[#C9C2B2] bg-white"
            }`}
          >
            {aktif && <Check size={11} className="text-white" />}
          </span>
        )}
      </button>
    );
  };

  const keyTransfer = "transfer:Transfer & Kelola";
  const keyHutang = "hutang:Hutang";
  const keyPiutang = "piutang:Piutang";
  const transferAktif = filterSet.includes(keyTransfer);
  const hutangAktif = filterSet.includes(keyHutang);
  const piutangAktif = filterSet.includes(keyPiutang);

  const semuaKosong = totalKelompok === 0;

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1.5 w-full origin-top-left z-20 transition-all duration-150 ease-out ${
        buka ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="rounded-xl border border-[#E7E1D3] bg-white shadow-md overflow-hidden max-h-72 overflow-y-auto">
        <div className="divide-y divide-[#F0EBDD]">
          <button onClick={onSemua} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left">
            <span className={`text-[13px] truncate ${filterSet.length === 0 ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>Semua Kategori</span>
            {filterSet.length === 0 && <Check size={14} className="text-[#1B2A26] shrink-0" />}
          </button>

          {semuaKosong ? null : (
            <>
              {adaMasuk && (
                <GrupKategoriExpand
                  label="Pemasukan"
                  grupKey="masuk"
                  expandedGroup={expandedGroup}
                  onToggleGroup={toggleGroup}
                  anak={kategoriMasukAda.map((k) => renderKategori("masuk", k))}
                  pakaiCheckbox={pakaiCheckbox}
                  checked={statusMasuk.checked}
                  indeterminate={statusMasuk.indeterminate}
                  onToggleCheckbox={() => onToggleSemuaGrup("masuk", kategoriMasukAda)}
                />
              )}
              {adaKeluar && (
                <GrupKategoriExpand
                  label="Pengeluaran"
                  grupKey="keluar"
                  expandedGroup={expandedGroup}
                  onToggleGroup={toggleGroup}
                  anak={kategoriKeluarAda.map((k) => renderKategori("keluar", k))}
                  pakaiCheckbox={pakaiCheckbox}
                  checked={statusKeluar.checked}
                  indeterminate={statusKeluar.indeterminate}
                  onToggleCheckbox={() => onToggleSemuaGrup("keluar", kategoriKeluarAda)}
                />
              )}
              {adaTransfer && (
                // Transfer & Kelola tidak memiliki subkategori: langsung menjadi satu
                // entri terpilih (tanpa tombol expand/collapse). Label sejajar dengan
                // label Pemasukan/Pengeluaran (sama-sama mulai dari tepi kiri, tanpa
                // chevron); status aktif ditunjukkan lewat checkbox di sisi kanan,
                // konsisten dengan header Pemasukan/Pengeluaran.
                <button
                  onClick={() => (pakaiCheckbox ? onToggleKategori(keyTransfer) : onPilihTunggal(keyTransfer))}
                  className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-left"
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#EDF3F7] text-[#5B7B8C] flex items-center justify-center shrink-0"><Icon name="transfer" size={13} /></span>
                    <span className="text-[13px] text-[#1B2A26] font-medium truncate">Transfer & Kelola</span>
                  </span>
                  {pakaiCheckbox && (
                    <span
                      className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${
                        transferAktif ? "bg-[#1B2A26] border-[#1B2A26]" : "border-[#C9C2B2] bg-white"
                      }`}
                    >
                      {transferAktif && <Check size={11} className="text-white" />}
                    </span>
                  )}
                </button>
              )}
              {adaHutang && (
                <button
                  onClick={() => (pakaiCheckbox ? onToggleKategori(keyHutang) : onPilihTunggal(keyHutang))}
                  className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-left"
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#F1EDF8] text-[#7158A5] flex items-center justify-center shrink-0"><Icon name="loan" size={13} /></span>
                    <span className={`text-[13px] font-medium truncate ${hutangAktif ? "text-[#7158A5]" : "text-[#1B2A26]"}`}>Hutang</span>
                  </span>
                  {pakaiCheckbox && (
                    <span className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${hutangAktif ? "bg-[#7158A5] border-[#7158A5]" : "border-[#C9C2B2] bg-white"}`}>
                      {hutangAktif && <Check size={11} className="text-white" />}
                    </span>
                  )}
                </button>
              )}
              {adaPiutang && (
                <button
                  onClick={() => (pakaiCheckbox ? onToggleKategori(keyPiutang) : onPilihTunggal(keyPiutang))}
                  className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-left"
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FFF5E6] text-[#B87820] flex items-center justify-center shrink-0"><Icon name="receivable" size={13} /></span>
                    <span className={`text-[13px] font-medium truncate ${piutangAktif ? "text-[#B87820]" : "text-[#1B2A26]"}`}>Piutang</span>
                  </span>
                  {pakaiCheckbox && (
                    <span className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${piutangAktif ? "bg-[#B87820] border-[#B87820]" : "border-[#C9C2B2] bg-white"}`}>
                      {piutangAktif && <Check size={11} className="text-white" />}
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelUrutanDropdown({ buka, urutan, onUbah, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka, onClose]);

  const pilih = (v) => {
    onUbah(v);
    onClose();
  };

  const aktifTanggal = urutan === "terbaru" || urutan === "terlama";
  const aktifNominal = urutan === "terkecil" || urutan === "terbesar";
  const aktifRentang = urutan === "rentang";

  return (
    <div
      ref={ref}
      className={`absolute top-full right-0 mt-1.5 w-full origin-top-right z-20 transition-all duration-150 ease-out ${
        buka ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="rounded-xl border border-[#E7E1D3] bg-white shadow-md overflow-hidden">
        <button
          onClick={() => pilih(urutan === "terbaru" ? "terlama" : "terbaru")}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0EBDD] text-left"
        >
          <span className={`text-[13px] ${aktifTanggal ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>
            Tanggal {urutan === "terbaru" ? "(Terbaru)" : urutan === "terlama" ? "(Terlama)" : ""}
          </span>
          {aktifTanggal && <Check size={14} className="text-[#1B2A26]" />}
        </button>
        <button
          onClick={() => pilih(urutan === "terkecil" ? "terbesar" : "terkecil")}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0EBDD] text-left"
        >
          <span className={`text-[13px] ${aktifNominal ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>
            Nominal {urutan === "terkecil" ? "(Terkecil)" : urutan === "terbesar" ? "(Terbesar)" : ""}
          </span>
          {aktifNominal && <Check size={14} className="text-[#1B2A26]" />}
        </button>
        <button onClick={() => pilih("rentang")} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
          <span className={`text-[13px] ${aktifRentang ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>Rentang Waktu</span>
          {aktifRentang && <Check size={14} className="text-[#1B2A26]" />}
        </button>
      </div>
    </div>
  );
}

// Popup Filter Kategori untuk halaman Data Aset. Hanya satu grup kategori (tidak ada expand/collapse).
function PanelKategoriDropdownAset({ buka, filterSet, kategoriAda, onSemua, onPilihTunggal, onToggleKategori, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka, onClose]);

  const totalKategori = kategoriAda.length;
  const pakaiCheckbox = totalKategori > 1;

  return (
    <div
      ref={ref}
      className={`absolute top-full left-0 mt-1.5 w-full origin-top-left z-20 transition-all duration-150 ease-out ${
        buka ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="rounded-xl border border-[#E7E1D3] bg-white shadow-md overflow-hidden max-h-72 overflow-y-auto">
        <div className="divide-y divide-[#F0EBDD]">
          <button onClick={onSemua} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
            <span className={`text-[13px] ${filterSet.length === 0 ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>Semua Kategori</span>
            {filterSet.length === 0 && <Check size={14} className="text-[#1B2A26]" />}
          </button>

          {kategoriAda.map((k) => {
            const aktif = filterSet.includes(k);
            return (
              <button
                key={k}
                onClick={() => (pakaiCheckbox ? onToggleKategori(k) : onPilihTunggal(k))}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left"
              >
                {pakaiCheckbox && (
                  <span
                    className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center ${
                      aktif ? "bg-[#1B2A26] border-[#1B2A26]" : "border-[#C9C2B2] bg-white"
                    }`}
                  >
                    {aktif && <Check size={11} className="text-white" />}
                  </span>
                )}
                <span className={`text-[13px] ${aktif ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>{k}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Popup Sort untuk halaman Data Aset: Tanggal, Nominal, Nama, Rentang Waktu (toggle sama seperti Transaksi + Nama)
function PanelUrutanDropdownAset({ buka, urutan, onUbah, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka, onClose]);

  const pilih = (v) => {
    onUbah(v);
    onClose();
  };

  const aktifTanggal = urutan === "terbaru" || urutan === "terlama";
  const aktifNominal = urutan === "terkecil" || urutan === "terbesar";
  const aktifNama = urutan === "az" || urutan === "za";
  const aktifRentang = urutan === "rentang";

  return (
    <div
      ref={ref}
      className={`absolute top-full right-0 mt-1.5 w-full origin-top-right z-20 transition-all duration-150 ease-out ${
        buka ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="rounded-xl border border-[#E7E1D3] bg-white shadow-md overflow-hidden">
        <button
          onClick={() => pilih(urutan === "terbaru" ? "terlama" : "terbaru")}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0EBDD] text-left"
        >
          <span className={`text-[13px] ${aktifTanggal ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>
            Tanggal {urutan === "terbaru" ? "(Terbaru)" : urutan === "terlama" ? "(Terlama)" : ""}
          </span>
          {aktifTanggal && <Check size={14} className="text-[#1B2A26]" />}
        </button>
        <button
          onClick={() => pilih(urutan === "terkecil" ? "terbesar" : "terkecil")}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0EBDD] text-left"
        >
          <span className={`text-[13px] ${aktifNominal ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>
            Nominal {urutan === "terkecil" ? "(Terkecil)" : urutan === "terbesar" ? "(Terbesar)" : ""}
          </span>
          {aktifNominal && <Check size={14} className="text-[#1B2A26]" />}
        </button>
        <button
          onClick={() => pilih(urutan === "az" ? "za" : "az")}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border-b border-[#F0EBDD] text-left"
        >
          <span className={`text-[13px] ${aktifNama ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>
            Nama {urutan === "az" ? "(A-Z)" : urutan === "za" ? "(Z-A)" : ""}
          </span>
          {aktifNama && <Check size={14} className="text-[#1B2A26]" />}
        </button>
        <button onClick={() => pilih("rentang")} className="w-full flex items-center justify-between px-3.5 py-2.5 text-left">
          <span className={`text-[13px] ${aktifRentang ? "text-[#1B2A26] font-medium" : "text-[#8B8579]"}`}>Rentang Waktu</span>
          {aktifRentang && <Check size={14} className="text-[#1B2A26]" />}
        </button>
      </div>
    </div>
  );
}

function BarisInfo({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3.5 last:mb-0">
      <p className="text-[12px] text-[#8B8579] shrink-0">{label}</p>
      <div className="text-[13px] text-[#1B2A26] font-medium text-right truncate min-w-0">{children}</div>
    </div>
  );
}

function JudulSection({ children }) {
  return <p className="text-[11px] uppercase tracking-wide text-[#8B8579] font-semibold mb-3">{children}</p>;
}

// Transisi halus (fade + slide kecil, ~180ms) setiap kali mode Detail↔Edit berganti —
// dipicu ulang lewat prop `pemicu` yang di-key-kan dari luar (biasanya `mode`).
function FadeIn({ pemicu, children }) {
  const [tampil, setTampil] = useState(false);
  useEffect(() => {
    setTampil(false);
    const id = requestAnimationFrame(() => setTampil(true));
    return () => cancelAnimationFrame(id);
  }, [pemicu]);
  return (
    <div className={`transition-all duration-[180ms] ease-out ${tampil ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {children}
    </div>
  );
}

// Ikon & label jenis akun virtual untuk Detail Transfer (Kas/Bank/E-Wallet) —
// akun aset manual (Tabungan/Investasi/dll) memakai ikon generik karena daftar aset
// tidak diteruskan sampai ke komponen ini.
function infoAkunTransfer(id) {
  if (id === ID_BANK_TRANSAKSI) return { Ikon: Landmark, tipe: "Bank" };
  if (id === ID_EWALLET_TRANSAKSI) return { Ikon: Smartphone, tipe: "E-Wallet" };
  if (id === ID_SALDO_TRANSAKSI) return { Ikon: Banknote, tipe: "Kas" };
  return { Ikon: Wallet, tipe: "Aset" };
}

// ---------- DETAIL TRANSFER (khusus tipe "transfer") ----------
// Tampilan struk/laporan transfer: banner status, ringkasan total, saldo akun
// sebelum/sesudah (dari `snapshot`, lihat hitungSaldoSebelumSesudah), detail
// transaksi, dan riwayat aktivitas. Seluruhnya dibangun dari data yang sudah ada
// (t.transferInfo, menunggu, snapshot) — tidak ada field baru yang disimpan.
function DetailTransfer({ t, menunggu, snapshot, goTo, onHapus, onMintaEdit }) {
  const info = t.transferInfo || {};
  const sedangTerjadwal = isTerjadwal(t);
  const nominalTransfer = Math.abs(Number(info.nominal) || 0);
  const biayaAdmin = Math.abs(Number(info.biayaAdmin) || 0);
  const totalDebit = nominalTransfer + biayaAdmin;
  const nominalTeks = rupiah(nominalTransfer);
  const nominalPanjang = nominalTeks.length > 16;
  const nominalSangatPanjang = nominalTeks.length > 21;
  const idTransaksi = t.transferId || t.id || "—";

  const statusTeks = menunggu ? "Menunggu saldo" : sedangTerjadwal ? "Terjadwal" : "Selesai";
  const penjelasan = menunggu
    ? "Transfer belum diproses karena saldo akun asal belum mencukupi."
    : sedangTerjadwal
      ? "Transfer akan memindahkan saldo secara otomatis pada tanggal transaksi."
      : "Nominal utama hanya berpindah antar akun. Hanya biaya admin yang menjadi pengeluaran.";

  const barisInfo = [
    ["Akun asal", info.dari || "—"],
    ["Akun tujuan", info.ke || "—"],
    ["Nominal transfer", rupiah(nominalTransfer)],
    ["Biaya admin", rupiah(biayaAdmin)],
    ["Total debit", rupiah(totalDebit)],
    ["Metode", "Transfer"],
    ["ID transaksi", idTransaksi],
  ];

  const titikAtas = [];
  const titikBawah = [];
  for (let i = 0; i <= 100; i += 2) {
    titikAtas.push(`${i}% ${i % 4 === 0 ? "8px" : "2px"}`);
  }
  for (let i = 100; i >= 0; i -= 2) {
    titikBawah.push(`${i}% calc(100% - ${i % 4 === 0 ? "8px" : "2px"})`);
  }
  const receiptClip = `polygon(${[...titikAtas, "100% calc(100% - 8px)", ...titikBawah, "0 8px"].join(", ")})`;

  return (
    <FadeIn pemicu={t}>
      <section
        className="bg-white px-3.5 pt-4 pb-4 shadow-[0_10px_28px_rgba(27,42,38,0.065)]"
        style={{ clipPath: receiptClip }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EAF0F5] text-[#3F7FA5] flex items-center justify-center shrink-0">
            <ArrowLeftRight size={17} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-[#1B2A26] leading-tight whitespace-normal break-words">
              {t.nama || "Transfer & Kelola"}
            </p>
            <p className="text-[9.5px] sm:text-[10px] text-[#8B8579] mt-0.5 leading-[1.25] whitespace-normal break-words pr-1">
              {t.tgl} · Transfer antar akun
            </p>
          </div>
        </div>

        <div className={`mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3 py-2.5 ${nominalPanjang ? "flex justify-center" : "flex items-center justify-between gap-3"}`}>
          {!nominalPanjang && (
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#9A958B] font-semibold">Dana dipindahkan</p>
              <p className="text-[10px] text-[#8B8579] mt-0.5 truncate">Dari akun asal ke akun tujuan</p>
            </div>
          )}
          <p
            className={`${nominalSangatPanjang ? "text-[18px]" : nominalPanjang ? "text-[21px]" : "text-[24px]"} leading-none font-semibold text-[#3F7FA5] ${nominalPanjang ? "w-full text-center" : "text-right shrink-0"}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            title={nominalTeks}
          >
            {nominalTeks}
          </p>
        </div>

        <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3">
          {barisInfo.map(([label, nilai], index) => (
            <div key={label} className={`min-w-0 flex items-center justify-between gap-3 py-2 ${index < barisInfo.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}>
              <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold shrink-0">{label}</span>
              <span
                className="min-w-0 max-w-[62%] text-[10.8px] font-medium text-[#1B2A26] text-right whitespace-normal break-words"
                style={["Nominal transfer", "Biaya admin", "Total debit", "ID transaksi"].includes(label) ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
              >
                {nilai}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 rounded-xl bg-[#EEF5F8] border border-[#D6E6ED] px-3 py-2.5 flex items-start gap-2">
          <ShieldCheck size={14} className="text-[#3F7FA5] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold text-[#3F6F88]">{statusTeks}</p>
            <p className="text-[10.2px] leading-[1.45] text-[#62747D] mt-0.5">{penjelasan}</p>
          </div>
        </div>

        {t.catatan && t.catatan.trim() && (
          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#DED9CF] flex items-start gap-2">
            <FileText size={13} className="text-[#8B8579] shrink-0 mt-0.5" />
            <p className="text-[9.8px] leading-[1.4] text-[#767C77] break-words">{t.catatan}</p>
          </div>
        )}

        <div className="mt-2.5 flex items-stretch gap-2.5">
          <button
            onClick={onHapus}
            className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold border border-[#E1BBB0] bg-white text-[#B5533C] flex items-center justify-center gap-1.5 active:opacity-90"
          >
            <Trash2 size={13} /> Hapus
          </button>
          {onMintaEdit && (
            <button
              onClick={onMintaEdit}
              className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold bg-[#3F7FA5] text-white flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
      </section>
    </FadeIn>
  );
}

function DetailTransaksi({ t, menunggu, snapshot, goTo, onPilihFab, onMintaEdit, onHapus }) {
  if (t.tipe === "transfer") {
    return <DetailTransfer t={t} menunggu={menunggu} snapshot={snapshot} goTo={goTo} onHapus={onHapus} onMintaEdit={onMintaEdit} />;
  }

  // Sisanya khusus Pemasukan/Pengeluaran/Biaya Admin Transfer (transfer sudah
  // ditangani DetailTransfer di atas).
  const isBiayaTransfer = t.tipe === "biaya-transfer";
  const isTransaksiCicilan = ["pembayaran-cicilan", "biaya-cicilan"].includes(t.tipe);
  const isTransaksiHutangPiutang = ["pencairan-hutang", "pemberian-piutang", "pembayaran-hutang", "pembayaran-piutang", "biaya-hutang"].includes(t.tipe);
  const isGaji = t.tipe !== "biaya-transfer" && t.tipe !== "transfer" && t.jumlah > 0 && t.kat === "Gaji";
  const positif = t.jumlah > 0;
  const sedangTerjadwal = isTerjadwal(t);
  const adaCatatan = Boolean(t.catatan && t.catatan.trim());
  const pernahTerjadwal = pernahTerjadwalTransaksi(t);
  const statusBadge = menunggu
    ? <BadgeMenungguSaldo />
    : sedangTerjadwal
      ? <BadgeTerjadwal />
      : <span className={`${KELAS_BADGE_DASAR} text-[#2F6F5E] bg-[#EAF2EE]`}>Selesai</span>;

  let jenisLabel = positif ? "Pemasukan" : "Pengeluaran";
  let jenisWarna = positif ? "#2F6F5E" : "#B5533C";
  let nominalTampil = t.jumlah;
  let IkonTipe = positif ? ArrowDownLeft : ArrowUpRight;
  let ikonKelas = positif ? "bg-[#EAF2EE] text-[#2F6F5E]" : "bg-[#F3E7E1] text-[#B5533C]";
  if (isBiayaTransfer) {
    const catatan = (t.catatan || "").trim();
    const relasi = catatan.match(/dari\s+(.+?)\s+ke\s+(.+?)\s+senilai\s+(Rp\s+[^.]+(?:\.[^.]+)*)\.?$/i);
    const akunAsal = relasi?.[1] || namaAkunUntukPesan(t) || "—";
    const akunTujuan = relasi?.[2] || "—";
    const nominalTransfer = relasi?.[3] || "—";
    const barisInfo = [
      ["Akun asal", akunAsal],
      ["Akun tujuan", akunTujuan],
      ["Nominal transfer", nominalTransfer],
      ["Metode", "Transfer"],
      ["ID transaksi", t.transferId || "—"],
    ];

    const titikAtas = [];
    const titikBawah = [];
    for (let i = 0; i <= 100; i += 2) {
      titikAtas.push(`${i}% ${i % 4 === 0 ? "8px" : "2px"}`);
    }
    for (let i = 100; i >= 0; i -= 2) {
      titikBawah.push(`${i}% calc(100% - ${i % 4 === 0 ? "8px" : "2px"})`);
    }
    const receiptClip = `polygon(${[...titikAtas, "100% calc(100% - 8px)", ...titikBawah, "0 8px"].join(", ")})`;

    return (
      <FadeIn pemicu={t}>
        <section
          className="bg-white px-3.5 pt-4 pb-4 shadow-[0_10px_28px_rgba(27,42,38,0.065)]"
          style={{ clipPath: receiptClip }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#F7ECE7] text-[#B5533C] flex items-center justify-center shrink-0">
              <FileBadge2 size={17} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#1B2A26] leading-tight truncate">Biaya Admin Transfer</p>
              <p className="text-[10px] text-[#8B8579] mt-0.5 truncate">{t.tgl} · Transaksi sistem</p>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#9A958B] font-semibold">Biaya dibebankan</p>
              <p className="text-[10px] text-[#8B8579] mt-0.5 truncate">Dipotong dari akun asal</p>
            </div>
            <p className="text-[24px] leading-none font-semibold text-[#B5533C] text-right shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <Nominal n={t.jumlah} className="text-right" />
            </p>
          </div>

          <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3">
            {barisInfo.map(([label, nilai], index) => (
              <div key={label} className={`min-w-0 flex items-center justify-between gap-3 py-2 ${index < barisInfo.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}>
                <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold shrink-0">{label}</span>
                <span
                  className="min-w-0 max-w-[62%] text-[10.8px] font-medium text-[#1B2A26] text-right truncate"
                  style={label === "Nominal transfer" || label === "ID transaksi" ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
                >
                  {nilai}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-xl bg-[#F3F7F5] border border-[#DDE9E3] px-3 py-2.5 flex items-start gap-2">
            <ShieldCheck size={14} className="text-[#2F6F5E] shrink-0 mt-0.5" />
            <p className="text-[10.2px] leading-[1.45] text-[#64716A]">
              Biaya admin menjadi pengeluaran. Nominal utama hanya berpindah dari akun asal ke akun tujuan.
            </p>
          </div>

          {menunggu && (
            <div className="mt-2.5 rounded-xl bg-white border border-[#F0DCAA] px-3 py-2.5">
              <p className="text-[10.8px] font-semibold text-[#966A22]">Saldo akun asal belum cukup</p>
              <p className="text-[9.8px] text-[#8A6D3B] leading-snug mt-0.5">Biaya diproses otomatis setelah saldo tersedia.</p>
            </div>
          )}

          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#DED9CF] flex items-start gap-2">
            <Info size={13} className="text-[#8B8579] shrink-0 mt-0.5" />
            <p className="text-[9.8px] leading-[1.4] text-[#767C77]">
              Terhubung ke transfer induk. Menghapus detail ini akan menghapus transfer dan biaya terkait.
            </p>
          </div>

          <button
            onClick={onHapus}
            className="w-full h-[40px] mt-2.5 rounded-xl text-[11.8px] font-semibold border border-[#E1BBB0] bg-white text-[#B5533C] flex items-center justify-center gap-2 active:opacity-90"
          >
            <Trash2 size={13} /> Hapus Transfer Terkait
          </button>
        </section>
      </FadeIn>
    );
  }

  if (isGaji) {
    const nominalGaji = Math.abs(Number(t.jumlah) || 0);
    const nominalGajiTeks = rupiah(nominalGaji);
    // Area nominal mengikuti tiga tahap: normal, hilangkan keterangan kiri, lalu kecilkan font.
    const nominalPanjang = nominalGajiTeks.length > 16;
    const nominalSangatPanjang = nominalGajiTeks.length > 21;

    const barisInfo = [
      ["Sumber pemasukan", t.kat || "Gaji"],
      ["Metode penerimaan", t.metode || "—"],
      ["Tanggal", t.tgl || "—"],
      ["Status", sedangTerjadwal ? "Terjadwal" : "Selesai"],
      ["ID transaksi", t.id || "—"],
    ];

    const titikAtas = [];
    const titikBawah = [];
    for (let i = 0; i <= 100; i += 2) {
      titikAtas.push(`${i}% ${i % 4 === 0 ? "8px" : "2px"}`);
    }
    for (let i = 100; i >= 0; i -= 2) {
      titikBawah.push(`${i}% calc(100% - ${i % 4 === 0 ? "8px" : "2px"})`);
    }
    const receiptClip = `polygon(${[...titikAtas, "100% calc(100% - 8px)", ...titikBawah, "0 8px"].join(", ")})`;

    return (
      <FadeIn pemicu={t}>
        <section
          className="bg-white px-3.5 pt-4 pb-4 shadow-[0_10px_28px_rgba(27,42,38,0.065)]"
          style={{ clipPath: receiptClip }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2EE] text-[#2F6F5E] flex items-center justify-center shrink-0">
              <Banknote size={17} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#1B2A26] leading-tight truncate">{t.nama || "Gaji"}</p>
              <p className="text-[9.5px] sm:text-[10px] text-[#8B8579] mt-0.5 leading-[1.25] whitespace-normal break-words pr-1">{t.tgl} · Pemasukan gaji</p>
            </div>
          </div>

          <div className={`mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3 py-2.5 ${nominalPanjang ? "flex justify-center" : "flex items-center justify-between gap-3"}`}>
            {!nominalPanjang && (
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#9A958B] font-semibold">Dana diterima</p>
                <p className="text-[10px] text-[#8B8579] mt-0.5 truncate">Masuk melalui {t.metode || "metode terpilih"}</p>
              </div>
            )}
            <p
              className={`${nominalSangatPanjang ? "text-[18px]" : nominalPanjang ? "text-[21px]" : "text-[24px]"} leading-none font-semibold text-[#2F6F5E] ${nominalPanjang ? "w-full text-center" : "text-right shrink-0"}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              title={nominalGajiTeks}
            >
              {nominalGajiTeks}
            </p>
          </div>

          <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3">
            {barisInfo.map(([label, nilai], index) => (
              <div key={label} className={`min-w-0 flex items-center justify-between gap-3 py-2 ${index < barisInfo.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}>
                <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold shrink-0">{label}</span>
                <span
                  className="min-w-0 max-w-[62%] text-[10.8px] font-medium text-[#1B2A26] text-right truncate"
                  style={label === "ID transaksi" ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
                >
                  {nilai}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-xl bg-[#F3F7F5] border border-[#DDE9E3] px-3 py-2.5 flex items-start gap-2">
            <ShieldCheck size={14} className="text-[#2F6F5E] shrink-0 mt-0.5" />
            <p className="text-[10.2px] leading-[1.45] text-[#64716A]">
              {sedangTerjadwal
                ? "Pemasukan ini masih terjadwal dan baru menambah saldo saat tanggal transaksi tiba."
                : "Pemasukan gaji telah menambah saldo transaksi melalui metode penerimaan yang dipilih."}
            </p>
          </div>

          {adaCatatan && (
            <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#DED9CF] flex items-start gap-2">
              <FileText size={13} className="text-[#8B8579] shrink-0 mt-0.5" />
              <p className="text-[9.8px] leading-[1.4] text-[#767C77] break-words">{t.catatan}</p>
            </div>
          )}

          <div className="mt-2.5 flex items-stretch gap-2.5">
            <button
              onClick={onHapus}
              className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold border border-[#E1BBB0] bg-white text-[#B5533C] flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <Trash2 size={13} /> Hapus
            </button>
            <button
              onClick={onMintaEdit}
              className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold bg-[#2F6F5E] text-white flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <Pencil size={13} /> Edit
            </button>
          </div>
        </section>
      </FadeIn>
    );
  }

  if (t.tipe === "hutang-aktif" || t.tipe === "piutang-aktif") {
    const piutang = t.tipe === "piutang-aktif";
    const tema = piutang
      ? { utama: "#B7792F", lembut: "#F8F0E4", border: "#EBD9BE", ikon: "receivable" }
      : { utama: "#765B9A", lembut: "#F0EBF6", border: "#DED3EB", ikon: "loan" };
    const nominalTeks = rupiah(Math.abs(Number(t.jumlah) || 0));
    const nominalPanjang = nominalTeks.length > 16;
    const nominalSangatPanjang = nominalTeks.length > 21;
    const idTransaksi = t.id || `relasi-${t.relasiId || "—"}`;
    const barisInfo = [
      ["Jenis", piutang ? "Piutang" : "Hutang"],
      ["Pihak", String(t.nama || "—").replace(/^(Piutang|Hutang)\s*[—-]\s*/i, "")],
      ["Tanggal", t.tgl || "—"],
      ["Status", t.statusRelasi || "Aktif"],
      ["ID transaksi", idTransaksi],
    ];
    const titikAtas = [];
    const titikBawah = [];
    for (let i = 0; i <= 100; i += 2) titikAtas.push(`${i}% ${i % 4 === 0 ? "8px" : "2px"}`);
    for (let i = 100; i >= 0; i -= 2) titikBawah.push(`${i}% calc(100% - ${i % 4 === 0 ? "8px" : "2px"})`);
    const receiptClip = `polygon(${[...titikAtas, "100% calc(100% - 8px)", ...titikBawah, "0 8px"].join(", ")})`;

    return (
      <FadeIn pemicu={t}>
        <section className="bg-white px-3.5 pt-4 pb-4 shadow-[0_10px_28px_rgba(27,42,38,0.065)]" style={{ clipPath: receiptClip }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tema.lembut, color: tema.utama }}>
              <Icon name={tema.ikon} size={17} strokeWidth={1.9} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#1B2A26] leading-tight whitespace-normal break-words">{t.nama || (piutang ? "Piutang" : "Hutang")}</p>
              <p className="text-[9.5px] sm:text-[10px] text-[#8B8579] mt-0.5 leading-[1.25] whitespace-normal break-words pr-1">{t.tgl || "—"} · {piutang ? "Dana dipinjamkan" : "Dana pinjaman"}</p>
            </div>
          </div>

          <div className={`mt-2.5 rounded-xl border bg-white px-3 py-2.5 ${nominalPanjang ? "flex justify-center" : "flex items-center justify-between gap-3"}`} style={{ borderColor: tema.border }}>
            {!nominalPanjang && (
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#9A958B] font-semibold">{piutang ? "Dana diberikan" : "Dana diterima"}</p>
                <p className="text-[10px] text-[#8B8579] mt-0.5 whitespace-normal break-words">Tidak mengubah saldo transaksi operasional</p>
              </div>
            )}
            <p className={`${nominalSangatPanjang ? "text-[18px]" : nominalPanjang ? "text-[21px]" : "text-[24px]"} leading-none font-semibold ${nominalPanjang ? "w-full text-center" : "text-right shrink-0"}`} style={{ color: tema.utama, fontFamily: "'JetBrains Mono', monospace" }} title={nominalTeks}>{nominalTeks}</p>
          </div>

          <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3">
            {barisInfo.map(([label, nilai], index) => (
              <div key={label} className={`min-w-0 flex items-center justify-between gap-3 py-2 ${index < barisInfo.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}>
                <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold shrink-0">{label}</span>
                <span className="min-w-0 max-w-[62%] text-[10.8px] font-medium text-[#1B2A26] text-right whitespace-normal break-words" style={label === "ID transaksi" ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}>{nilai}</span>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-xl border px-3 py-2.5 flex items-start gap-2" style={{ backgroundColor: tema.lembut, borderColor: tema.border }}>
            <ShieldCheck size={14} style={{ color: tema.utama }} className="shrink-0 mt-0.5" />
            <p className="text-[10.2px] leading-[1.45] text-[#64716A]">{piutang ? "Piutang aktif dicatat sebagai dana yang masih harus diterima dan tidak menjadi pengeluaran operasional." : "Hutang aktif dicatat sebagai kewajiban dan tidak dianggap sebagai pemasukan operasional maupun saldo transaksi."}</p>
          </div>

          <button onClick={onMintaEdit} className="mt-2.5 w-full h-[40px] rounded-xl text-[11.8px] font-semibold text-white flex items-center justify-center gap-1.5 active:opacity-90" style={{ backgroundColor: tema.utama }}>
            <Pencil size={13} /> Kelola {piutang ? "Piutang" : "Hutang"}
          </button>
        </section>
      </FadeIn>
    );
  }

  // Detail standar untuk seluruh pemasukan/pengeluaran yang belum memiliki
  // modul khusus. Struktur visualnya mengikuti struk Gaji/Biaya Admin/Transfer,
  // sedangkan warna, ikon, label, dan penjelasan mengikuti jenis transaksinya.
  const kategori = t.kat || (positif ? "Pemasukan" : "Pengeluaran");
  const isHutang = kategori === "Hutang";
  const isPiutang = kategori === "Piutang";
  const ikonNama = positif
    ? (IKON_KATEGORI_PEMASUKAN[kategori] || "cash")
    : (IKON_KATEGORI_PENGELUARAN[kategori] || "more");
  const tema = isHutang
    ? { utama: "#765B9A", lembut: "#F0EBF6", border: "#DED3EB", label: positif ? "Dana pinjaman diterima" : "Pembayaran hutang" }
    : isPiutang
      ? { utama: "#B7792F", lembut: "#F8F0E4", border: "#EBD9BE", label: positif ? "Piutang diterima" : "Piutang diberikan" }
      : positif
        ? { utama: "#2F6F5E", lembut: "#EAF2EE", border: "#D7E6DF", label: "Dana diterima" }
        : { utama: "#B5533C", lembut: "#F3E7E1", border: "#E8CEC5", label: "Dana dibayarkan" };

  const nominalAbsolut = Math.abs(Number(t.jumlah) || 0);
  const nominalTeks = rupiah(nominalAbsolut);
  const nominalPanjang = nominalTeks.length > 16;
  const nominalSangatPanjang = nominalTeks.length > 21;
  const idTransaksi = t.id || t.transferId || "—";
  const statusTeks = menunggu ? "Menunggu saldo" : sedangTerjadwal ? "Terjadwal" : "Selesai";
  const labelKategori = positif ? "Sumber pemasukan" : "Kategori pengeluaran";
  const labelMetode = positif ? "Metode penerimaan" : "Metode pembayaran";
  const barisInfo = [
    [labelKategori, kategori],
    [labelMetode, t.metode || "—"],
    ["Tanggal", t.tgl || "—"],
    ["Status", statusTeks],
    ["ID transaksi", idTransaksi],
  ];

  const penjelasanTransaksi = menunggu
    ? `Transaksi belum diproses karena saldo ${namaAkunUntukPesan(t)} belum mencukupi.`
    : sedangTerjadwal
      ? "Transaksi akan diproses otomatis pada tanggal yang telah ditentukan."
      : isTransaksiCicilan
        ? (t.tipe === "pembayaran-cicilan"
          ? "Pembayaran pokok telah mengurangi saldo akun dan sisa kewajiban cicilan."
          : "Biaya cicilan telah mengurangi saldo dan dicatat sebagai pengeluaran operasional.")
      : isHutang
        ? (positif
          ? "Dana hutang dicatat terpisah sebagai kewajiban dan tidak dianggap sebagai pendapatan operasional."
          : "Pembayaran hutang mengurangi kewajiban sesuai nominal transaksi.")
        : isPiutang
          ? (positif
            ? "Pembayaran piutang telah diterima dan dicatat sebagai dana masuk."
            : "Dana piutang telah diberikan dan dicatat sebagai dana keluar sampai dilunasi.")
          : positif
            ? "Transaksi telah menambah saldo melalui metode penerimaan yang dipilih."
            : "Transaksi telah mengurangi saldo melalui metode pembayaran yang dipilih.";

  const titikAtas = [];
  const titikBawah = [];
  for (let i = 0; i <= 100; i += 2) titikAtas.push(`${i}% ${i % 4 === 0 ? "8px" : "2px"}`);
  for (let i = 100; i >= 0; i -= 2) titikBawah.push(`${i}% calc(100% - ${i % 4 === 0 ? "8px" : "2px"})`);
  const receiptClip = `polygon(${[...titikAtas, "100% calc(100% - 8px)", ...titikBawah, "0 8px"].join(", ")})`;

  return (
    <FadeIn pemicu={t}>
      <section
        className="bg-white px-3.5 pt-4 pb-4 shadow-[0_10px_28px_rgba(27,42,38,0.065)]"
        style={{ clipPath: receiptClip }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: tema.lembut, color: tema.utama }}
          >
            <Icon name={ikonNama} size={17} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-[#1B2A26] leading-tight whitespace-normal break-words">
              {t.nama || kategori}
            </p>
            <p className="text-[9.5px] sm:text-[10px] text-[#8B8579] mt-0.5 leading-[1.25] whitespace-normal break-words pr-1">
              {t.tgl || "—"} · {positif ? "Pemasukan" : "Pengeluaran"} {kategori.toLowerCase()}
            </p>
          </div>
        </div>

        <div
          className={`mt-2.5 rounded-xl border bg-white px-3 py-2.5 ${nominalPanjang ? "flex justify-center" : "flex items-center justify-between gap-3"}`}
          style={{ borderColor: tema.border }}
        >
          {!nominalPanjang && (
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#9A958B] font-semibold">{tema.label}</p>
              <p className="text-[10px] text-[#8B8579] mt-0.5 whitespace-normal break-words">
                {positif ? `Melalui ${t.metode || "metode terpilih"}` : `Dibayar melalui ${t.metode || "metode terpilih"}`}
              </p>
            </div>
          )}
          <p
            className={`${nominalSangatPanjang ? "text-[18px]" : nominalPanjang ? "text-[21px]" : "text-[24px]"} leading-none font-semibold ${nominalPanjang ? "w-full text-center" : "text-right shrink-0"}`}
            style={{ color: tema.utama, fontFamily: "'JetBrains Mono', monospace" }}
            title={`${positif ? "+" : "-"}${nominalTeks}`}
          >
            {positif ? "+" : "-"}{nominalTeks}
          </p>
        </div>

        <div className="mt-2.5 rounded-xl border border-[#ECE8DF] bg-white px-3">
          {barisInfo.map(([label, nilai], index) => (
            <div key={label} className={`min-w-0 flex items-center justify-between gap-3 py-2 ${index < barisInfo.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}>
              <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold shrink-0">{label}</span>
              <span
                className="min-w-0 max-w-[62%] text-[10.8px] font-medium text-[#1B2A26] text-right whitespace-normal break-words"
                style={label === "ID transaksi" ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
              >
                {nilai}
              </span>
            </div>
          ))}
        </div>

        <div
          className="mt-2.5 rounded-xl border px-3 py-2.5 flex items-start gap-2"
          style={{ backgroundColor: tema.lembut, borderColor: tema.border }}
        >
          <ShieldCheck size={14} style={{ color: tema.utama }} className="shrink-0 mt-0.5" />
          <p className="text-[10.2px] leading-[1.45] text-[#64716A]">{penjelasanTransaksi}</p>
        </div>

        {adaCatatan && (
          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#DED9CF] flex items-start gap-2">
            <FileText size={13} className="text-[#8B8579] shrink-0 mt-0.5" />
            <p className="text-[9.8px] leading-[1.4] text-[#767C77] whitespace-normal break-words">{t.catatan}</p>
          </div>
        )}

        {pernahTerjadwal && (
          <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#DED9CF] flex items-center justify-between gap-3">
            <span className="text-[9.5px] uppercase tracking-[0.09em] text-[#9A958B] font-semibold">Riwayat</span>
            <span className="text-[10px] text-[#767C77] text-right">{sedangTerjadwal ? "Dijadwalkan" : "Telah diproses"} · {t.tgl}</span>
          </div>
        )}

        {isTransaksiCicilan || isTransaksiHutangPiutang ? (
          <button onClick={onMintaEdit} className="mt-2.5 w-full h-[40px] rounded-xl text-[11.8px] font-semibold bg-[#2F6F5E] text-white flex items-center justify-center gap-1.5 active:opacity-90">
            <ChevronRight size={13} /> Kelola {isTransaksiCicilan ? "Cicilan" : "Hutang & Piutang"}
          </button>
        ) : (
          <div className="mt-2.5 flex items-stretch gap-2.5">
            <button
              onClick={onHapus}
              className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold border border-[#E1BBB0] bg-white text-[#B5533C] flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <Trash2 size={13} /> Hapus
            </button>
            <button
              onClick={onMintaEdit}
              className="flex-1 h-[40px] rounded-xl text-[11.8px] font-semibold text-white flex items-center justify-center gap-1.5 active:opacity-90"
              style={{ backgroundColor: tema.utama }}
            >
              <Pencil size={13} /> Edit
            </button>
          </div>
        )}
      </section>
    </FadeIn>
  );
}

function Transaksi({ transaksi, hutang = [], menungguSaldoSet, saldoSnapshot, goTo, onDelete, onEdit, onHapusTransfer, onPilihFab, aset, saldo, saldoBank, saldoEwallet, onTransfer, onTambah, modeAwal, onModeAwalTerpakai, onHeaderHiddenChange, pencarianTerbuka = false, onTutupPencarian }) {
  // "ringkasan" = daftar & filter transaksi (tampilan biasa)
  // "transfer" = halaman penuh Transfer & Kelola Dana
  // "tambah" = halaman penuh Tambah Pemasukan/Pengeluaran (preset di presetHalaman)
  // "edit" = halaman penuh Edit Pemasukan/Pengeluaran (item di editTarget)
  // "detail" = halaman penuh Detail Transaksi, read-only (item di detailItem)
  // Ambil permintaan awal langsung saat komponen Transaksi dibuat. Ini membuat
  // pembukaan Transfer dari Beranda tidak bergantung pada timing useEffect/rAF.
  const [mode, setMode] = useState(() =>
    modeAwal?.mode === "transfer"
      ? "transfer"
      : modeAwal?.mode === "tambah"
        ? "tambah"
        : modeAwal?.mode === "detail" && modeAwal?.item
          ? "detail"
          : "ringkasan"
  );
  const [presetHalaman, setPresetHalaman] = useState(() => modeAwal?.mode === "tambah" ? modeAwal.preset : null);
  const [editTarget, setEditTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(() => modeAwal?.mode === "detail" ? modeAwal.item || null : null);
  const [editDirty, setEditDirty] = useState(false);
  const [editShowConfirm, setEditShowConfirm] = useState(false);
  const permintaanTerakhirRef = useRef(null);

  // Saat mode "tambah"/"edit"/"transfer"/"detail" aktif, header global (logo Buku Kas +
  // caption "Transaksi") disembunyikan karena halaman-halaman penuh ini punya header sendiri.
  useEffect(() => {
    onHeaderHiddenChange && onHeaderHiddenChange(mode === "tambah" || mode === "edit" || mode === "transfer" || mode === "detail");
    return () => { onHeaderHiddenChange && onHeaderHiddenChange(false); };
  }, [mode, onHeaderHiddenChange]);


  const bukaTransfer = () => {
    // Sama seperti alur Tambah Pemasukan/Pengeluaran: semua state layar lama
    // dibersihkan di komponen yang sama, lalu mode lokal diubah langsung.
    setPresetHalaman(null);
    setEditTarget(null);
    setDetailItem(null);
    setEditDirty(false);
    setEditShowConfirm(false);
    setMode("transfer");
  };

  const bukaTambah = (preset) => {
    setEditTarget(null);
    setDetailItem(null);
    setEditDirty(false);
    setEditShowConfirm(false);
    setPresetHalaman(preset || null);
    setMode("tambah");
  };

  const bukaDetail = (item) => {
    if (!item) return;
    setPresetHalaman(null);
    setEditTarget(null);
    setEditDirty(false);
    setEditShowConfirm(false);
    setDetailItem(item);
    setMode("detail");
  };

  // Permintaan dari Beranda diproses tepat satu kali berdasarkan requestId.
  // Tidak bergantung pada urutan mount/rAF dan tidak dapat tertimpa oleh render ulang parent.
  useLayoutEffect(() => {
    if (!modeAwal?.requestId || permintaanTerakhirRef.current === modeAwal.requestId) return;
    permintaanTerakhirRef.current = modeAwal.requestId;

    if (modeAwal.mode === "transfer") bukaTransfer();
    else if (modeAwal.mode === "tambah") bukaTambah(modeAwal.preset);
    else if (modeAwal.mode === "detail") bukaDetail(modeAwal.item);

    onModeAwalTerpakai?.(modeAwal.requestId);
    // Hanya requestId yang menjadi pemicu. Fungsi pembuka memakai setter React yang stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeAwal?.requestId]);

  const [q, setQ] = useState("");
  const inputCariRef = useRef(null);
  useEffect(() => {
    if (!pencarianTerbuka) return;
    const id = window.setTimeout(() => inputCariRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [pencarianTerbuka]);
  // Baris "biaya-transfer" kini ditampilkan sebagai kartu Pengeluaran tersendiri
  // di daftar (bukan lagi disembunyikan), sesuai spesifikasi Biaya Admin.
  const dataTampil = useMemo(
    () => [...transaksi, ...aktivitasAktifHutangPiutang(hutang)],
    [transaksi, hutang]
  );
  // Filter kategori: array kategori spesifik yang dipilih, mis. ["masuk:Gaji", "keluar:Makan"].
  // Array kosong berarti "Semua Kategori". Persisten selama layar Transaksi tidak di-unmount.
  const [filterKategoriSet, setFilterKategoriSet] = useState([]);
  const [panelKategoriBuka, setPanelKategoriBuka] = useState(false);
  const [urutan, setUrutan] = useState("terbaru");
  const [panelUrutanBuka, setPanelUrutanBuka] = useState(false);
  const [rentangWaktu, setRentangWaktu] = useState("bulan");
  const [dariKustom, setDariKustom] = useState(todayInput());
  const [sampaiKustom, setSampaiKustom] = useState(todayInput());

  // Daftar kategori dinamis: hanya kategori yang benar-benar punya transaksi, urutan mengikuti daftar master.
  // Kategori "Biaya Admin" khusus baru dianggap "ada" bila minimal 1 transaksinya sudah
  // selesai / bukan transaksi terjadwal (bukan sekadar transfer yang masih dijadwalkan).
  const kategoriMasukAda = useMemo(
    () => SUMBER_PEMASUKAN.filter((k) => dataTampil.some((t) => t.jumlah > 0 && t.kat === k)),
    [dataTampil]
  );
  const kategoriKeluarAda = useMemo(
    () =>
      KATEGORI_PENGELUARAN.filter((k) =>
        k === "Biaya Admin"
          ? dataTampil.some((t) => t.jumlah < 0 && t.kat === k && !isTerjadwal(t) && !menungguSaldoSet.has(t))
          : dataTampil.some((t) => t.jumlah < 0 && t.kat === k)
      ),
    [dataTampil, menungguSaldoSet]
  );
  // Grup "Transfer & Kelola" tidak memiliki subkategori — dianggap "ada" bila minimal
  // satu transaksi transfer utama tersimpan (tipe "transfer"; baris "biaya-transfer"
  // tetap masuk hitungan Pengeluaran lewat kategori "Biaya Admin" di atas).
  const adaTransfer = useMemo(() => dataTampil.some((t) => t.tipe === "transfer"), [dataTampil]);
  const adaHutang = useMemo(() => dataTampil.some((t) => t.tipe === "hutang-aktif" || t.kat === "Hutang"), [dataTampil]);
  const adaPiutang = useMemo(() => dataTampil.some((t) => t.tipe === "piutang-aktif" || t.kat === "Piutang"), [dataTampil]);

  const labelKategori =
    filterKategoriSet.length === 0
      ? "Semua Kategori"
      : filterKategoriSet.length === 1
      ? filterKategoriSet[0].split(":")[1]
      : `${filterKategoriSet.length} Kategori Dipilih`;

  const labelUrutan =
    urutan === "terbaru" ? "Tanggal (Terbaru)"
    : urutan === "terlama" ? "Tanggal (Terlama)"
    : urutan === "terkecil" ? "Nominal (Terkecil)"
    : urutan === "terbesar" ? "Nominal (Terbesar)"
    : "Rentang Waktu";

  const filtered = useMemo(() => {
    const kata = q.trim().toLowerCase();
    let hasil = dataTampil.filter((t) =>
      !kata || [t.nama, t.kat, t.metode, t.tgl].some((nilai) => String(nilai || "").toLowerCase().includes(kata))
    );
    if (filterKategoriSet.length > 0) {
      hasil = hasil.filter((t) =>
        filterKategoriSet.some((sel) => {
          const idx = sel.indexOf(":");
          const arah = sel.slice(0, idx);
          const kat = sel.slice(idx + 1);
          if (arah === "masuk") return t.jumlah > 0 && t.kat === kat;
          if (arah === "keluar") return t.jumlah < 0 && t.kat === kat;
          if (arah === "transfer") return t.tipe === "transfer";
          if (arah === "hutang") return t.tipe === "hutang-aktif" || t.kat === "Hutang";
          if (arah === "piutang") return t.tipe === "piutang-aktif" || t.kat === "Piutang";
          return false;
        })
      );
    }
    if (urutan === "rentang") {
      const { dari, sampai } = rentangTanggal(rentangWaktu, dariKustom, sampaiKustom);
      hasil = hasil.filter((t) => {
        const ts = parseTglID(t.tgl);
        return ts >= dari && ts <= sampai;
      });
      hasil = [...hasil].sort((a, b) => {
        const ga = menungguSaldoSet.has(a);
        const gb = menungguSaldoSet.has(b);
        if (ga !== gb) return ga ? -1 : 1;
        return parseTglID(b.tgl) - parseTglID(a.tgl);
      });
      return hasil;
    }
    hasil = [...hasil].sort((a, b) => {
      // Transaksi Menunggu Saldo (butuh tindakan pengguna) selalu paling atas,
      // berapa pun urutan tanggal/nominal yang sedang dipilih.
      const ga = menungguSaldoSet.has(a);
      const gb = menungguSaldoSet.has(b);
      if (ga !== gb) return ga ? -1 : 1;
      if (urutan === "terbaru") return parseTglID(b.tgl) - parseTglID(a.tgl);
      if (urutan === "terlama") return parseTglID(a.tgl) - parseTglID(b.tgl);
      if (urutan === "terbesar") return Math.abs(b.jumlah) - Math.abs(a.jumlah);
      return Math.abs(a.jumlah) - Math.abs(b.jumlah);
    });
    return hasil;
  }, [dataTampil, q, filterKategoriSet, urutan, rentangWaktu, dariKustom, sampaiKustom, menungguSaldoSet]);

  return (
    <div className={`px-5 ${mode === "ringkasan" ? "pt-1.5 pb-3 data-page-shell" : mode === "tambah" || mode === "edit" ? "pt-3 pb-2 h-full min-h-0 overflow-hidden flex flex-col" : "pt-4 pb-4 standard-page"}`}>
      {mode === "tambah" ? (
        <>
          <div className="flex items-center gap-2.5 mb-2.5 shrink-0">
            <button
              onClick={() => setMode("ringkasan")}
              className="w-9 h-9 flex items-center justify-start shrink-0 text-[#1B2A26] active:opacity-70"
              aria-label="Kembali ke ringkasan transaksi"
            >
              <ArrowLeft size={18} className="text-[#1B2A26]" />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[19px] text-[#1B2A26] tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                {presetHalaman?.judul ? `Tambah ${presetHalaman.judul}` : "Tambah Transaksi"}
              </h2>
              <p className="mt-0.5 text-[11px] leading-snug text-[#8B8579] truncate">
                {presetHalaman?.tipe === "masuk"
                  ? "Catat dana masuk"
                  : "Catat pengeluaran"}
              </p>
            </div>

            <span
              className={`w-10 h-10 flex items-center justify-end shrink-0 ${
                presetHalaman?.tipe === "masuk" ? "text-[#2F6F5E]" : "text-[#B5533C]"
              }`}
              aria-hidden="true"
            >
              {presetHalaman?.tipe === "masuk" ? (
                <ArrowDownLeft size={19} strokeWidth={1.9} />
              ) : (
                <ArrowUpRight size={19} strokeWidth={1.9} />
              )}
            </span>
          </div>
          <div className="flex-1 min-h-0">
          <FormTambah
            preset={presetHalaman}
            saldo={saldo}
            saldoBank={saldoBank}
            saldoEwallet={saldoEwallet}
            layout="halaman"
            onClose={() => setMode("ringkasan")}
            onSubmit={onTambah}
          />
          </div>
        </>
      ) : mode === "transfer" ? (
        <>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setMode("ringkasan")}
              className="w-9 h-9 rounded-xl bg-white border border-[#E7E1D3] flex items-center justify-center shrink-0 active:opacity-80"
              aria-label="Kembali"
            >
              <ArrowLeft size={16} className="text-[#1B2A26]" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[19px] text-[#1B2A26] tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Transfer
              </h2>
              <p className="text-[11px] text-[#8B8579] truncate">Pindahkan saldo antar akun dengan aman</p>
            </div>
            <TombolBantuanHeader
              ikon={History}
              label="Riwayat"
              tips="Riwayat transfer bisa dilihat di halaman Transaksi dengan filter Transfer & Kelola."
            />
            <TombolBantuanHeader
              ikon={HelpCircle}
              label="Bantuan"
              tips="Pilih akun asal & tujuan, isi nominal, lalu tekan Simpan Transfer."
            />
          </div>
          <FormTransfer
            aset={aset}
            saldo={saldo}
            saldoBank={saldoBank}
            saldoEwallet={saldoEwallet}
            onClose={() => setMode("ringkasan")}
            onSubmit={onTransfer}
          />
        </>
      ) : mode === "edit" && editTarget ? (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-[16px] text-[#1B2A26] tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Edit {editTarget.jumlah > 0 ? "Pemasukan" : "Pengeluaran"}
            </h2>
            <button
              onClick={() => {
                if (editDirty) setEditShowConfirm(true);
                else setMode("ringkasan");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E7E1D3] text-[12px] font-medium text-[#1B2A26]"
            >
              <ArrowLeft size={13} /> Ringkasan
            </button>
          </div>
          <div className="flex-1 min-h-0">
          <FormTambah
            initial={editTarget}
            initialMenunggu={menungguSaldoSet.has(editTarget)}
            saldo={saldo}
            saldoBank={saldoBank}
            saldoEwallet={saldoEwallet}
            layout="halaman"
            onDirtyChange={setEditDirty}
            onClose={() => setMode("ringkasan")}
            onSubmit={(data) => {
              onEdit(transaksi.indexOf(editTarget), data);
              setMode("ringkasan");
            }}
            onDelete={() => {
              if (editTarget.tipe === "transfer" || editTarget.tipe === "biaya-transfer") {
                onHapusTransfer(editTarget.transferId);
              } else {
                onDelete(transaksi.indexOf(editTarget));
              }
              setMode("ringkasan");
            }}
          />
          </div>

          {editShowConfirm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-8" onClick={() => setEditShowConfirm(false)}>
              <div className="w-full max-w-xs bg-white rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
                <p className="text-[14px] text-[#1B2A26] font-medium mb-1">Perubahan belum disimpan.</p>
                <p className="text-[12px] text-[#8B8579] mb-4">Perubahan yang belum disimpan akan hilang.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-[#E7E1D3] text-[#1B2A26]"
                  >
                    Tetap Edit
                  </button>
                  <button
                    onClick={() => { setEditShowConfirm(false); setEditDirty(false); setMode("ringkasan"); }}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-[#B5533C] text-white"
                  >
                    Buang Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : mode === "detail" && detailItem ? (
        <>
          <div className="mb-2 flex items-center gap-2.5 min-w-0 px-0.5 py-1">
            <button
              onClick={() => { setDetailItem(null); setMode("ringkasan"); }}
              className="w-8 h-8 flex items-center justify-center shrink-0 active:opacity-70"
              aria-label="Kembali ke ringkasan transaksi"
            >
              <ArrowLeft size={19} className="text-[#1B2A26]" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-[18px] leading-tight text-[#1B2A26] tracking-tight whitespace-normal break-words" style={{ fontFamily: "'Fraunces', serif" }}>
                Detail Transaksi
              </h2>
              <p className="text-[10px] sm:text-[10.5px] leading-[1.25] text-[#8B8579] mt-1 whitespace-normal break-words pr-1">
                {detailItem.tipe === "transfer"
                  ? "Transfer & kelola"
                  : detailItem.tipe === "biaya-transfer"
                    ? "Biaya admin transfer"
                    : detailItem.tipe === "hutang-aktif"
                      ? "Detail transaksi hutang"
                      : detailItem.tipe === "piutang-aktif"
                        ? "Detail transaksi piutang"
                        : `${detailItem.jumlah > 0 ? "Pemasukan" : "Pengeluaran"} ${detailItem.kat || "transaksi"}`}
              </p>
            </div>
          </div>
          <DetailTransaksi
            t={detailItem}
            menunggu={menungguSaldoSet.has(detailItem)}
            snapshot={saldoSnapshot.get(detailItem)}
            goTo={goTo}
            onPilihFab={onPilihFab}
            onMintaEdit={() => {
              if (detailItem.sumberData === "hutang-piutang" || ["pencairan-hutang", "pemberian-piutang", "pembayaran-hutang", "pembayaran-piutang", "biaya-hutang"].includes(detailItem.tipe)) {
                goTo("hutang");
                return;
              }
              if (["pembayaran-cicilan", "biaya-cicilan"].includes(detailItem.tipe)) {
                goTo("cicilan");
                return;
              }
              setEditTarget(detailItem);
              setDetailItem(null);
              setMode("edit");
            }}
            onHapus={() => {
              if (detailItem.sumberData === "hutang-piutang" || ["pencairan-hutang", "pemberian-piutang", "pembayaran-hutang", "pembayaran-piutang", "biaya-hutang"].includes(detailItem.tipe)) {
                goTo("hutang");
                return;
              }
              if (["pembayaran-cicilan", "biaya-cicilan"].includes(detailItem.tipe)) {
                goTo("cicilan");
                return;
              }
              if (detailItem.tipe === "transfer" || detailItem.tipe === "biaya-transfer") {
                onHapusTransfer(detailItem.transferId);
              } else {
                onDelete(transaksi.indexOf(detailItem));
              }
              setDetailItem(null);
              setMode("ringkasan");
            }}
          />
        </>
      ) : (
        <>
      {pencarianTerbuka && (
        <div className="h-10 flex items-center gap-2.5 bg-white/92 border border-[#DDE6E1] rounded-2xl px-3 mb-2.5 shadow-[0_8px_22px_rgba(27,42,38,0.055)] focus-within:border-[#78A795] transition-colors">
          <Search size={16} strokeWidth={2} className="text-[#5F746A] shrink-0" />
          <input
            ref={inputCariRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari transaksi…"
            className="min-w-0 flex-1 text-[12.5px] text-[#1B2A26] bg-transparent outline-none placeholder:text-[#9A9F9B]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="w-6 h-6 rounded-full bg-[#EDF1EE] flex items-center justify-center text-[#657069]"
              aria-label="Bersihkan pencarian"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <section className="rounded-[16px] border border-[#E2E8E4] bg-white px-2.5 py-2 mb-2 shadow-[0_6px_18px_rgba(27,42,38,0.04)]">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelUrutanBuka(false);
              setPanelKategoriBuka((v) => !v);
            }}
            className="w-full h-9 flex items-center justify-between gap-2 bg-white border border-[#E2E8E4] rounded-xl px-3 text-[11.5px] font-medium text-[#1B2A26] shadow-[0_2px_8px_rgba(27,42,38,0.025)]"
          >
            <span className="truncate">{labelKategori}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelKategoriBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelKategoriDropdown
            buka={panelKategoriBuka}
            filterSet={filterKategoriSet}
            kategoriMasukAda={kategoriMasukAda}
            kategoriKeluarAda={kategoriKeluarAda}
            adaTransfer={adaTransfer}
            adaHutang={adaHutang}
            adaPiutang={adaPiutang}
            onSemua={() => {
              setFilterKategoriSet([]);
              setPanelKategoriBuka(false);
            }}
            onPilihTunggal={(key) => {
              setFilterKategoriSet([key]);
              setPanelKategoriBuka(false);
            }}
            onToggleKategori={(key) => {
              setFilterKategoriSet((prev) =>
                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
              );
            }}
            onToggleSemuaGrup={(arah, daftarKategori) => {
              // Checkbox header grup (Pemasukan/Pengeluaran): pilih SEMUA subkategori
              // grup ini sekaligus, atau lepas semuanya bila sudah terpilih penuh —
              // memakai filterKategoriSet yang sama persis dengan checkbox per-kategori,
              // jadi tidak menambah mekanisme filter baru.
              const keys = daftarKategori.map((k) => `${arah}:${k}`);
              setFilterKategoriSet((prev) => {
                const semuaSudahDipilih = keys.every((k) => prev.includes(k));
                if (semuaSudahDipilih) return prev.filter((k) => !keys.includes(k));
                return [...prev.filter((k) => !keys.includes(k)), ...keys];
              });
            }}
            onClose={() => setPanelKategoriBuka(false)}
          />
        </div>
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelKategoriBuka(false);
              setPanelUrutanBuka((v) => !v);
            }}
            className="w-full h-9 flex items-center justify-between gap-2 bg-white border border-[#E2E8E4] rounded-xl px-3 text-[11.5px] font-medium text-[#1B2A26] shadow-[0_2px_8px_rgba(27,42,38,0.025)]"
          >
            <span className="truncate">{labelUrutan}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelUrutanBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelUrutanDropdown
            buka={panelUrutanBuka}
            urutan={urutan}
            onUbah={setUrutan}
            onClose={() => setPanelUrutanBuka(false)}
          />
        </div>
      </div>

      {urutan === "rentang" && (
        <div className={`mt-3 ${rentangWaktu === "kustom" ? "mb-2" : "mb-2.5"}`}>
          <div className={`flex gap-2 overflow-x-auto pb-1 ${rentangWaktu === "kustom" ? "mb-2" : ""}`}>
            {RENTANG_OPSI.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRentangWaktu(v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${rentangWaktu === v ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {rentangWaktu === "kustom" && (
            <div className="flex gap-2">
              <input type="date" value={dariKustom} onChange={(e) => setDariKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
              <input type="date" value={sampaiKustom} onChange={(e) => setSampaiKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
            </div>
          )}
        </div>
      )}

      <div className="mt-1.5 pt-1.5 border-t border-[#EDF1EE] flex items-center justify-between gap-3">
        <p className="text-[11px] text-[#8B8579]">{filtered.length} dari {dataTampil.length} transaksi</p>
        {(q || filterKategoriSet.length > 0 || urutan !== "terbaru") && (
          <button type="button" onClick={() => { setQ(""); setFilterKategoriSet([]); setUrutan("terbaru"); }} className="text-[11px] font-medium text-[#2F6F5E]">Reset filter</button>
        )}
      </div>
      </section>

      <div className="data-scroll-region is-scrollable">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada transaksi yang cocok.</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((t, i) => (
              <TxRow
                key={`${t.id || t.transferId || t.relasiId || i}-${i}`}
                t={t}
                last={true}
                menunggu={menungguSaldoSet.has(t)}
                onInfo={() => { setDetailItem(t); setMode("detail"); }}
              />
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {mode === "ringkasan" && (
        <FabMenu
          opsi={OPSI_FAB_TRANSAKSI}
          onPilih={(preset) => {
            if (preset?.tipe === "transfer") {
              onPilihFab?.(preset);
              return;
            }
            if (preset?.tipe === "masuk" || preset?.tipe === "keluar") {
              bukaTambah(preset);
              return;
            }
            onPilihFab?.(preset);
          }}
        />
      )}
    </div>
  );
}

// ---------- LAYAR: STATISTIK ----------
function Statistik({ kategori, tren, totalPengeluaran }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-5 mb-4">
        <h3 className="text-[13px] font-medium text-[#1B2A26] mb-3">Pengeluaran per Kategori</h3>
        {kategori.length === 0 ? (
          <p className="text-[13px] text-[#8B8579] py-4">Belum ada data pengeluaran.</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-28 h-28 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kategori} dataKey="value" innerRadius={32} outerRadius={54} paddingAngle={2}>
                    {kategori.map((k, i) => (
                      <Cell key={i} fill={k.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] text-[#8B8579] uppercase">Total</span>
                <Nominal n={totalPengeluaran} className="text-[13px] font-semibold text-[#1B2A26] text-center" block={false} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {kategori.map((k, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: k.color }} />
                    <span className="text-[#1B2A26]">{k.name}</span>
                  </div>
                  <span className="text-[#8B8579]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{k.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-5">
        <h3 className="text-[13px] font-medium text-[#1B2A26] mb-1">Tren Keuangan</h3>
        <p className="text-[11px] text-[#8B8579] mb-3">Berdasarkan tanggal transaksi (jutaan Rp)</p>
        {tren.length === 0 ? (
          <p className="text-[13px] text-[#8B8579] py-4">Belum ada transaksi.</p>
        ) : (
          <div className="h-36 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tren}>
                <XAxis dataKey="tgl" tick={{ fontSize: 10, fill: "#8B8579" }} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="masuk" stroke="#2F6F5E" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="keluar" stroke="#B5533C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[11px] text-[#8B8579]"><span className="w-2.5 h-0.5 bg-[#2F6F5E] inline-block" />Pemasukan</span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#8B8579]"><span className="w-2.5 h-0.5 bg-[#B5533C] inline-block" />Pengeluaran</span>
        </div>
      </div>
    </div>
  );
}

function buatNamaFile(ekstensi) {
  const d = new Date();
  const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `Laporan_BukuKas_${tgl}.${ekstensi}`;
}

function denganBatasWaktu(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// Simpan Blob ke perangkat dengan prioritas: Web Share API -> File System Access API -> Blob+objectURL (fallback)
async function simpanBlob(blob, namaFile, mimeType) {
  // [1] Web Share API (mendukung file) — langsung ke sistem share/save Android tanpa tab baru
  try {
    if (navigator.canShare && navigator.share) {
      const file = new File([blob], namaFile, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await denganBatasWaktu(navigator.share({ files: [file], title: namaFile }), 3500);
        return;
      }
    }
  } catch (e) {
    if (e && e.name === "AbortError") return; // pengguna membatalkan, jangan lanjut ke fallback
    // error/timeout lain (mis. WebView tanpa handler share) -> lanjut ke metode berikutnya
  }

  // [2] File System Access API — dialog simpan native tanpa tab baru (Chrome/Edge desktop & Android terbaru)
  try {
    if (typeof window.showSaveFilePicker === "function") {
      const ekstensi = namaFile.split(".").pop();
      const handle = await denganBatasWaktu(
        window.showSaveFilePicker({
          suggestedName: namaFile,
          types: [{ description: mimeType, accept: { [mimeType]: [`.${ekstensi}`] } }],
        }),
        3500
      );
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return; // pengguna membatalkan dialog simpan
    // error/timeout lain -> lanjut ke fallback
  }

  // [3] Fallback: Blob + objectURL + atribut download (tidak membuka tab/preview baru)
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function buatPDFFilter({ tipe, baris, ringkasan, judulPeriode, tanggalCetak }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const marginX = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(27, 42, 38);
  doc.text("Buku Kas", marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(139, 133, 121);
  doc.text(`Laporan · ${judulPeriode}`, marginX, y + 5);
  doc.text(`Dicetak ${tanggalCetak}`, 196, y, { align: "right" });
  y += 12;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 1.5 },
    body: ringkasan,
    columnStyles: { 0: { textColor: [139, 133, 121] }, 1: { halign: "right", fontStyle: "bold" } },
  });
  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(27, 42, 38);
  doc.text("Rincian Data", marginX, y);
  y += 3;

  let head, body, columnStyles, kolomJumlah;
  if (tipe === "aset") {
    head = ["Tanggal", "Nama", "Kategori", "Nilai (Rp)"];
    body = baris.map((a) => [a.tanggal, a.nama, a.kategori, angkaSaja(a.nilai)]);
    columnStyles = { 0: { cellWidth: 24 }, 2: { cellWidth: 34 }, 3: { cellWidth: 32, halign: "right" } };
    kolomJumlah = 3;
  } else if (tipe === "hutang") {
    head = ["Nama", "Jumlah (Rp)", "Terbayar (Rp)", "Sisa (Rp)", "Status", "Jatuh Tempo"];
    body = baris.map((h) => {
      const { sisa, status } = statusHutang(h);
      return [h.nama, angkaSaja(h.jumlah), angkaSaja(h.terbayar), angkaSaja(sisa), status, h.jatuhTempo || "-"];
    });
    columnStyles = { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } };
    kolomJumlah = null;
  } else {
    head = ["Tanggal", "Nama", "Kategori/Sumber", "Metode", "Jumlah (Rp)"];
    body = baris.map((t) => [t.tgl, t.nama, t.kat, t.metode, angkaSaja(t.jumlah)]);
    columnStyles = { 0: { cellWidth: 22 }, 2: { cellWidth: 30 }, 3: { cellWidth: 22 }, 4: { cellWidth: 26, halign: "right" } };
    kolomJumlah = 4;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX, bottom: 16 },
    head: [head],
    body,
    headStyles: { fillColor: [27, 42, 38], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2, overflow: "linebreak" },
    showHead: "everyPage",
    columnStyles,
    didParseCell: (d) => {
      if (tipe === "transaksi" && d.section === "body" && d.column.index === kolomJumlah) {
        const raw = baris[d.row.index];
        if (raw) d.cell.styles.textColor = raw.jumlah > 0 ? [47, 111, 94] : [181, 83, 60];
      }
    },
  });

  const totalHalaman = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalHalaman; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(139, 133, 121);
    doc.text(`Dicetak ${tanggalCetak}`, marginX, 289);
    doc.text(`Halaman ${i} dari ${totalHalaman}`, 196, 289, { align: "right" });
  }

  const pdfBlob = doc.output("blob");
  await simpanBlob(pdfBlob, buatNamaFile("pdf"), "application/pdf");
}

async function buatPNG(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
  await new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve();
      await simpanBlob(blob, buatNamaFile("png"), "image/png");
      resolve();
    }, "image/png");
  });
}

// ---------- LAYAR: LAPORAN (berbasis filter) ----------
function Laporan({ transaksi, aset, hutang, onBack }) {
  const [jenisData, setJenisData] = useState("semua");
  const [rentang, setRentang] = useState("bulan");
  const [dariKustom, setDariKustom] = useState(todayInput());
  const [sampaiKustom, setSampaiKustom] = useState(todayInput());
  const [kategori, setKategori] = useState("semua");
  const [metode, setMetode] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [urutanHutang, setUrutanHutang] = useState("terbaru");
  const [tanggalSaldoAwal, setTanggalSaldoAwal] = useState("");
  const [mengunduh, setMengunduh] = useState("");
  const [pesanGagal, setPesanGagal] = useState("");

  const tampilkanKategori = jenisData !== "hutang" && jenisData !== "piutang";
  const tampilkanMetode = jenisData === "semua" || jenisData === "pemasukan" || jenisData === "pengeluaran";
  // Daftar "Metode Pembayaran" kini mengikuti nama akun asli (mis. "Kas (Saldo Transaksi)",
  // "BCA", "OVO") yang benar-benar tercatat di data transaksi — bukan lagi daftar statis
  // generik (Cash/Transfer/E-wallet), konsisten dengan sistem saldo per akun.
  const metodeTampil = useMemo(
    () => [...new Set(transaksi.map((t) => t.metode).filter(Boolean))],
    [transaksi]
  );
  const tampilkanStatusHutang = jenisData === "hutang" || jenisData === "piutang";
  const tampilkanSaldoAwal = jenisData === "semua" || jenisData === "pemasukan" || jenisData === "pengeluaran";
  // Kategori "Biaya Admin" hanya ditampilkan di dropdown filter laporan bila
  // sudah ada minimal 1 transaksi Biaya Admin yang selesai (bukan transfer yang
  // masih terjadwal) — konsisten dengan aturan yang sama di filter Transaksi.
  const adaBiayaAdminSelesai = useMemo(
    () => transaksi.some((t) => t.kat === "Biaya Admin" && t.jumlah < 0 && !isTerjadwal(t)),
    [transaksi]
  );
  const kategoriPengeluaranTampil = useMemo(
    () => (adaBiayaAdminSelesai ? KATEGORI_PENGELUARAN : KATEGORI_PENGELUARAN.filter((k) => k !== "Biaya Admin")),
    [adaBiayaAdminSelesai]
  );
  const kategoriTransaksiTampil = useMemo(
    () => [...new Set([...kategoriPengeluaranTampil, ...SUMBER_PEMASUKAN])],
    [kategoriPengeluaranTampil]
  );
  const opsiKategori =
    jenisData === "aset"
      ? KATEGORI_ASET
      : jenisData === "pemasukan"
      ? [...SUMBER_PEMASUKAN, "Piutang"]
      : jenisData === "pengeluaran"
      ? [...kategoriPengeluaranTampil, "Hutang"]
      : kategoriTransaksiTampil;

  const gantiJenisData = (v) => {
    setJenisData(v);
    setKategori("semua");
    setMetode("semua");
    setStatusFilter("semua");
  };

  const { tipe, baris, ringkasan, ringkasanEkspor } = useMemo(() => {
    const { dari, sampai } = rentangTanggal(rentang, dariKustom, sampaiKustom);
    const dalam = (tgl) => {
      if (!tgl) return false;
      const t = parseTglID(tgl);
      return t >= dari && t <= sampai;
    };

    if (jenisData === "aset") {
      let hasil = aset.filter((a) => dalam(a.tanggal));
      if (kategori !== "semua") hasil = hasil.filter((a) => a.kategori === kategori);
      hasil = [...hasil].sort((a, b) => parseTglID(b.tanggal) - parseTglID(a.tanggal));
      const total = hasil.reduce((acc, a) => acc + a.nilai, 0);
      return {
        tipe: "aset",
        baris: hasil,
        ringkasan: [
          ["Jumlah Aset", String(hasil.length)],
          ["Total Nilai Aset", rupiahBesar(total)],
        ],
        ringkasanEkspor: [
          ["Jumlah Aset", String(hasil.length)],
          ["Total Nilai Aset", rupiah(total)],
        ],
      };
    }

    if (jenisData === "hutang" || jenisData === "piutang") {
      let hasil = hutang.filter((h) => h.jenis === jenisData && dalam(h.tanggal) && statusHutang(h).status !== "Terjadwal");
      if (statusFilter !== "semua") hasil = hasil.filter((h) => statusHutang(h).status === statusFilter);
      hasil = [...hasil].sort((a, b) => {
        if (urutanHutang === "status") return PRIORITAS_STATUS[statusHutang(a).status] - PRIORITAS_STATUS[statusHutang(b).status];
        return urutanHutang === "terbaru" ? parseTglID(b.tanggal) - parseTglID(a.tanggal) : parseTglID(a.tanggal) - parseTglID(b.tanggal);
      });
      const totalSisa = hasil.reduce((acc, h) => acc + statusHutang(h).sisa, 0);
      const labelTotalSisa = jenisData === "piutang" ? "Total Sisa Piutang" : "Total Sisa Hutang";
      return {
        tipe: "hutang",
        baris: hasil,
        ringkasan: [
          ["Jumlah Catatan", String(hasil.length)],
          [labelTotalSisa, rupiahBesar(totalSisa)],
        ],
        ringkasanEkspor: [
          ["Jumlah Catatan", String(hasil.length)],
          [labelTotalSisa, rupiah(totalSisa)],
        ],
      };
    }

    let hasil = transaksi.filter((t) => dalam(t.tgl));
    if (jenisData === "pemasukan") hasil = hasil.filter((t) => t.jumlah > 0);
    if (jenisData === "pengeluaran") hasil = hasil.filter((t) => t.jumlah < 0);
    if (kategori !== "semua") hasil = hasil.filter((t) => t.kat === kategori);
    if (metode !== "semua") hasil = hasil.filter((t) => t.metode === metode);
    hasil = [...hasil].sort((a, b) => parseTglID(b.tgl) - parseTglID(a.tgl));
    const totalMasuk = hasil.filter((t) => t.jumlah > 0).reduce((a, t) => a + t.jumlah, 0);
    const totalKeluar = Math.abs(hasil.filter((t) => t.jumlah < 0).reduce((a, t) => a + t.jumlah, 0));

    const ringkasanTransaksi = [];
    const ringkasanTransaksiEkspor = [];
    if (tanggalSaldoAwal) {
      const batasAwal = new Date(tanggalSaldoAwal).setHours(23, 59, 59, 999);
      const saldoPerTanggal = transaksi.filter((t) => parseTglID(t.tgl) <= batasAwal).reduce((a, t) => a + t.jumlah, 0);
      const labelSaldoPer = `Saldo per ${formatTglDariInput(tanggalSaldoAwal)}`;
      ringkasanTransaksi.push([labelSaldoPer, rupiahBesar(saldoPerTanggal)]);
      ringkasanTransaksiEkspor.push([labelSaldoPer, rupiah(saldoPerTanggal)]);
    }
    ringkasanTransaksi.push(
      ["Total Pemasukan", "+" + rupiahBesar(totalMasuk)],
      ["Total Pengeluaran", rupiahBesar(-totalKeluar)],
      ["Saldo Akhir", rupiahBesar(totalMasuk - totalKeluar)]
    );
    ringkasanTransaksiEkspor.push(
      ["Total Pemasukan", "+" + rupiah(totalMasuk)],
      ["Total Pengeluaran", rupiah(-totalKeluar)],
      ["Saldo Akhir", rupiah(totalMasuk - totalKeluar)]
    );

    return { tipe: "transaksi", baris: hasil, ringkasan: ringkasanTransaksi, ringkasanEkspor: ringkasanTransaksiEkspor };
  }, [jenisData, rentang, dariKustom, sampaiKustom, kategori, metode, statusFilter, urutanHutang, tanggalSaldoAwal, transaksi, aset, hutang]);

  const labelJenis = JENIS_DATA_OPSI.find(([v]) => v === jenisData)?.[1] || "Semua";
  const labelRentang = RENTANG_OPSI.find(([v]) => v === rentang)?.[1] || "";
  const judulPeriode = `${labelJenis} · ${rentang === "kustom" ? `${dariKustom} s/d ${sampaiKustom}` : labelRentang}`;
  const tanggalCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const ekspor = async (format) => {
    if (mengunduh) return;
    if (baris.length === 0) {
      setPesanGagal("Tidak ada data sesuai filter yang dipilih. Ubah filter terlebih dahulu.");
      return;
    }
    setPesanGagal("");
    setMengunduh(format);
    try {
      if (format === "pdf") {
        await buatPDFFilter({ tipe, baris, ringkasan: ringkasanEkspor, judulPeriode, tanggalCetak });
      } else {
        await buatPNG("area-laporan-preview");
      }
    } catch (e) {
      console.error("Gagal membuat laporan:", e);
      setPesanGagal("Gagal mengunduh laporan. Coba lagi.");
    } finally {
      setMengunduh("");
    }
  };

  const opsiJenisDropdown = JENIS_DATA_OPSI.map(([value, label]) => ({
    value,
    label,
    icon:
      value === "aset" ? "asset" :
      value === "hutang" ? "loan" :
      value === "piutang" ? "receivable" :
      value === "pemasukan" ? "salary" :
      value === "pengeluaran" ? "shopping" : "chart",
  }));
  const opsiRentangDropdown = RENTANG_OPSI.map(([value, label]) => ({
    value,
    label,
    icon: value === "kustom" ? "calendar" : "history",
  }));
  const opsiKategoriDropdownLaporan = [
    { value: "semua", label: "Semua Kategori", icon: "category" },
    ...opsiKategori.map((item) => ({
      value: item,
      label: item,
      icon:
        jenisData === "aset"
          ? "asset"
          : jenisData === "pemasukan"
          ? (IKON_KATEGORI_PEMASUKAN[item] || "more")
          : jenisData === "pengeluaran"
          ? (IKON_KATEGORI_PENGELUARAN[item] || "more")
          : (IKON_KATEGORI_PEMASUKAN[item] || IKON_KATEGORI_PENGELUARAN[item] || "more"),
    })),
  ];
  const opsiMetodeDropdownLaporan = [
    { value: "semua", label: "Semua Metode", icon: "wallet" },
    ...metodeTampil.map((item) => ({ value: item, label: item, icon: namaIkonMetode(item) })),
  ];
  const opsiStatusDropdown = [
    { value: "semua", label: "Semua Status", icon: "category" },
    ...STATUS_HUTANG_OPSI.map((item) => ({ value: item, label: item, icon: "loan" })),
  ];
  const opsiUrutanDropdown = [
    { value: "terbaru", label: "Terbaru", icon: "calendar" },
    { value: "terlama", label: "Terlama", icon: "history" },
    { value: "status", label: "Prioritas Status", icon: "category" },
  ];

  return (
    <div className="app-form-page laporan-page">
      <header className="app-form-header">
        <button type="button" onClick={onBack} className="app-form-header__back justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
          <ArrowLeft size={21} strokeWidth={2} />
        </button>
        <div className="app-form-header__copy">
          <h2 className="app-form-header__title">Laporan</h2>
          <p className="app-form-header__description">Filter dan ekspor ringkasan keuangan</p>
        </div>
        <div className="app-form-header__icon justify-end text-[#2F6F5E]" aria-hidden="true">
          <FileText size={21} strokeWidth={1.9} />
        </div>
      </header>

      <section className="app-form-card laporan-filter-card">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label className="app-form-label">Jenis Data</label>
            <DropdownPilihTunggal
              value={jenisData}
              options={opsiJenisDropdown}
              onChange={gantiJenisData}
              accent="#2F6F5E"
              ariaLabel="Pilih jenis data laporan"
            />
          </div>
          <div className="min-w-0">
            <label className="app-form-label">Rentang Tanggal</label>
            <DropdownPilihTunggal
              value={rentang}
              options={opsiRentangDropdown}
              onChange={setRentang}
              accent="#2F6F5E"
              ariaLabel="Pilih rentang tanggal laporan"
            />
          </div>
        </div>

        {rentang === "kustom" && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label className="app-form-label">Dari</label>
              <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[38px] rounded-[11px] border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#2F6F5E]">
                <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]"><History size={13} /></span>
                <input type="date" value={dariKustom} onChange={(e) => setDariKustom(e.target.value)} className="w-full min-w-0 h-full px-2 bg-transparent outline-none text-[10.5px] text-[#1B2A26]" />
              </div>
            </div>
            <div className="min-w-0">
              <label className="app-form-label">Sampai</label>
              <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[38px] rounded-[11px] border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#2F6F5E]">
                <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]"><History size={13} /></span>
                <input type="date" value={sampaiKustom} onChange={(e) => setSampaiKustom(e.target.value)} className="w-full min-w-0 h-full px-2 bg-transparent outline-none text-[10.5px] text-[#1B2A26]" />
              </div>
            </div>
          </div>
        )}

        {tampilkanKategori && (
          <div className="min-w-0">
            <label className="app-form-label">Kategori</label>
            <DropdownPilihTunggal
              value={kategori}
              options={opsiKategoriDropdownLaporan}
              onChange={setKategori}
              accent="#2F6F5E"
              ariaLabel="Pilih kategori laporan"
            />
          </div>
        )}

        {tampilkanMetode && (
          <div className="min-w-0">
            <label className="app-form-label">Metode Pembayaran</label>
            <DropdownPilihTunggal
              value={metode}
              options={opsiMetodeDropdownLaporan}
              onChange={setMetode}
              accent="#2F6F5E"
              ariaLabel="Pilih metode pembayaran laporan"
            />
          </div>
        )}

        {tampilkanStatusHutang && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label className="app-form-label">Status</label>
              <DropdownPilihTunggal value={statusFilter} options={opsiStatusDropdown} onChange={setStatusFilter} accent="#2F6F5E" ariaLabel="Pilih status laporan" />
            </div>
            <div className="min-w-0">
              <label className="app-form-label">Urutkan</label>
              <DropdownPilihTunggal value={urutanHutang} options={opsiUrutanDropdown} onChange={setUrutanHutang} accent="#2F6F5E" ariaLabel="Pilih urutan laporan" />
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => ekspor("pdf")} disabled={!!mengunduh} className="h-[44px] rounded-xl bg-[#1B2A26] text-white flex items-center justify-center gap-2 text-[11.5px] font-semibold disabled:opacity-60">
          <Download size={14} /> {mengunduh === "pdf" ? "Memproses…" : "Ekspor PDF"}
        </button>
        <button onClick={() => ekspor("png")} disabled={!!mengunduh} className="h-[44px] rounded-xl border border-[#DCE5E0] bg-white text-[#1B2A26] flex items-center justify-center gap-2 text-[11.5px] font-semibold disabled:opacity-60">
          <Download size={14} /> {mengunduh === "png" ? "Memproses…" : "Ekspor PNG"}
        </button>
      </div>
      {pesanGagal && <p className="text-[10px] leading-relaxed text-[#B5533C]">{pesanGagal}</p>}

      <div id="area-laporan-preview" className="rounded-2xl border border-[#E7E1D3] bg-white p-5 mt-4">
        <div className="flex items-center justify-between border-b-2 border-[#1B2A26] pb-3 mb-4">
          <div>
            <div className="font-serif text-[16px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>Buku Kas</div>
            <div className="text-[11px] text-[#8B8579]">Laporan · {judulPeriode}</div>
          </div>
          <div className="text-[10px] text-[#8B8579] text-right">Dicetak<br />{tanggalCetak}</div>
        </div>

        <table className="w-full text-[13px] mb-5">
          <tbody>
            {ringkasan.map(([label, nilai], i) => (
              <tr key={i} className={i < ringkasan.length - 1 ? "border-b border-[#F0EBDD]" : ""}>
                <td className="py-2 text-[#8B8579]">{label}</td>
                <td className="py-2 text-right font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{nilai}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-2">Rincian Data ({baris.length})</div>
        {baris.length === 0 ? (
          <p className="text-[13px] text-[#8B8579] text-center py-8">Tidak ada data sesuai filter yang dipilih.</p>
        ) : tipe === "aset" ? (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1B2A26]">
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Tanggal</th>
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Nama</th>
                <th className="py-1.5 text-right font-medium text-[#8B8579]">Nilai (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((a, i) => (
                <tr key={i} className="border-b border-[#F0EBDD] last:border-0">
                  <td className="py-1.5 text-[#8B8579]">{a.tanggal}</td>
                  <td className="py-1.5 text-[#1B2A26]">{a.nama}</td>
                  <td className="py-1.5 text-right text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{angkaBesar(a.nilai)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : tipe === "hutang" ? (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1B2A26]">
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Nama</th>
                <th className="py-1.5 text-right font-medium text-[#8B8579]">Sisa (Rp)</th>
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Status</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((h, i) => {
                const { sisa, status } = statusHutang(h);
                return (
                  <tr key={i} className="border-b border-[#F0EBDD] last:border-0">
                    <td className="py-1.5 text-[#1B2A26]">{h.nama}</td>
                    <td className="py-1.5 text-right text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{angkaBesar(sisa)}</td>
                    <td className="py-1.5 text-[#8B8579]">{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#1B2A26]">
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Tanggal</th>
                <th className="py-1.5 text-left font-medium text-[#8B8579]">Nama</th>
                <th className="py-1.5 text-right font-medium text-[#8B8579]">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((t, i) => (
                <tr key={i} className="border-b border-[#F0EBDD] last:border-0">
                  <td className="py-1.5 text-[#8B8579]">{t.tgl}</td>
                  <td className="py-1.5 text-[#1B2A26]">{t.nama}</td>
                  <td
                    className={`py-1.5 text-right ${t.jumlah > 0 ? "text-[#2F6F5E]" : "text-[#B5533C]"}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {angkaBesar(t.jumlah)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-[#8B8579] text-center mt-4 leading-relaxed">
        Laporan dibuat otomatis oleh Buku Kas sesuai filter yang dipilih.
      </p>
    </div>
  );
}

// ---------- LAYAR: LAINNYA ----------
const MENU_LAINNYA = [
  { id: "statistik", label: "Statistik", deskripsi: "Ringkasan pola pengeluaran & tren", icon: PieIcon },
  { id: "laporan", label: "Laporan", deskripsi: "Ekspor data ke PDF atau PNG", icon: FileText },
  { id: "backup-restore", label: "Backup & Restore", deskripsi: "Cadangkan atau pulihkan data aplikasi", icon: UploadCloud },
];

function HeaderSubHalaman({ judul, onBack }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E7E1D3] bg-white text-[#1B2A26]">
        <ArrowLeft size={15} />
      </button>
      <h2 className="font-serif text-[20px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>{judul}</h2>
    </div>
  );
}

async function buatBackupZip({ transaksi, hutang, aset, anggaran, targetMenabung, cicilan }) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const data = {
    versi: 3,
    dibuatPada: new Date().toISOString(),
    transaksi,
    hutang,
    aset,
    anggaran,
    targetMenabung,
    cicilan,
    snapshotAsetBulanan: bacaSnapshotAsetBulanan(),
  };
  zip.file("data.json", JSON.stringify(data, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });

  const d = new Date();
  const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const jam = `${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}`;
  const namaFile = `Backup_BukuKas_${tgl}_${jam}.zip`;

  await simpanBlob(blob, namaFile, "application/zip");
}

async function bacaBackupZip(file) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file("data.json");
  if (!entry) throw new Error("File backup tidak valid (data.json tidak ditemukan di dalam ZIP).");
  const teks = await entry.async("string");
  const data = JSON.parse(teks);
  if (!data || typeof data !== "object") throw new Error("Format data backup tidak valid.");
  if (Number(data.versi || 1) > 3) throw new Error("Versi backup lebih baru dari versi aplikasi ini.");
  for (const key of ["transaksi", "hutang", "aset"]) {
    if (!Array.isArray(data[key])) throw new Error(`Data ${key} pada backup tidak valid.`);
  }
  for (const key of ["anggaran", "targetMenabung", "cicilan"]) {
    if (data[key] != null && !Array.isArray(data[key])) throw new Error(`Data ${key} pada backup tidak valid.`);
  }
  for (const key of ["transaksi", "hutang", "aset", "anggaran", "targetMenabung", "cicilan"]) {
    if (
      Array.isArray(data[key]) &&
      data[key].some((item) => !item || typeof item !== "object" || Array.isArray(item))
    ) {
      throw new Error(`Isi data ${key} pada backup tidak valid.`);
    }
  }
  return data;
}

function BackupRestore({ transaksi, hutang, aset, anggaran, targetMenabung, cicilan, onRestore, onBack }) {
  const [memproses, setMemproses] = useState("");
  const [pesan, setPesan] = useState({ tipe: "", teks: "" });
  const fileRef = useRef(null);

  const jalankanBackup = async () => {
    if (memproses) return;
    setMemproses("backup");
    setPesan({ tipe: "", teks: "" });
    try {
      await buatBackupZip({ transaksi, hutang, aset, anggaran, targetMenabung, cicilan });
      setPesan({ tipe: "sukses", teks: "Backup berhasil dibuat dan diunduh." });
    } catch (e) {
      console.error("Gagal membuat backup:", e);
      setPesan({ tipe: "gagal", teks: "Gagal membuat backup. Coba lagi." });
    } finally {
      setMemproses("");
    }
  };

  const prosesRestore = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMemproses("restore");
    setPesan({ tipe: "", teks: "" });
    try {
      const data = await bacaBackupZip(file);
      onRestore(data);
      setPesan({ tipe: "sukses", teks: "Data berhasil dipulihkan dari cadangan." });
    } catch (err) {
      console.error("Gagal memulihkan data:", err);
      setPesan({ tipe: "gagal", teks: err.message || "Gagal memulihkan data. Pastikan file backup valid." });
    } finally {
      setMemproses("");
    }
  };

  return (
    <div className="px-6 pt-6 pb-4">
      <HeaderSubHalaman judul="Backup & Restore" onBack={onBack} />

      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-5 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EAF2EE] text-[#2F6F5E] shrink-0">
            <UploadCloud size={16} />
          </div>
          <div className="text-[14px] text-[#1B2A26] font-medium">Backup Data</div>
        </div>
        <p className="text-[12px] text-[#8B8579] mb-4">Simpan transaksi, aset, kewajiban, anggaran, target menabung, dan cicilan dalam satu file ZIP.</p>
        <button
          onClick={jalankanBackup}
          disabled={!!memproses}
          className="w-full bg-[#1B2A26] text-white py-3 rounded-xl text-[14px] font-medium disabled:opacity-60"
        >
          {memproses === "backup" ? "Memproses…" : "Backup Sekarang"}
        </button>
      </div>

      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EAF2EE] text-[#2F6F5E] shrink-0">
            <DownloadCloud size={16} />
          </div>
          <div className="text-[14px] text-[#1B2A26] font-medium">Restore Data</div>
        </div>
        <p className="text-[12px] text-[#8B8579] mb-4">Pulihkan data dari file cadangan ZIP. Data yang tersimpan saat ini akan digantikan isi file backup.</p>
        <input ref={fileRef} type="file" accept=".zip" onChange={prosesRestore} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!!memproses}
          className="w-full bg-white border border-[#E7E1D3] text-[#1B2A26] py-3 rounded-xl text-[14px] font-medium disabled:opacity-60"
        >
          {memproses === "restore" ? "Memproses…" : "Pilih File Backup (.zip)"}
        </button>
      </div>

      {pesan.teks && (
        <p className={`text-[12px] mt-4 ${pesan.tipe === "sukses" ? "text-[#2F6F5E]" : "text-[#B5533C]"}`}>{pesan.teks}</p>
      )}
    </div>
  );
}

function Lainnya({ transaksi, transaksiEfektif = transaksi, aset, hutang, anggaran, targetMenabung, cicilan, onRestore, kategoriStatistik, trenStatistik, totalPengeluaran, uiPreferensi, onUbahUiPreferensi, onHeaderHiddenChange }) {
  const [layar, setLayar] = useState("menu");

  useEffect(() => {
    onHeaderHiddenChange?.(layar !== "menu");
    return () => onHeaderHiddenChange?.(false);
  }, [layar, onHeaderHiddenChange]);

  if (layar === "statistik") {
    return (
      <div>
        <div className="px-6 pt-6">
          <HeaderSubHalaman judul="Statistik" onBack={() => setLayar("menu")} />
        </div>
        <div className="-mt-6">
          <Statistik kategori={kategoriStatistik} tren={trenStatistik} totalPengeluaran={totalPengeluaran} />
        </div>
      </div>
    );
  }
  if (layar === "laporan") {
    return <Laporan transaksi={transaksiEfektif} aset={aset} hutang={hutang} onBack={() => setLayar("menu")} />;
  }
  if (layar === "backup-restore") {
    return (
      <BackupRestore
        transaksi={transaksi}
        hutang={hutang}
        aset={aset}
        anggaran={anggaran}
        targetMenabung={targetMenabung}
        cicilan={cicilan}
        onRestore={onRestore}
        onBack={() => setLayar("menu")}
      />
    );
  }

  const fontAktif = OPSI_FONT_APLIKASI.find((item) => item.id === uiPreferensi?.font) || OPSI_FONT_APLIKASI[0];

  return (
    <div className="account-page px-4 pt-3 pb-24 overflow-y-auto h-full">
      <section className="account-settings-card rounded-2xl border border-[#DDE6E1] bg-white p-4 mb-3 shadow-sm" aria-labelledby="pengaturan-tampilan">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id="pengaturan-tampilan" className="text-[14px] font-semibold text-[#1B2A26]">Tampilan</h2>
            <p className="mt-1 text-[10.5px] leading-relaxed text-[#817D74]">Pilih font dan ukuran yang nyaman. Layout tetap menyesuaikan ukuran layar.</p>
          </div>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-[#EAF2EE] text-[#2F6F5E] grid place-items-center">
            <FileText size={16} strokeWidth={1.9} />
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#817D74]">Jenis font</div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pilih jenis font">
            {OPSI_FONT_APLIKASI.map((opsi) => {
              const aktif = opsi.id === fontAktif.id;
              return (
                <button
                  key={opsi.id}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => onUbahUiPreferensi?.({ font: opsi.id })}
                  className={`min-w-0 h-10 rounded-xl border px-2 text-[10.5px] font-medium transition-colors ${aktif ? "border-[#2F6F5E] bg-[#EAF2EE] text-[#245E4E]" : "border-[#E1E8E4] bg-[#FCFCFA] text-[#686F6B]"}`}
                  style={{ fontFamily: opsi.css }}
                >
                  <span className="block truncate">{opsi.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#817D74]">Ukuran font</div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Pilih ukuran font">
            {[['kecil','Kecil'],['normal','Normal'],['besar','Besar']].map(([id,label]) => {
              const aktif = id === (uiPreferensi?.ukuran || 'normal');
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => onUbahUiPreferensi?.({ ukuran: id })}
                  className={`h-10 rounded-xl border px-2 font-medium transition-colors ${aktif ? "border-[#2F6F5E] bg-[#EAF2EE] text-[#245E4E]" : "border-[#E1E8E4] bg-[#FCFCFA] text-[#686F6B]"}`}
                  style={{ fontSize: id === 'kecil' ? 10 : id === 'besar' ? 12.5 : 11.25 }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#DDE6E1] overflow-hidden bg-white shadow-sm">
        {MENU_LAINNYA.map(({ id, label, deskripsi, icon: Icon }, i) => (
          <button
            key={id}
            onClick={() => setLayar(id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${i !== MENU_LAINNYA.length - 1 ? "border-b border-[#F0EBDD]" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#EAF2EE] text-[#2F6F5E] shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <div className="text-[14px] text-[#1B2A26] font-medium">{label}</div>
                <div className="text-[11px] text-[#8B8579]">{deskripsi}</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#C9BFA8] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

const warnaBadgeStatus = (status) =>
  status === "Lunas"
    ? "text-[#2F6F5E] bg-[#EAF2EE]"
    : status === "Gagal Bayar"
    ? "text-[#B5533C] bg-[#F3E7E1]"
    : status === "Terlambat"
    ? "text-[#A3763F] bg-[#F5EEDD]"
    : "text-[#8B8579] bg-[#EFEBDD]"; // Aktif

// ---------- LAYAR: HUTANG & PIUTANG ----------
function KartuHutang({ item, onBayar, onEdit, onDelete }) {
  const { sisa, status } = statusHutang(item);
  const persen = item.jumlah > 0 ? Math.min(100, Math.round((item.terbayar / item.jumlah) * 100)) : 0;
  const warnaStatus = warnaBadgeStatus(status);
  const jenisLabel = item.jenis === "piutang" ? "Piutang" : "Hutang";
  const warnaJenis = item.jenis === "piutang" ? "text-[#2F6F5E]" : "text-[#B5533C]";

  return (
    <div className="rounded-2xl border border-[#E7E1D3] bg-white p-4 mb-3">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] uppercase tracking-wide font-semibold ${warnaJenis}`}>{jenisLabel}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${warnaStatus}`}>{status}</span>
          </div>
          <div className="text-[15px] text-[#1B2A26] font-medium truncate">{item.nama}</div>
          {item.jatuhTempo && <div className="text-[11px] text-[#8B8579] truncate">Jatuh tempo {item.jatuhTempo}</div>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="text-[#8B8579] p-1.5"><Pencil size={14} /></button>
          <button onClick={onDelete} className="text-[#C9BFA8] p-1.5"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="w-full h-1.5 bg-[#F0EBDD] rounded-full overflow-hidden mb-2">
        <div className="h-full bg-[#2F6F5E]" style={{ width: `${persen}%` }} />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap text-[12px] mb-3">
        <span className="text-[#8B8579]">Terbayar {rupiahBesar(item.terbayar)} / {rupiahBesar(item.jumlah)}</span>
        <span className="font-semibold text-[#1B2A26] shrink-0 inline-flex items-baseline gap-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Sisa <Nominal n={sisa} block={false} />
        </span>
      </div>

      {sisa > 0 && status !== "Terjadwal" && (
        <button
          onClick={onBayar}
          className="w-full py-2 rounded-xl text-[12px] font-medium bg-[#1B2A26] text-white"
        >
          {item.jenis === "piutang" ? "Terima Pembayaran" : "Bayar"}
        </button>
      )}
    </div>
  );
}

function FormHutang({ initial, presetJenis, jenisTetap, onClose, onSubmit, layout = "popup", akunSaldo = [] }) {
  const [jenis, setJenis] = useState(jenisTetap || initial?.jenis || presetJenis || "hutang");
  const [nama, setNama] = useState(initial?.nama || "");
  const [jumlah, setJumlah] = useState(initial ? String(initial.jumlah) : "");
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tanggal) : todayInput());
  const [jatuhTempo, setJatuhTempo] = useState(initial?.jatuhTempo ? tglKeInput(initial.jatuhTempo) : "");
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [alurDana, setAlurDana] = useState(initial?.alurDana || (jenis === "hutang" ? "diterima-sekarang" : "diberikan-sekarang"));
  const [akunId, setAkunId] = useState(initial?.akunId || ID_SALDO_TRANSAKSI);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initial) setAlurDana(jenis === "hutang" ? "diterima-sekarang" : "diberikan-sekarang");
  }, [jenis, initial]);

  const akunAktif = akunSaldo.find((a) => a.id === akunId) || akunSaldo[0] || { id: ID_SALDO_TRANSAKSI, nama: "Kas", saldo: 0 };
  const sudahAdaPembayaran = Number(initial?.terbayar || 0) > 0;

  const submit = () => {
    const nilai = Number(jumlah);
    const err = {};
    if (!nama.trim()) err.nama = "Nama wajib diisi.";
    if (!jumlah || nilai <= 0) err.jumlah = "Jumlah harus lebih besar dari 0.";
    if (initial && nilai < Number(initial.terbayar || 0)) err.jumlah = "Jumlah tidak boleh kurang dari yang sudah dibayar.";
    if (!tanggal) err.tanggal = "Tanggal wajib diisi.";
    if (jenis === "piutang" && alurDana === "diberikan-sekarang" && nilai > Number(akunAktif.saldo || 0)) {
      err.jumlah = "Saldo akun sumber tidak mencukupi.";
    }
    if (Object.keys(err).length) return setErrors(err);

    const tanggalFormat = formatTglDariInput(tanggal);
    onSubmit({
      id: initial?.id || buatId(),
      jenis,
      nama: nama.trim(),
      jumlah: nilai,
      terbayar: initial?.terbayar || 0,
      tanggal: tanggalFormat,
      jatuhTempo: jatuhTempo ? formatTglDariInput(jatuhTempo) : "",
      catatan: catatan.trim(),
      pembayaran: initial?.pembayaran || [],
      terjadwal: isTanggalTerjadwal(tanggalFormat) || initial?.terjadwal || false,
      alurDana,
      akunId,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const isHalaman = layout === "halaman";
  const opsiAlur = jenis === "hutang"
    ? [["diterima-sekarang", "Dana diterima sekarang"], ["catat-lama", "Catat hutang lama"]]
    : [["diberikan-sekarang", "Dana diberikan sekarang"], ["catat-lama", "Catat piutang lama"]];

  const isi = (
    <div className={isHalaman ? "app-form-stack" : ""}>
      {!isHalaman && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? "Edit Catatan" : "Tambah Hutang / Piutang"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>
      )}

      {!jenisTetap && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => setJenis("hutang")} className={`py-2.5 rounded-xl text-[13px] font-medium ${jenis === "hutang" ? "bg-[#B5533C] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}>Hutang</button>
          <button onClick={() => setJenis("piutang")} className={`py-2.5 rounded-xl text-[13px] font-medium ${jenis === "piutang" ? "bg-[#2F6F5E] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}>Piutang</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        {opsiAlur.map(([value, label]) => (
          <button key={value} disabled={sudahAdaPembayaran && value !== alurDana} onClick={() => setAlurDana(value)} className={`min-h-[42px] px-2 rounded-xl border text-[11px] leading-tight font-medium ${alurDana === value ? "border-[#2F6F5E] bg-[#EEF5F1] text-[#245E4E]" : "border-[#E7E1D3] bg-white text-[#8B8579]"} disabled:opacity-40`}>{label}</button>
        ))}
      </div>

      <section className={isHalaman ? "app-form-card app-form-stack" : ""}>
      <label className="app-form-label">{jenis === "hutang" ? "Pemberi Pinjaman" : "Peminjam"}</label>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pihak terkait" className={`app-form-control mb-1 ${errors.nama ? "!border-[#B5533C]" : ""}`} />
      {errors.nama && <p className="text-[10px] text-[#B5533C] mb-2">{errors.nama}</p>}

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="app-form-label">Jumlah</label>
          <InputNominal value={jumlah} onChange={setJumlah} className={`app-form-control ${errors.jumlah ? "!border-[#B5533C]" : ""}`} />
        </div>
        <div>
          <label className="app-form-label">Tanggal</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={`app-form-control ${errors.tanggal ? "!border-[#B5533C]" : ""}`} />
        </div>
      </div>
      {errors.jumlah && <p className="text-[10px] text-[#B5533C] mt-1">{errors.jumlah}</p>}

      {alurDana !== "catat-lama" && (
        <div className="mt-3">
          <label className="app-form-label">{jenis === "hutang" ? "Akun Penerima" : "Akun Sumber"}</label>
          <select value={akunId} onChange={(e) => setAkunId(e.target.value)} disabled={sudahAdaPembayaran} className="app-form-control disabled:opacity-50">
            {akunSaldo.map((a) => <option key={a.id} value={a.id}>{a.nama} — {rupiah(a.saldo)}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <label className="app-form-label">Jatuh Tempo</label>
          <input type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} className="app-form-control" />
        </div>
        <div>
          <label className="app-form-label">Catatan</label>
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional" className="app-form-control" />
        </div>
      </div>

      </section>
      <button onClick={submit} className={`app-form-action mt-1 ${jenis === "hutang" ? "app-form-primary--expense text-white" : "app-form-primary"}`}>{initial ? "Simpan Perubahan" : "Simpan"}</button>
    </div>
  );

  if (isHalaman) return isi;
  return <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}><div className="w-full max-w-sm bg-white rounded-t-3xl p-5 pb-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>{isi}</div></div>;
}

function FormBayar({ item, onClose, onSubmit, akunSaldo = [] }) {
  const { sisa } = statusHutang(item);
  const [jumlah, setJumlah] = useState(String(sisa));
  const [biaya, setBiaya] = useState("0");
  const [akunId, setAkunId] = useState(item.akunPembayaranTerakhir || ID_SALDO_TRANSAKSI);
  const [error, setError] = useState("");
  const akunAktif = akunSaldo.find((a) => a.id === akunId) || akunSaldo[0] || { saldo: 0 };

  const submit = () => {
    const pokok = Number(jumlah);
    const biayaTambahan = item.jenis === "hutang" ? Math.max(0, Number(biaya) || 0) : 0;
    if (!jumlah || pokok <= 0) return setError("Jumlah harus lebih besar dari 0.");
    if (pokok > sisa) return setError(`Jumlah tidak boleh melebihi sisa (${rupiah(sisa)}).`);
    if (item.jenis === "hutang" && pokok + biayaTambahan > Number(akunAktif.saldo || 0)) return setError("Saldo akun pembayaran tidak mencukupi.");
    onSubmit({ jumlah: pokok, biaya: biayaTambahan, akunId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>{item.jenis === "piutang" ? "Terima Piutang" : "Bayar Hutang"}</h3><p className="text-[10px] text-[#8B8579] mt-0.5">Sisa {rupiah(sisa)}</p></div>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>
        <label className="block text-[10px] uppercase tracking-wide text-[#8B8579] mb-1">{item.jenis === "piutang" ? "Akun Penerima" : "Akun Pembayaran"}</label>
        <select value={akunId} onChange={(e) => { setAkunId(e.target.value); setError(""); }} className="w-full h-11 bg-white border border-[#E7E1D3] rounded-xl px-3 text-[13px] mb-3 outline-none">
          {akunSaldo.map((a) => <option key={a.id} value={a.id}>{a.nama} — {rupiah(a.saldo)}</option>)}
        </select>
        <label className="block text-[10px] uppercase tracking-wide text-[#8B8579] mb-1">Pokok</label>
        <InputNominal value={jumlah} onChange={(v) => { setJumlah(v); setError(""); }} className={`w-full h-11 bg-white border rounded-xl px-3 text-[13px] outline-none ${error ? "border-[#B5533C]" : "border-[#E7E1D3]"}`} />
        {item.jenis === "hutang" && <><label className="block text-[10px] uppercase tracking-wide text-[#8B8579] mb-1 mt-3">Bunga / Denda / Biaya</label><InputNominal value={biaya} onChange={setBiaya} className="w-full h-11 bg-white border border-[#E7E1D3] rounded-xl px-3 text-[13px] outline-none" /></>}
        {error && <p className="text-[10px] text-[#B5533C] mt-2">{error}</p>}
        <button onClick={() => setJumlah(String(sisa))} className="text-[11px] text-[#2F6F5E] font-medium mt-3">Gunakan seluruh sisa</button>
        <button onClick={submit} className="w-full bg-[#1B2A26] text-white h-12 rounded-xl text-[13px] font-semibold mt-4">Konfirmasi</button>
      </div>
    </div>
  );
}

// Item pernah berstatus Terjadwal bila sedang Terjadwal sekarang, atau ditandai
// pernah dijadwalkan saat dibuat/diedit (lihat flag `terjadwal` di FormHutang)
const pernahDijadwalkan = (item) => item.terjadwal === true || statusHutang(item).status === "Terjadwal";

// Master urutan kategori Hutang & Piutang — hanya kategori yang punya data yang ditampilkan
const KATEGORI_HUTANG_MASTER = [
  ["Hutang", (h) => h.jenis === "hutang"],
  ["Piutang", (h) => h.jenis === "piutang"],
  ["Terjadwal", pernahDijadwalkan],
];

function HutangPiutang({ daftar, onTambah, onEdit, onHapus, onBayar, onHeaderHiddenChange, akunSaldo = [] }) {
  // "ringkasan" = daftar & filter hutang/piutang (tampilan biasa)
  // "tambah" = halaman penuh Tambah Hutang / Tambah Piutang (jenis ditentukan tambahJenis), konsisten dengan pola Tambah Aset
  // "edit" = halaman penuh Edit Hutang / Edit Piutang (data di editItem)
  const [mode, setMode] = useState("ringkasan");
  const [tambahJenis, setTambahJenis] = useState("hutang");
  const [q, setQ] = useState("");
  // Filter kategori: array label kategori terpilih (mis. ["Hutang","Terjadwal"]). Kosong = Semua Kategori.
  const [filterKategoriSet, setFilterKategoriSet] = useState([]);
  const [panelKategoriBuka, setPanelKategoriBuka] = useState(false);
  const [urutan, setUrutan] = useState("terbaru");
  const [panelUrutanBuka, setPanelUrutanBuka] = useState(false);
  const [rentangWaktu, setRentangWaktu] = useState("bulan");
  const [dariKustom, setDariKustom] = useState(todayInput());
  const [sampaiKustom, setSampaiKustom] = useState(todayInput());
  const [editItem, setEditItem] = useState(null);
  const [bayarItem, setBayarItem] = useState(null);

  // Saat mode "edit" aktif, header global (logo Buku Kas) disembunyikan karena
  // halaman Edit Hutang/Piutang punya header sendiri, konsisten dengan Edit Transaksi.
  useEffect(() => {
    onHeaderHiddenChange && onHeaderHiddenChange(["edit", "tambah", "beli", "jual"].includes(mode));
    return () => { onHeaderHiddenChange && onHeaderHiddenChange(false); };
  }, [mode, onHeaderHiddenChange]);

  // Data berstatus Terjadwal belum aktif, jadi belum dihitung ke total
  const aktif = daftar.filter((h) => statusHutang(h).status !== "Terjadwal");
  const totalHutang = aktif.filter((h) => h.jenis === "hutang").reduce((a, h) => a + statusHutang(h).sisa, 0);
  const totalPiutang = aktif.filter((h) => h.jenis === "piutang").reduce((a, h) => a + statusHutang(h).sisa, 0);

  // Kategori dinamis: hanya kategori yang benar-benar punya data, urutan mengikuti daftar master
  const kategoriHutangAda = useMemo(
    () => KATEGORI_HUTANG_MASTER.filter(([, cek]) => daftar.some(cek)).map(([label]) => label),
    [daftar]
  );

  const labelKategori =
    filterKategoriSet.length === 0
      ? "Semua Kategori"
      : filterKategoriSet.length === 1
      ? filterKategoriSet[0]
      : `${filterKategoriSet.length} Kategori Dipilih`;

  const labelUrutan =
    urutan === "terbaru" ? "Tanggal (Terbaru)"
    : urutan === "terlama" ? "Tanggal (Terlama)"
    : urutan === "terkecil" ? "Nominal (Terkecil)"
    : urutan === "terbesar" ? "Nominal (Terbesar)"
    : "Rentang Waktu";

  const filtered = useMemo(() => {
    let hasil = daftar;
    const kw = q.trim().toLowerCase();
    if (kw) {
      hasil = hasil.filter((h) => {
        const { status } = statusHutang(h);
        const jenisLabel = h.jenis === "piutang" ? "piutang" : "hutang";
        const kategoriLabel = pernahDijadwalkan(h) ? "terjadwal" : jenisLabel;
        const kolom = [
          h.nama,
          h.catatan,
          jenisLabel,
          kategoriLabel,
          status,
          String(h.jumlah),
          String(h.terbayar),
        ];
        return kolom.some((v) => v && String(v).toLowerCase().includes(kw));
      });
    }
    if (filterKategoriSet.length > 0) {
      const cekAktif = KATEGORI_HUTANG_MASTER.filter(([label]) => filterKategoriSet.includes(label)).map(([, cek]) => cek);
      hasil = hasil.filter((h) => cekAktif.some((cek) => cek(h)));
    }
    if (urutan === "rentang") {
      const { dari, sampai } = rentangTanggal(rentangWaktu, dariKustom, sampaiKustom);
      hasil = hasil.filter((h) => {
        const ts = parseTglID(h.tanggal);
        return ts >= dari && ts <= sampai;
      });
      hasil = [...hasil].sort((a, b) => parseTglID(b.tanggal) - parseTglID(a.tanggal));
      return hasil;
    }
    hasil = [...hasil].sort((a, b) => {
      if (urutan === "terbaru") return parseTglID(b.tanggal) - parseTglID(a.tanggal);
      if (urutan === "terlama") return parseTglID(a.tanggal) - parseTglID(b.tanggal);
      if (urutan === "terbesar") return b.jumlah - a.jumlah;
      return a.jumlah - b.jumlah;
    });
    return hasil;
  }, [daftar, q, filterKategoriSet, urutan, rentangWaktu, dariKustom, sampaiKustom]);

  return (
    <div className={`px-5 ${mode === "ringkasan" ? "pt-3 pb-4 data-page-shell" : mode === "tambah" || mode === "edit" ? "pt-3 pb-2 h-full min-h-0 overflow-hidden flex flex-col" : "pt-6 pb-4 standard-page"}`}>
      {mode === "tambah" && (
        <header className="app-form-header">
          <button type="button" onClick={() => setMode("ringkasan")} className="app-form-header__back justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
            <ArrowLeft size={22} strokeWidth={1.9} />
          </button>
          <div className="app-form-header__copy">
            <h2 className="app-form-header__title">{tambahJenis === "piutang" ? "Tambah Piutang" : "Tambah Hutang"}</h2>
            <p className="app-form-header__description">{tambahJenis === "piutang" ? "Catat dana yang menjadi hak tagih" : "Catat kewajiban dan alur dana pinjaman"}</p>
          </div>
          <div className={`app-form-header__icon justify-end ${tambahJenis === "piutang" ? "text-[#2F6F5E]" : "text-[#B5533C]"}`} aria-hidden="true">
            {tambahJenis === "piutang" ? <HandCoins size={22} strokeWidth={1.9} /> : <Wallet size={22} strokeWidth={1.9} />}
          </div>
        </header>
      )}

      {mode === "tambah" && (
        <FormHutang
          jenisTetap={tambahJenis}
          layout="halaman"
          onClose={() => setMode("ringkasan")}
          onSubmit={onTambah}
          akunSaldo={akunSaldo}
        />
      )}

      {mode === "edit" && editItem && (
        <header className="app-form-header">
          <button type="button" onClick={() => setMode("ringkasan")} className="app-form-header__back justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
            <ArrowLeft size={22} strokeWidth={1.9} />
          </button>
          <div className="app-form-header__copy">
            <h2 className="app-form-header__title">{editItem.jenis === "piutang" ? "Edit Piutang" : "Edit Hutang"}</h2>
            <p className="app-form-header__description">{editItem.jenis === "piutang" ? "Perbarui nilai dan informasi hak tagih" : "Perbarui kewajiban dan informasi pinjaman"}</p>
          </div>
          <div className={`app-form-header__icon justify-end ${editItem.jenis === "piutang" ? "text-[#2F6F5E]" : "text-[#B5533C]"}`} aria-hidden="true">
            {editItem.jenis === "piutang" ? <HandCoins size={22} strokeWidth={1.9} /> : <Wallet size={22} strokeWidth={1.9} />}
          </div>
        </header>
      )}

      {mode === "edit" && editItem && (
        <FormHutang
          initial={editItem}
          jenisTetap={editItem.jenis}
          layout="halaman"
          onClose={() => setMode("ringkasan")}
          onSubmit={(data) => { onEdit(data); setMode("ringkasan"); }}
          akunSaldo={akunSaldo}
        />
      )}

      {mode === "ringkasan" && (
      <>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-[#F3E7E1] p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#B5533C] font-medium mb-1">Sisa Hutang Saya</div>
          <div className="text-[16px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}><Nominal n={totalHutang} /></div>
        </div>
        <div className="rounded-2xl bg-[#EAF2EE] p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#2F6F5E] font-medium mb-1">Sisa Piutang Saya</div>
          <div className="text-[16px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}><Nominal n={totalPiutang} /></div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white border border-[#E7E1D3] rounded-[14px] px-3 py-2.5 mb-2.5 shadow-[0_3px_12px_rgba(27,42,38,0.03)]">
        <Search size={15} className="text-[#8B8579]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari hutang/piutang…"
          className="flex-1 text-[13px] text-[#1B2A26] bg-transparent outline-none placeholder:text-[#8B8579]"
        />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelUrutanBuka(false);
              setPanelKategoriBuka((v) => !v);
            }}
            className="w-full flex items-center justify-between gap-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] text-[#1B2A26]"
          >
            <span className="truncate">{labelKategori}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelKategoriBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelKategoriDropdownAset
            buka={panelKategoriBuka}
            filterSet={filterKategoriSet}
            kategoriAda={kategoriHutangAda}
            onSemua={() => {
              setFilterKategoriSet([]);
              setPanelKategoriBuka(false);
            }}
            onPilihTunggal={(key) => {
              setFilterKategoriSet([key]);
              setPanelKategoriBuka(false);
            }}
            onToggleKategori={(key) => {
              setFilterKategoriSet((prev) =>
                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
              );
            }}
            onClose={() => setPanelKategoriBuka(false)}
          />
        </div>
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelKategoriBuka(false);
              setPanelUrutanBuka((v) => !v);
            }}
            className="w-full flex items-center justify-between gap-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] text-[#1B2A26]"
          >
            <span className="truncate">{labelUrutan}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelUrutanBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelUrutanDropdown
            buka={panelUrutanBuka}
            urutan={urutan}
            onUbah={setUrutan}
            onClose={() => setPanelUrutanBuka(false)}
          />
        </div>
      </div>

      {urutan === "rentang" && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {RENTANG_OPSI.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRentangWaktu(v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${rentangWaktu === v ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {rentangWaktu === "kustom" && (
            <div className="flex gap-2">
              <input type="date" value={dariKustom} onChange={(e) => setDariKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
              <input type="date" value={sampaiKustom} onChange={(e) => setSampaiKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#8B8579] mb-3">{filtered.length} dari {daftar.length} catatan</p>

      <div className="data-scroll-region is-scrollable">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada catatan hutang/piutang.</p>
        ) : (
          filtered.map((item) => (
            <KartuHutang
              key={item.id}
              item={item}
              onBayar={() => setBayarItem(item)}
              onEdit={() => { setEditItem(item); setMode("edit"); }}
              onDelete={() => onHapus(item.id)}
            />
          ))
        )}
      </div>

      {bayarItem && (
        <FormBayar
          item={bayarItem}
          onClose={() => setBayarItem(null)}
          onSubmit={(dataBayar) => onBayar(bayarItem.id, dataBayar)}
          akunSaldo={akunSaldo}
        />
      )}
      </>
      )}

      {mode === "ringkasan" && (
        <FabMenu
          opsi={OPSI_FAB_HUTANG}
          onPilih={(jenis) => {
            setTambahJenis(jenis);
            setMode("tambah");
          }}
        />
      )}
    </div>
  );
}

// ---------- LAYAR: ASET ----------
function KartuAset({ item, onInfo }) {
  const Ikon = IKON_KATEGORI_ASET[item.kategori] || Wallet;
  const warna = WARNA_KATEGORI_ASET[item.kategori] || "#8B8579";
  return (
    <button
      onClick={onInfo}
      className="w-full flex items-center justify-between px-4 py-3 border-b border-[#F0EBDD] last:border-0 text-left active:bg-[#FAF8F2]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-[7_7_0%]">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
          <Ikon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] text-[#1B2A26] font-medium truncate">{item.nama}</div>
          <div className="text-[11px] text-[#8B8579] truncate">{item.kategori} · {item.tanggal}</div>
        </div>
      </div>
      <div className="flex items-center min-w-0 flex-[3_3_0%] justify-end">
        <div className="text-right min-w-0 flex-1 pr-1.5">
          <div className="text-[13px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}><Nominal n={item.nilai} className="text-right" /></div>
        </div>
        <ChevronRight size={16} className="text-[#8B8579] shrink-0" />
      </div>
    </button>
  );
}

function DetailAset({ item, onClose, onEdit, onBeli, onJual }) {
  const Ikon = IKON_KATEGORI_ASET[item.kategori] || Wallet;
  const warna = WARNA_KATEGORI_ASET[item.kategori] || "#8B8579";
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>Detail Aset</h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>

        <div className="rounded-xl border border-[#E7E1D3] bg-white divide-y divide-[#F0EBDD] mb-6">
          {/* urutan mengikuti form tambah/edit aset */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-[#8B8579]">Nama Aset</span>
            <span className="text-[13px] text-[#1B2A26] text-right">{item.nama}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-[#8B8579]">Kategori</span>
            <span className="text-[13px] text-[#1B2A26] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
                <Ikon size={11} />
              </span>
              {item.kategori}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-[#8B8579] shrink-0">Nilai Saat Ini</span>
            <Nominal n={item.nilai} className="text-[13px] text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }} block={false} />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-[#8B8579]">Tanggal Dibeli</span>
            <span className="text-[13px] text-[#1B2A26]">{item.tanggal}</span>
          </div>
          <div className="px-4 py-3">
            <span className="text-[12px] text-[#8B8579] block mb-1">Catatan</span>
            <span className={`text-[13px] ${item.catatan ? "text-[#1B2A26]" : "text-[#A9A296] italic"}`}>
              {item.catatan || "Tidak ada catatan"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={onBeli} className="h-11 rounded-xl border border-[#7EAC97] text-[#2F6F5E] text-[11px] font-semibold flex items-center justify-center gap-1"><ArrowDownLeft size={13}/> Beli</button>
          <button onClick={onJual} className="h-11 rounded-xl border border-[#D9A99D] text-[#B5533C] text-[11px] font-semibold flex items-center justify-center gap-1"><ArrowUpRight size={13}/> Jual</button>
          <button onClick={onEdit} className="h-11 rounded-xl bg-[#2F6F5E] text-white text-[11px] font-semibold flex items-center justify-center gap-1"><Pencil size={13}/> Edit</button>
        </div>
      </div>
    </div>
  );
}

function KartuAsetOtomatis({ nama, keterangan, badge, warnaBadge, nilai, ikon: Ikon, warna, goTo, tabTujuan, judulTujuan }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBDD] last:border-0">
      <div className="flex items-center gap-3 min-w-0 flex-[7_7_0%]">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
          <Ikon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] text-[#1B2A26] font-medium truncate">{nama}</div>
          <div className="text-[11px] text-[#8B8579] flex items-center gap-1.5">
            <span className="truncate min-w-0 flex-1">{keterangan}</span>
            {badge && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 truncate max-w-[110px] ${warnaBadge}`}>{badge}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center min-w-0 flex-[3_3_0%] justify-end">
        <div className="text-right min-w-0 flex-1 pr-1.5">
          <div className="text-[13px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}><Nominal n={nilai} className="text-right" /></div>
        </div>
        {goTo && (
          <button onClick={() => goTo(tabTujuan)} className="text-[#8B8579] p-1.5 shrink-0" title={`Kelola di menu ${judulTujuan}`}>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Kategori yang tersedia di form Tambah/Edit Aset — hanya kategori yang memang
// dikelola manual (Investasi, Kendaraan, Properti, Barang Berharga). Kas & Bank,
// E-Wallet, dan Tabungan sengaja tidak ada di sini karena sudah otomatis
// terkelola lewat menu Transaksi & Transfer. KATEGORI_ASET / KATEGORI_ASET_TAMPIL
// TIDAK diubah supaya Data Aset, filter, Laporan, dan Ringkasan tetap apa adanya.
const KATEGORI_ASET_INPUT = KATEGORI_PUNYA_JENIS;

// Dropdown "Jenis" dengan opsi "+ Tambah jenis…" selalu di posisi teratas, serta
// daftar buatan pengguna (bisa dihapus lewat ikon ✕) di bagian bawah.
function DropdownJenis({ kategori, value, onChange, custom, onTambahCustom, onHapusCustom, labelTambah, error }) {
  const [buka, setBuka] = useState(false);
  const [modeTambah, setModeTambah] = useState(false);
  const [inputBaru, setInputBaru] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    if (!buka) return;
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setBuka(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [buka]);

  const daftarDefault = JENIS_ASET_DEFAULT[kategori] || [];
  const daftarCustom = custom || [];

  const bukaTambah = () => {
    setModeTambah(true);
    setInputBaru("");
  };

  const simpanBaru = () => {
    const namaBaru = inputBaru.trim();
    if (!namaBaru) return;
    const sudahAda = [...daftarDefault, ...daftarCustom].some((j) => j.toLowerCase() === namaBaru.toLowerCase());
    if (!sudahAda) onTambahCustom(namaBaru);
    onChange(namaBaru);
    setModeTambah(false);
    setInputBaru("");
    setBuka(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-white border rounded-xl px-3 py-2.5 text-[14px] text-left outline-none focus:border-[#2F6F5E] ${error ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
      >
        <span className={`truncate ${value ? "text-[#1B2A26]" : "text-[#A9A296]"}`}>{value || "Pilih jenis…"}</span>
        <ChevronDown size={15} className="text-[#8B8579] shrink-0" />
      </button>

      {buka && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-[#E7E1D3] rounded-xl shadow-lg max-h-64 overflow-y-auto py-1">
          {!modeTambah && (
            <>
              <button type="button" onClick={bukaTambah} className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-[#2F6F5E]">
                + {labelTambah}
              </button>
              <div className="border-t border-[#F0EBDD] my-1" />
              {daftarDefault.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => { onChange(j); setBuka(false); }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] ${value === j ? "text-[#1B2A26] font-medium bg-[#FAF8F2]" : "text-[#1B2A26]"}`}
                >
                  {j}
                </button>
              ))}
              {daftarCustom.length > 0 && (
                <>
                  <div className="border-t border-[#F0EBDD] my-1" />
                  {daftarCustom.map((j) => (
                    <div key={j} className={`flex items-center gap-1 px-2 py-1 ${value === j ? "bg-[#FAF8F2]" : ""}`}>
                      <button
                        type="button"
                        onClick={() => onHapusCustom(j)}
                        title={`Hapus ${j}`}
                        className="w-6 h-6 flex items-center justify-center text-[#B5533C] shrink-0"
                      >
                        <X size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { onChange(j); setBuka(false); }}
                        className={`flex-1 min-w-0 text-left px-1.5 py-1 text-[13px] truncate ${value === j ? "text-[#1B2A26] font-medium" : "text-[#1B2A26]"}`}
                      >
                        {j}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {modeTambah && (
            <div className="px-3 py-2.5">
              <input
                autoFocus
                value={inputBaru}
                onChange={(e) => setInputBaru(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); simpanBaru(); }
                  if (e.key === "Escape") { e.preventDefault(); setModeTambah(false); }
                }}
                placeholder="Contoh: Excavator"
                className="w-full bg-white border border-[#E7E1D3] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#2F6F5E] mb-2"
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setModeTambah(false)} className="flex-1 py-2 rounded-lg border border-[#E7E1D3] text-[12px] text-[#8B8579]">
                  Batal
                </button>
                <button type="button" onClick={simpanBaru} className="flex-1 py-2 rounded-lg bg-[#1B2A26] text-white text-[12px] font-medium">
                  Simpan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormAset({ initial, onClose, onSubmit, layout = "popup" }) {
  const [nama, setNama] = useState(initial?.nama || "");
  const [kategori, setKategori] = useState(
    initial?.kategori && KATEGORI_ASET_INPUT.includes(initial.kategori) ? initial.kategori : KATEGORI_ASET_INPUT[0]
  );
  const [jenis, setJenis] = useState(initial?.jenis || "");
  const [jumlah, setJumlah] = useState(initial?.jumlah ? String(initial.jumlah) : "");
  const [beratGram, setBeratGram] = useState(initial?.beratGram ? String(initial.beratGram) : "");
  const [jenisCustom, setJenisCustom] = useState(() => muatJenisAsetCustom());
  const [nilai, setNilai] = useState(initial ? String(initial.nilai) : "");
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tanggal) : todayInput());
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [errors, setErrors] = useState({});
  // Mencegah tombol Simpan ditekan berkali-kali sehingga data tersimpan dobel
  const [menyimpan, setMenyimpan] = useState(false);

  const gantiKategori = (k) => {
    setKategori(k);
    setJenis("");
    setJumlah("");
    setBeratGram("");
  };

  const tambahJenisCustom = (nilaiBaru) => {
    setJenisCustom((prev) => {
      const next = { ...prev, [kategori]: [...(prev[kategori] || []), nilaiBaru] };
      simpanJenisAsetCustom(next);
      return next;
    });
  };
  const hapusJenisCustom = (nilaiHapus) => {
    setJenisCustom((prev) => {
      const next = { ...prev, [kategori]: (prev[kategori] || []).filter((j) => j !== nilaiHapus) };
      simpanJenisAsetCustom(next);
      return next;
    });
    if (jenis === nilaiHapus) setJenis("");
  };

  const butuhJumlah = kategori === "Kendaraan" || kategori === "Properti" || kategori === "Barang Berharga";
  const butuhBerat = kategori === "Barang Berharga" && jenis === "Emas";
  const labelJenis =
    kategori === "Investasi" ? "Jenis Investasi"
    : kategori === "Tabungan" ? "Jenis Tabungan"
    : kategori === "Kendaraan" ? "Jenis Kendaraan"
    : kategori === "Properti" ? "Jenis Properti"
    : "Jenis Barang";
  const labelTambahJenis =
    kategori === "Investasi" ? "Tambah jenis investasi…"
    : kategori === "Tabungan" ? "Tambah jenis tabungan…"
    : kategori === "Kendaraan" ? "Tambah jenis kendaraan…"
    : kategori === "Properti" ? "Tambah jenis properti…"
    : "Tambah jenis barang…";

  const submit = () => {
    if (menyimpan) return;
    const nilaiAngka = Number(nilai);
    const jumlahAngka = Number(jumlah);
    const beratAngka = Number(beratGram);
    const err = {};
    if (!nama.trim()) err.nama = "Nama aset wajib diisi.";
    if (!jenis) err.jenis = "Jenis wajib dipilih.";
    if (butuhJumlah && (!jumlah || jumlahAngka <= 0)) err.jumlah = "Jumlah harus lebih besar dari 0.";
    if (butuhBerat && (!beratGram || beratAngka <= 0)) err.beratGram = "Berat harus lebih besar dari 0.";
    if (!nilai || nilaiAngka <= 0) err.nilai = "Nilai harus lebih besar dari 0.";
    if (!tanggal) err.tanggal = "Tanggal dibeli wajib diisi.";
    if (Object.keys(err).length) return setErrors(err);

    setMenyimpan(true);
    const dataBaru = {
      id: initial?.id || buatId(),
      nama: nama.trim(),
      kategori,
      jenis,
      nilai: nilaiAngka,
      tanggal: formatTglDariInput(tanggal),
      catatan: catatan.trim(),
    };
    if (butuhJumlah) dataBaru.jumlah = jumlahAngka;
    if (butuhBerat) dataBaru.beratGram = beratAngka;
    onSubmit(dataBaru);
    onClose();
  };

  const isHalaman = layout === "halaman";

  const isi = (
    <div className={isHalaman ? "app-form-stack asset-form-stack flex-1 min-h-0" : ""}>
      {!isHalaman && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? "Edit Aset" : "Tambah Aset"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>
      )}

      <section className={isHalaman ? "app-form-card asset-form-card" : ""}>
        <div className="asset-form-grid">
          <div className="asset-form-field asset-form-field--full">
            <label className="app-form-label">Nama Aset</label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Tabungan BCA"
              className={`app-form-control ${errors.nama ? "!border-[#B5533C]" : ""}`}
            />
            {errors.nama && <p className="app-form-error">{errors.nama}</p>}
          </div>

          <div className="asset-form-field">
            <label className="app-form-label">Kategori</label>
            <select value={kategori} onChange={(e) => gantiKategori(e.target.value)} className="app-form-control">
              {KATEGORI_ASET_INPUT.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {!butuhJumlah && (
            <div className="asset-form-field">
              <label className="app-form-label">{labelJenis}</label>
              <DropdownJenis
                kategori={kategori}
                value={jenis}
                onChange={setJenis}
                custom={jenisCustom[kategori]}
                onTambahCustom={tambahJenisCustom}
                onHapusCustom={hapusJenisCustom}
                labelTambah={labelTambahJenis}
                error={errors.jenis}
              />
              {errors.jenis && <p className="app-form-error">{errors.jenis}</p>}
            </div>
          )}

          {butuhJumlah && (
            <>
              <div className="asset-form-field">
                <label className="app-form-label">Jumlah</label>
                <input
                  inputMode="numeric"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="1"
                  className={`app-form-control ${errors.jumlah ? "!border-[#B5533C]" : ""}`}
                />
                {errors.jumlah && <p className="app-form-error">{errors.jumlah}</p>}
              </div>
              <div className="asset-form-field">
                <label className="app-form-label">{labelJenis}</label>
                <DropdownJenis
                  kategori={kategori}
                  value={jenis}
                  onChange={setJenis}
                  custom={jenisCustom[kategori]}
                  onTambahCustom={tambahJenisCustom}
                  onHapusCustom={hapusJenisCustom}
                  labelTambah={labelTambahJenis}
                  error={errors.jenis}
                />
                {errors.jenis && <p className="app-form-error">{errors.jenis}</p>}
              </div>
            </>
          )}

          {butuhBerat && (
            <div className="asset-form-field asset-form-field--full">
              <label className="app-form-label">Total Berat (gram)</label>
              <input
                inputMode="decimal"
                value={beratGram}
                onChange={(e) => setBeratGram(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="25"
                className={`app-form-control ${errors.beratGram ? "!border-[#B5533C]" : ""}`}
              />
              {errors.beratGram && <p className="app-form-error">{errors.beratGram}</p>}
            </div>
          )}

          <div className="asset-form-field">
            <label className="app-form-label">Nilai Saat Ini</label>
            <InputNominal
              value={nilai}
              onChange={setNilai}
              className={`app-form-control ${errors.nilai ? "!border-[#B5533C]" : ""}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            {errors.nilai && <p className="app-form-error">{errors.nilai}</p>}
          </div>

          <div className="asset-form-field">
            <label className="app-form-label">Tanggal Dibeli</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={`app-form-control ${errors.tanggal ? "!border-[#B5533C]" : ""}`}
            />
            {errors.tanggal && <p className="app-form-error">{errors.tanggal}</p>}
          </div>

          <div className="asset-form-field asset-form-field--full">
            <label className="app-form-label">Catatan <span className="normal-case tracking-normal text-[#A39C90]">(opsional)</span></label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Detail tambahan"
              className="app-form-control asset-form-note"
            />
          </div>
        </div>
      </section>

      <button
        onClick={submit}
        disabled={menyimpan}
        className={`app-form-action app-form-primary asset-form-submit ${menyimpan ? "opacity-60" : ""}`}
      >
        {menyimpan ? "Menyimpan…" : initial ? "Simpan Perubahan" : "Simpan Aset"}
      </button>
    </div>
  );

  if (isHalaman) return isi;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {isi}
      </div>
    </div>
  );
}

function Aset({ daftar, hutang, saldo, saldoBank, saldoEwallet, jumlahTransaksi, totalHutangSisa, hutangTersedia, onTambah, onEdit, onHapus, onTransfer, goTo, onHeaderHiddenChange }) {
  const [q, setQ] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  // "ringkasan" = kondisi aset, "data" = daftar & pengelolaan aset, "tambah" = halaman
  // penuh Tambah Aset, "edit" = halaman penuh Edit Aset, "beli"/"jual" = mutasi nilai aset
  const [mode, setMode] = useState("ringkasan");

  // Saat mode "edit" aktif, header global (logo Buku Kas) disembunyikan karena
  // halaman Edit Aset punya header sendiri, konsisten dengan Edit Transaksi.
  useEffect(() => {
    onHeaderHiddenChange && onHeaderHiddenChange(mode === "tambah" || mode === "edit");
    return () => { onHeaderHiddenChange && onHeaderHiddenChange(false); };
  }, [mode, onHeaderHiddenChange]);

  // Filter & sort halaman Data Aset (konsisten dengan halaman Transaksi)
  const [filterKategoriSet, setFilterKategoriSet] = useState([]);
  const [panelKategoriBuka, setPanelKategoriBuka] = useState(false);
  const [urutan, setUrutan] = useState("terbaru");
  const [panelUrutanBuka, setPanelUrutanBuka] = useState(false);
  const [rentangWaktu, setRentangWaktu] = useState("bulan");
  const [dariKustom, setDariKustom] = useState(todayInput());
  const [sampaiKustom, setSampaiKustom] = useState(todayInput());

  // Piutang berstatus Terjadwal belum aktif -> belum masuk aset & net worth
  const piutangAset = useMemo(
    () => hutang.filter((h) => {
      if (h.jenis !== "piutang") return false;
      const status = statusHutang(h).status;
      return status !== "Terjadwal" && status !== "Lunas" && status !== "Hangus";
    }),
    [hutang]
  );
  const totalPiutangSisa = piutangAset.reduce((a, h) => a + statusHutang(h).sisa, 0);
  // Aset manual memakai nilai saat ini bila tersedia; jika belum, gunakan nilai awal.
  // Ini mempersiapkan fitur apresiasi/depresiasi tanpa mengubah data lama.
  const totalAsetManual = daftar.reduce(
    (a, i) => a + Number(i.nilaiSaatIni ?? i.nilai ?? 0),
    0
  );
  const totalSaldoTransaksi = Number(saldo || 0) + Number(saldoBank || 0) + Number(saldoEwallet || 0);
  const totalAset = totalSaldoTransaksi + totalAsetManual + totalPiutangSisa;

  // Tren "vs bulan lalu" pada 3 kartu ringkasan: dicatat sebagai snapshot bulanan asli
  // (bukan angka rekaan). Snapshot bulan berjalan terus diperbarui setiap totalnya
  // berubah, sehingga saat bulan berganti, angka bulan sebelumnya sudah "terkunci"
  // sebagai pembanding. Kalau belum ada snapshot bulan lalu (mis. baru pertama kali
  // pakai aplikasi), tren tidak dipaksakan — pemanggil menampilkan fallback.
  const hariIniAset = useHariIni();
  const bulanIni = hariIniAset.slice(0, 7); // "YYYY-MM"
  useEffect(() => {
    const semua = bacaSnapshotAsetBulanan();
    semua[bulanIni] = { totalAset, totalHutang: totalHutangSisa, kekayaanBersih: totalAset - totalHutangSisa };
    simpanSnapshotAsetBulanan(semua);
  }, [bulanIni, totalAset, totalHutangSisa]);

  const trenAset = useMemo(() => {
    const [y, m] = bulanIni.split("-").map(Number);
    const bulanLaluDate = new Date(y, m - 2, 1);
    const kunciBulanLalu = `${bulanLaluDate.getFullYear()}-${String(bulanLaluDate.getMonth() + 1).padStart(2, "0")}`;
    const data = bacaSnapshotAsetBulanan()[kunciBulanLalu];
    if (!data) return null;
    return {
      totalAset: persenPerubahan(totalAset, data.totalAset),
      totalHutang: persenPerubahan(totalHutangSisa, data.totalHutang),
      kekayaanBersih: persenPerubahan(totalAset - totalHutangSisa, data.kekayaanBersih),
    };
  }, [bulanIni, totalAset, totalHutangSisa]);

  // Sama persis dengan formatPersen/TrenBadge di Beranda (varian "terang" untuk teks di atas
  // kartu gradasi gelap), ditambah indikatorNaikBaik karena naiknya Hutang justru buruk.
  const formatPersenAset = (p) => {
    if (p == null) return null;
    const bulat = Math.round(p * 100) / 100;
    const [b, d] = Math.abs(bulat).toFixed(2).split(".");
    const dRingkas = d.replace(/0+$/, "");
    return `${bulat >= 0 ? "+" : "-"}${dRingkas ? `${b},${dRingkas}` : b}%`;
  };

  const TrenBadgeAset = ({ p, indikatorNaikBaik = true }) => {
    if (p == null) return null;
    const netral = Math.abs(p) < 0.005;
    const naik = p > 0;
    const bagus = netral || (indikatorNaikBaik ? naik : !naik);
    const warna = netral ? "text-white/60" : bagus ? "text-[#8FD6B4]" : "text-[#F0B7A4]";
    const IkonTren = netral ? Minus : naik ? ArrowUpRight : TrendingDown;
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${warna}`}>
        <IkonTren size={12} strokeWidth={2.4} />
        <span>{formatPersenAset(p)}</span>
      </span>
    );
  };

  const totalPerKategori = useMemo(() => {
    const map = {};
    KATEGORI_ASET_TAMPIL.forEach((k) => (map[k] = 0));
    daftar.forEach((i) => {
      const nilaiAktif = Number(i.nilaiSaatIni ?? i.nilai ?? 0);
      map[i.kategori] = (map[i.kategori] || 0) + nilaiAktif;
    });
    // Kas & Bank = akumulasi aset manual (mis. rekening lama) + saldo Kas & Bank yang
    // dihitung otomatis dari transaksi. E-Wallet demikian juga.
    map["Kas & Bank"] = (map["Kas & Bank"] || 0) + saldo + saldoBank;
    map["E-Wallet"] = (map["E-Wallet"] || 0) + saldoEwallet;
    map["Piutang"] = totalPiutangSisa;
    return map;
  }, [daftar, totalPiutangSisa, saldo, saldoBank, saldoEwallet]);

  // Nilai per kartu Ringkasan Aset — dihitung terpisah dari totalPerKategori
  // (yang tetap mengikuti struktur KATEGORI_ASET_TAMPIL apa adanya untuk Data
  // Aset & filter). Saldo Total = akumulasi Kas & Bank + E-Wallet, walau kartu
  // E-Wallet sudah tidak tampil terpisah di Ringkasan.
  const nilaiRingkasanAset = useMemo(() => ({
    "saldo-total": (totalPerKategori["Kas & Bank"] || 0) + (totalPerKategori["E-Wallet"] || 0),
    tabungan: totalPerKategori["Tabungan"] || 0,
    investasi: totalPerKategori["Investasi"] || 0,
    piutang: totalPerKategori["Piutang"] || 0,
    kendaraan: totalPerKategori["Kendaraan"] || 0,
    properti: totalPerKategori["Properti"] || 0,
    "barang-berharga": totalPerKategori["Barang Berharga"] || 0,
  }), [totalPerKategori]);

  // Gabungkan aset manual + piutang (live, DIAKUMULASI jadi satu baris — Data Aset
  // menampilkan total per kategori, bukan rincian per debitur) + saldo transaksi (live)
  const gabungan = useMemo(() => {
    const tglHariIni = formatTglDariInput(todayInput());
    const dariAset = daftar.map((a) => ({ tipe: "aset", asli: a, nama: a.nama, kategori: a.kategori, tanggal: a.tanggal, nilai: a.nilai }));
    const dariOtomatis = [];
    if (jumlahTransaksi > 0) {
      dariOtomatis.push({ tipe: "saldo", nama: "Saldo Transaksi", kategori: "Kas & Bank", tanggal: tglHariIni, nilai: saldo + saldoBank });
      dariOtomatis.push({ tipe: "saldo", nama: "Saldo Transaksi", kategori: "E-Wallet", tanggal: tglHariIni, nilai: saldoEwallet });
    }
    if (piutangAset.length > 0) {
      dariOtomatis.push({ tipe: "saldo", nama: "Piutang", kategori: "Piutang", tanggal: tglHariIni, nilai: totalPiutangSisa });
    }
    return [...dariAset, ...dariOtomatis];
  }, [daftar, piutangAset, totalPiutangSisa, jumlahTransaksi, saldo, saldoBank, saldoEwallet]);

  // Kategori dinamis: hanya kategori yang benar-benar punya data aset, urutan mengikuti daftar master
  const kategoriAsetAda = useMemo(
    () => KATEGORI_ASET_TAMPIL.filter((k) => gabungan.some((i) => i.kategori === k)),
    [gabungan]
  );

  const labelKategoriAset =
    filterKategoriSet.length === 0
      ? "Semua Kategori"
      : filterKategoriSet.length === 1
      ? filterKategoriSet[0]
      : `${filterKategoriSet.length} Kategori Dipilih`;

  const labelUrutanAset =
    urutan === "terbaru" ? "Tanggal (Terbaru)"
    : urutan === "terlama" ? "Tanggal (Terlama)"
    : urutan === "terkecil" ? "Nominal (Terkecil)"
    : urutan === "terbesar" ? "Nominal (Terbesar)"
    : urutan === "az" ? "Nama (A-Z)"
    : urutan === "za" ? "Nama (Z-A)"
    : "Rentang Waktu";

  const filtered = useMemo(() => {
    let hasil = gabungan.filter((i) => i.nama.toLowerCase().includes(q.toLowerCase()));
    if (filterKategoriSet.length > 0) {
      hasil = hasil.filter((i) => filterKategoriSet.includes(i.kategori));
    }
    if (urutan === "rentang") {
      const { dari, sampai } = rentangTanggal(rentangWaktu, dariKustom, sampaiKustom);
      hasil = hasil.filter((i) => {
        const ts = parseTglID(i.tanggal);
        return ts >= dari && ts <= sampai;
      });
      hasil = [...hasil].sort((a, b) => parseTglID(b.tanggal) - parseTglID(a.tanggal));
      return hasil;
    }
    hasil = [...hasil].sort((a, b) => {
      if (urutan === "terbaru") return parseTglID(b.tanggal) - parseTglID(a.tanggal);
      if (urutan === "terlama") return parseTglID(a.tanggal) - parseTglID(b.tanggal);
      if (urutan === "terbesar") return Math.abs(b.nilai) - Math.abs(a.nilai);
      if (urutan === "terkecil") return Math.abs(a.nilai) - Math.abs(b.nilai);
      if (urutan === "az") return a.nama.localeCompare(b.nama, "id");
      if (urutan === "za") return b.nama.localeCompare(a.nama, "id");
      return 0;
    });
    return hasil;
  }, [gabungan, q, filterKategoriSet, urutan, rentangWaktu, dariKustom, sampaiKustom]);

  // Formatter lokal untuk ringkasan hero Aset. Didefinisikan di dalam
  // komponen Aset agar tidak bergantung pada helper privat milik Beranda.
  const formatNominalRingkasAset = (nilai, paksaNegatif = false) => {
    const angka = Number(nilai) || 0;
    const negatif = paksaNegatif || angka < 0;
    const absolut = Math.abs(angka);

    // Nilai di bawah Rp1 miliar tetap ditampilkan penuh agar informatif.
    // Mulai Rp1 miliar gunakan satuan ringkas M/T agar tidak melewati area.
    const satuan = absolut >= 1e12
      ? { pembagi: 1e12, label: "T" }
      : absolut >= 1e9
      ? { pembagi: 1e9, label: "M" }
      : null;

    const angkaRingkas = satuan
      ? formatDesimalAdaptif(absolut / satuan.pembagi)
      : absolut.toLocaleString("id-ID");

    return {
      negatif,
      angka: angkaRingkas,
      satuan: satuan?.label || "",
      teks: `${negatif ? "- " : ""}Rp ${angkaRingkas}${satuan ? ` ${satuan.label}` : ""}`,
    };
  };

  // Rumus utama:
  // Kekayaan Bersih = Total Aset - seluruh kewajiban aktif (hutang + cicilan).
  const kekayaanBersih = totalAset - totalHutangSisa;
  const rasioHutangAset = totalAset > 0 ? (totalHutangSisa / totalAset) * 100 : 0;
  const totalPiutangBermasalah = hutang
    .filter((h) => h.jenis === "piutang" && ["Terlambat", "Gagal Bayar"].includes(statusHutang(h).status))
    .reduce((a, h) => a + statusHutang(h).sisa, 0);
  const rasioPiutangBermasalah = totalAset > 0 ? (totalPiutangBermasalah / totalAset) * 100 : 0;
  const kondisiAset =
    totalAset <= 0 && totalHutangSisa <= 0
      ? { label: "Belum ada data", sub: "Tambahkan aset pertama", warna: "#8B8579", bg: "#F3F0E8", ikon: Sprout }
      : kekayaanBersih < 0
      ? { label: "Minus", sub: "Kewajiban melebihi total aset", warna: "#B5533C", bg: "#F8ECE8", ikon: Info }
      : rasioHutangAset >= 50 || rasioPiutangBermasalah >= 20
      ? { label: "Waspada", sub: rasioHutangAset >= 50 ? "Rasio kewajiban cukup tinggi" : "Piutang bermasalah perlu ditinjau", warna: "#9A6A2F", bg: "#F8F1E4", ikon: ShieldCheck }
      : { label: "Sehat", sub: "Kekayaan bersih tetap positif", warna: "#2F6F5E", bg: "#EAF2EE", ikon: ShieldCheck };
  const KondisiIkon = kondisiAset.ikon;
  // Susunan kategori mengikuti dua kolom tetap:
  // kiri = aset nonfisik, kanan = aset fisik. Piutang selalu menjadi kartu penuh terakhir.
  const kategoriRingkasan = [
    RINGKASAN_ASET_FINANSIAL[0], RINGKASAN_ASET_FISIK[0],
    RINGKASAN_ASET_FINANSIAL[1], RINGKASAN_ASET_FISIK[1],
    RINGKASAN_ASET_FINANSIAL[2], RINGKASAN_ASET_FISIK[2],
    RINGKASAN_ASET_FINANSIAL[3],
  ];

  return (
    <div className={mode === "ringkasan"
      ? "dashboard-page asset-dashboard-page"
      : mode === "data"
      ? "px-6 pt-4 pb-24 overflow-y-auto min-h-0"
      : "px-5 pt-3 pb-2 h-full min-h-0 overflow-hidden flex flex-col"}>
      {mode === "tambah" && (
        <header className="app-form-header">
          <button type="button" onClick={() => setMode("ringkasan")} className="app-form-header__back justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
            <ArrowLeft size={22} strokeWidth={1.9} />
          </button>
          <div className="app-form-header__copy">
            <h2 className="app-form-header__title">Tambah Aset</h2>
            <p className="app-form-header__description">Catat kepemilikan dan nilai aset</p>
          </div>
          <div className="app-form-header__icon justify-end text-[#2F6F5E]" aria-hidden="true">
            <Layers size={22} strokeWidth={1.9} />
          </div>
        </header>
      )}

      {mode === "data" && (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setMode("ringkasan")} className="w-9 h-9 -ml-1 flex items-center justify-center text-[#1B2A26]" aria-label="Kembali ke ringkasan aset">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[20px] leading-tight text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>Semua Aset</h2>
            <p className="text-[10px] text-[#8B8579] mt-0.5">Cari, filter, dan lihat seluruh aset</p>
          </div>
        </div>
      )}

      {mode === "tambah" && (
        <FormAset
          layout="halaman"
          onClose={() => setMode("ringkasan")}
          onSubmit={onTambah}
        />
      )}

      {mode === "edit" && editItem && (
        <header className="app-form-header">
          <button type="button" onClick={() => setMode("ringkasan")} className="app-form-header__back justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
            <ArrowLeft size={22} strokeWidth={1.9} />
          </button>
          <div className="app-form-header__copy">
            <h2 className="app-form-header__title">Edit Aset</h2>
            <p className="app-form-header__description">Perbarui informasi dan nilai aset</p>
          </div>
          <div className="app-form-header__icon justify-end text-[#2F6F5E]" aria-hidden="true">
            <Layers size={22} strokeWidth={1.9} />
          </div>
        </header>
      )}

      {mode === "edit" && editItem && (
        <FormAset
          initial={editItem}
          layout="halaman"
          onClose={() => setMode("ringkasan")}
          onSubmit={(data) => { onEdit(data); setMode("ringkasan"); }}
        />
      )}

      {(mode === "beli" || mode === "jual") && (
        <FormTransfer
          aset={daftar}
          saldo={saldo}
          saldoBank={saldoBank}
          saldoEwallet={saldoEwallet}
          jenisOperasi={mode}
          asetAwal={editItem}
          onClose={() => { setEditItem(null); setMode("ringkasan"); }}
          onSubmit={onTransfer}
        />
      )}

      {mode === "ringkasan" && (
      <>
      {/* Hero aset — memakai proporsi dan ritme visual yang sama dengan hero Beranda */}
      <section className="dashboard-balance dashboard-balance--asset" aria-label="Ringkasan kekayaan bersih">
        <div
          aria-label={`Kondisi aset: ${kondisiAset.label}`}
          title={kondisiAset.sub}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            zIndex: 5,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            maxWidth: 108,
            padding: "5px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.26)",
            background: `color-mix(in srgb, ${kondisiAset.warna} 84%, transparent)`,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            color: "#FFFFFF",
            boxShadow: "0 6px 16px rgba(17,83,62,0.22)",
            fontSize: 9.25,
            lineHeight: 1,
            fontWeight: 650,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <KondisiIkon size={12} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{kondisiAset.label}</span>
        </div>

        <div className="dashboard-balance__label">
          <span>Kekayaan Bersih</span>
          <Eye size={18} strokeWidth={2} />
        </div>
        <div className="dashboard-balance__value">
          <Nominal n={kekayaanBersih} className="text-white" />
        </div>
        <div className="dashboard-balance__trend" aria-live="polite">
          {trenAset?.kekayaanBersih != null ? (
            <>
              {Math.abs(trenAset.kekayaanBersih) < 0.005 ? (
                <Minus size={15} strokeWidth={2.4} />
              ) : trenAset.kekayaanBersih > 0 ? (
                <ArrowUpRight size={15} strokeWidth={2.4} />
              ) : (
                <TrendingDown size={15} strokeWidth={2.4} />
              )}
              <strong>{formatPersenAset(trenAset.kekayaanBersih)}</strong>
              <span>dari bulan lalu</span>
            </>
          ) : null}
        </div>

        <div
          className="dashboard-balance__stats asset-balance__stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            width: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
            background: "rgba(4,74,56,0.24)",
            backdropFilter: "blur(7px)",
            WebkitBackdropFilter: "blur(7px)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {[
            {
              label: "Total Aset",
              nilai: totalAset,
              tren: trenAset?.totalAset,
              icon: Wallet,
              iconColor: "#C5F2DB",
              indikatorNaikBaik: true,
            },
            {
              label: "Total Kewajiban",
              nilai: totalHutangSisa,
              tren: trenAset?.totalHutang,
              icon: HandCoins,
              iconColor: "#FFD0C5",
              indikatorNaikBaik: false,
            },
          ].map((item, index) => {
            const RingIcon = item.icon;
            const nominal = formatNominalRingkasAset(item.nilai, item.label === "Total Kewajiban");
            return (
              <div
                key={item.label}
                className="asset-balance-stat min-w-0"
                style={{
                  borderRight: index === 0 ? "1px solid rgba(255,255,255,0.13)" : "none",
                  background: "rgba(255,255,255,0.055)",
                  display: "grid",
                  gridTemplateRows: "24px 33px 16px",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-white/10">
                    <RingIcon size={14} strokeWidth={2} style={{ color: item.iconColor }} />
                  </span>
                  <span className="truncate text-[10px] font-semibold text-white/80">{item.label}</span>
                </div>

                <div
                  className="flex min-w-0 items-baseline justify-center gap-1 overflow-hidden whitespace-nowrap text-center"
                  title={nominal.teks}
                >
                  <span
                    className="shrink-0 text-[11px] font-semibold"
                    style={{ color: item.label === "Total Kewajiban" ? "#FFB5A6" : "rgba(255,255,255,0.8)" }}
                  >
                    {nominal.negatif ? "- Rp" : "Rp"}
                  </span>
                  <span
                    className="min-w-0 overflow-hidden text-ellipsis text-[clamp(23px,6.2vw,31px)] font-extrabold leading-none"
                    style={{ color: item.label === "Total Kewajiban" ? "#FF8F78" : "#FFFFFF" }}
                  >
                    {nominal.angka}
                  </span>
                  {nominal.satuan && (
                    <span
                      className="shrink-0 text-[12px] font-bold"
                      style={{ color: item.label === "Total Kewajiban" ? "#FFB5A6" : "rgba(255,255,255,0.85)" }}
                    >
                      {nominal.satuan}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 items-center justify-center overflow-hidden" aria-live="polite">
                  {item.tren != null ? (
                    <TrenBadgeAset p={item.tren} indikatorNaikBaik={item.indikatorNaikBaik} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="asset-category-section overflow-hidden rounded-[22px] border border-[#E2E8E4] bg-white shadow-[0_8px_24px_rgba(22,55,45,0.045)]">
        <div className="flex items-center justify-between border-b border-[#EDF1EE] px-4 py-3">
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold leading-tight text-[#1B2A26]">Kategori Aset</h3>
            <p className="mt-0.5 text-[9.5px] leading-tight text-[#7B847F]">Ringkasan berdasarkan bentuk kepemilikan</p>
          </div>
          <button
            type="button"
            onClick={() => setMode("data")}
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-[#2F6F5E] active:bg-[#EEF5F1]"
          >
            Lihat Semua
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="grid grid-cols-2 border-b border-[#EDF1EE] bg-[#FAFCFB] px-3.5 py-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#728079]">Nonfisik</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#728079]">Fisik</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-3">
          {kategoriRingkasan.map((k) => {
            const Ikon = k.ikon;
            const nilai = nilaiRingkasanAset[k.key] || 0;
            const nominal = formatNominalRingkasAset(nilai);
            const porsi = totalAset > 0 ? Math.max(0, Math.min(100, (nilai / totalAset) * 100)) : 0;
            const penuh = k.key === "piutang";
            const infoRingkas = nilai > 0
              ? `${formatDesimalAdaptif(porsi)}% dari total aset`
              : "Belum ada nilai";

            return (
              <button
                key={k.key}
                type="button"
                onClick={() => { setFilterKategoriSet(k.filterKategori); setMode("data"); }}
                className={`${penuh ? "col-span-2 asset-category-card--wide" : ""} asset-category-card group relative min-w-0 overflow-hidden rounded-[17px] border border-[#E5EAE7] bg-[#FCFDFC] text-left transition active:scale-[0.99] active:bg-[#F7FAF8]`}
              >
                <div className={`${penuh ? "asset-category-card__inner--wide grid grid-cols-[40px_minmax(0,1fr)_auto_16px] items-center" : "asset-category-card__inner flex flex-col"} min-w-0 gap-2.5 p-3`}>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                    style={{ backgroundColor: `${k.warna}12`, color: k.warna }}
                  >
                    <Ikon size={19} strokeWidth={1.9} />
                  </span>

                  <div className={`${penuh ? "min-w-0" : "min-w-0 w-full"}`}>
                    <p className="truncate text-[11.5px] font-bold leading-tight text-[#1B2A26]">{k.label}</p>
                    <p className="mt-1 truncate text-[9px] leading-tight text-[#737C77]" title={k.sub}>{k.sub}</p>
                  </div>

                  <div className={`${penuh ? "min-w-0 text-right" : "mt-auto w-full min-w-0 pt-2 text-center"}`}>
                    <div
                      className={`flex min-w-0 items-baseline gap-1 overflow-hidden whitespace-nowrap ${penuh ? "justify-end" : "justify-center"}`}
                      title={nominal.teks}
                    >
                      <span className="shrink-0 text-[9px] font-semibold" style={{ color: k.warna }}>
                        {nominal.negatif ? "- Rp" : "Rp"}
                      </span>
                      <span
                        className="min-w-0 overflow-hidden text-ellipsis text-[clamp(16px,4.25vw,21px)] font-extrabold leading-none"
                        style={{ color: k.warna, fontVariantNumeric: "tabular-nums" }}
                      >
                        {nominal.angka}
                      </span>
                      {nominal.satuan && (
                        <span className="shrink-0 text-[9px] font-bold" style={{ color: k.warna }}>{nominal.satuan}</span>
                      )}
                    </div>
                    <p className={`mt-1.5 truncate text-[8.5px] font-medium text-[#87908B] ${penuh ? "text-right" : "text-center"}`}>
                      {infoRingkas}
                    </p>
                  </div>

                  <ChevronRight size={15} className={`${penuh ? "" : "absolute right-3 top-3"} shrink-0 text-[#9AA29E]`} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {totalAset <= 0 && (
        <div className="rounded-[20px] border border-dashed border-[#CFC5B2] bg-white/70 p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-[#EAF2EE] text-[#2F6F5E] flex items-center justify-center shrink-0"><Sprout size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#1B2A26]">Mulai bangun asetmu</p>
            <p className="text-[10px] text-[#8B8579] mt-0.5">Gunakan tombol tambah untuk mencatat aset pertama.</p>
          </div>
        </div>
      )}

      {/* Motto Stoic versi Aset */}
      <section className="asset-motto rounded-lg border border-[#DDE8E2] bg-[#F1F6F3] px-4 py-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden">
        <Quote size={20} className="text-[#78B39B]" />
        <p className="text-center text-[10.5px] leading-relaxed font-medium text-[#42514B]">
          Uang tidak pernah hilang, hanya berpindah tempat atau berubah nilai.
        </p>
        <Sprout size={24} className="text-[#2F6F5E]" />
      </section>
      </>
      )}

      {mode === "data" && (
      <>
      <div className="flex items-center gap-2 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 mb-3">
        <Search size={15} className="text-[#8B8579]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari aset…"
          className="flex-1 text-[13px] text-[#1B2A26] bg-transparent outline-none placeholder:text-[#8B8579]"
        />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelUrutanBuka(false);
              setPanelKategoriBuka((v) => !v);
            }}
            className="w-full flex items-center justify-between gap-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] text-[#1B2A26]"
          >
            <span className="truncate">{labelKategoriAset}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelKategoriBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelKategoriDropdownAset
            buka={panelKategoriBuka}
            filterSet={filterKategoriSet}
            kategoriAda={kategoriAsetAda}
            onSemua={() => {
              setFilterKategoriSet([]);
              setPanelKategoriBuka(false);
            }}
            onPilihTunggal={(key) => {
              setFilterKategoriSet([key]);
              setPanelKategoriBuka(false);
            }}
            onToggleKategori={(key) => {
              setFilterKategoriSet((prev) =>
                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
              );
            }}
            onClose={() => setPanelKategoriBuka(false)}
          />
        </div>
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => {
              setPanelKategoriBuka(false);
              setPanelUrutanBuka((v) => !v);
            }}
            className="w-full flex items-center justify-between gap-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] text-[#1B2A26]"
          >
            <span className="truncate">{labelUrutanAset}</span>
            <ChevronDown size={14} className={`text-[#8B8579] shrink-0 transition-transform duration-200 ${panelUrutanBuka ? "rotate-180" : ""}`} />
          </button>
          <PanelUrutanDropdownAset
            buka={panelUrutanBuka}
            urutan={urutan}
            onUbah={setUrutan}
            onClose={() => setPanelUrutanBuka(false)}
          />
        </div>
      </div>

      {urutan === "rentang" && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {RENTANG_OPSI.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRentangWaktu(v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${rentangWaktu === v ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
              >
                {l}
              </button>
            ))}
          </div>
          {rentangWaktu === "kustom" && (
            <div className="flex gap-2">
              <input type="date" value={dariKustom} onChange={(e) => setDariKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
              <input type="date" value={sampaiKustom} onChange={(e) => setSampaiKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#8B8579] mb-3">{filtered.length} dari {gabungan.length} aset</p>

      <div className={`data-scroll-region ${filtered.length > 5 ? "is-scrollable" : ""}`}>
      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada aset yang cocok.</p>
      ) : (
        <div className="rounded-2xl border border-[#E7E1D3] overflow-hidden bg-white">
          {filtered.map((item) => {
            if (item.tipe === "saldo") {
              const isPiutang = item.kategori === "Piutang";
              return (
                <KartuAsetOtomatis
                  key={isPiutang ? "saldo-piutang" : item.kategori === "E-Wallet" ? "saldo-ewallet" : "saldo-kasbank"}
                  nama={item.nama}
                  keterangan={isPiutang ? "Piutang · otomatis dari piutang aktif" : `${item.kategori} · otomatis dari transaksi`}
                  nilai={item.nilai}
                  ikon={isPiutang ? Users : (IKON_KATEGORI_ASET[item.kategori] || Landmark)}
                  warna={isPiutang ? WARNA_KATEGORI_ASET.Piutang : WARNA_KATEGORI_ASET[item.kategori]}
                  goTo={goTo}
                  tabTujuan={isPiutang ? "hutang" : "transaksi"}
                  judulTujuan={isPiutang ? "Hutang" : "Transaksi"}
                />
              );
            }
            return (
              <KartuAset
                key={item.asli.id}
                item={item.asli}
                onInfo={() => setDetailItem(item.asli)}
              />
            );
          })}
        </div>
      )}
      </div>
      </>
      )}

      {mode !== "tambah" && mode !== "edit" && (
        <FabMenu
          opsi={OPSI_FAB_ASET}
          onPilih={(aksi) => {
            setEditItem(null);
            if (["tambah", "beli", "jual"].includes(aksi)) setMode(aksi);
          }}
        />
      )}

      {detailItem && (
        <DetailAset
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onBeli={() => { setEditItem(detailItem); setDetailItem(null); setMode("beli"); }}
          onJual={() => { setEditItem(detailItem); setDetailItem(null); setMode("jual"); }}
          onEdit={() => { setEditItem(detailItem); setDetailItem(null); setMode("edit"); }}
        />
      )}
    </div>
  );
}

// ---------- FORM TAMBAH TRANSAKSI ----------
function DropdownPilihTunggal({ value, options, onChange, accent = "#2F6F5E", ariaLabel }) {
  const [buka, setBuka] = useState(false);
  const wadahRef = useRef(null);
  const opsiAktif = options.find((opsi) => opsi.value === value) || options[0];

  useEffect(() => {
    if (!buka) return;
    const tutupJikaDiLuar = (event) => {
      if (!wadahRef.current?.contains(event.target)) setBuka(false);
    };
    document.addEventListener("pointerdown", tutupJikaDiLuar);
    return () => document.removeEventListener("pointerdown", tutupJikaDiLuar);
  }, [buka]);

  return (
    <div ref={wadahRef} className="relative min-w-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={buka}
        onClick={() => setBuka((nilai) => !nilai)}
        className="w-full h-[38px] px-3 rounded-[11px] border border-[#E4DED1] bg-[#FCFBF8] shadow-[0_3px_10px_rgba(27,42,38,0.025)] flex items-center justify-between gap-2 text-left outline-none transition-colors"
        style={buka ? { borderColor: accent } : undefined}
      >
        <span className="min-w-0 flex items-center gap-2">
          {opsiAktif?.icon && (
            <span className="w-6 h-6 rounded-lg bg-white border border-[#E7E1D3] flex items-center justify-center shrink-0" style={{ color: accent }}>
              <Icon name={opsiAktif.icon} size={13} strokeWidth={1.9} />
            </span>
          )}
          <span className="min-w-0 truncate text-[10.5px] font-medium text-[#1B2A26]">{opsiAktif?.label || "Pilih"}</span>
        </span>
        <ChevronDown size={12} className={`shrink-0 text-[#6F786F] transition-transform duration-150 ${buka ? "rotate-180" : ""}`} />
      </button>

      {buka && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-[80] left-0 right-0 top-full mt-1.5 max-h-[190px] overflow-y-auto overscroll-contain rounded-[13px] border border-white/80 bg-white/85 backdrop-blur-xl shadow-[0_14px_34px_rgba(27,42,38,0.16)] p-1.5"
        >
          {options.map((opsi) => {
            const aktif = opsi.value === value;
            return (
              <button
                key={opsi.value}
                type="button"
                role="option"
                aria-selected={aktif}
                onClick={() => {
                  onChange(opsi.value);
                  setBuka(false);
                }}
                className={`w-full min-h-[34px] px-2.5 py-1.5 rounded-[9px] flex items-center justify-between gap-2 text-left ${aktif ? "bg-[#F1F7F4]" : "hover:bg-[#F7F5F0]"}`}
              >
                <span className="min-w-0 flex items-center gap-2">
                  {opsi.icon && (
                    <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${aktif ? "bg-white border-[#D8E8E1]" : "bg-[#FCFBF8] border-[#E7E1D3]"}`} style={{ color: aktif ? accent : "#6F786F" }}>
                      <Icon name={opsi.icon} size={13} strokeWidth={1.9} />
                    </span>
                  )}
                  <span className={`min-w-0 truncate text-[10.5px] ${aktif ? "font-semibold text-[#1B2A26]" : "font-medium text-[#57534D]"}`}>{opsi.label}</span>
                </span>
                {aktif && <Check size={12} className="shrink-0" style={{ color: accent }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormTambah({ initial, initialMenunggu = false, preset, saldo = 0, saldoBank = 0, saldoEwallet = 0, onClose, onSubmit, onDelete, layout = "popup", onDirtyChange }) {
  const tipe = initial ? (initial.jumlah < 0 ? "keluar" : "masuk") : preset?.tipe || "keluar";
  const [nama, setNama] = useState(initial?.nama || "");
  const [jumlah, setJumlah] = useState(initial ? String(Math.abs(initial.jumlah)) : "");
  const [kat, setKat] = useState(initial?.kat || (tipe === "keluar" ? KATEGORI_PENGELUARAN[0] : SUMBER_PEMASUKAN[0]));
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tgl) : todayInput());
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [errors, setErrors] = useState({});
  const [fokusNama, setFokusNama] = useState(false);
  const [fokusCatatan, setFokusCatatan] = useState(false);

  const MAKS_NAMA = 30;
  const MAKS_CATATAN = 200;

  // Metode Penerimaan (Pemasukan) / Metode Pembayaran (Pengeluaran) — SENGAJA berbeda
  // logika dari Transfer & Kelola (Sumber Dana/Tujuan Dana), karena menu ini hanya
  // menentukan media penerimaan/pembayaran, bukan memindahkan saldo antar akun.
  // Kas, Bank, dan E-Wallet adalah SATU kelompok "Saldo Transaksi": ketiganya SELALU
  // tersedia sebagai pilihan dan saldonya dihitung otomatis dari akumulasi transaksi,
  // tanpa pernah mewajibkan pengguna membuat aset lebih dulu di menu Aset.
  const metodeAwal =
    initial?.akunId === ID_BANK_TRANSAKSI ? "bank" : initial?.akunId === ID_EWALLET_TRANSAKSI ? "ewallet" : "kas";
  const [metodeUtama, setMetodeUtama] = useState(metodeAwal);

  const akunId = metodeUtama === "bank" ? ID_BANK_TRANSAKSI : metodeUtama === "ewallet" ? ID_EWALLET_TRANSAKSI : ID_SALDO_TRANSAKSI;
  const namaMetode = metodeUtama === "kas" ? "Kas" : metodeUtama === "bank" ? "Bank" : "E-Wallet";
  const saldoAkun = metodeUtama === "kas" ? saldo : metodeUtama === "bank" ? saldoBank : saldoEwallet;

  // Saat Edit: saldo akun yang ditampilkan/divalidasi SUDAH mengandung efek transaksi lama
  // (karena transaksi lama masih ada di data sampai disimpan). Supaya validasi tidak keliru
  // membandingkan nominal baru ke saldo yang "sudah dipotong" transaksi lama, kembalikan dulu
  // efek lama secara virtual — tapi HANYA jika metode pembayarannya tidak berubah; kalau akun
  // tujuannya beda, saldo akun yang sedang dipilih memang belum tersentuh transaksi lama sama
  // sekali, jadi tidak perlu (dan tidak boleh) ditambah balik.
  // Transaksi berstatus Menunggu Saldo SUDAH dikecualikan dari transaksiEfektif, jadi
  // saldoAkun yang diterima di sini TIDAK mengandung efek transaksi lama ini sama sekali —
  // tidak perlu (dan tidak boleh) ditambah balik, beda dari kasus edit transaksi normal.
  const efekLamaPadaAkunIni = initial && !initialMenunggu && tipe === "keluar" && metodeUtama === metodeAwal ? Math.abs(initial.jumlah) : 0;
  const saldoVirtualAkun = saldoAkun + efekLamaPadaAkunIni;

  // Baseline nilai awal — dipakai untuk mendeteksi ada/tidaknya perubahan yang belum
  // disimpan (mis. untuk dialog konfirmasi di Detail Transaksi). Tidak memengaruhi submit.
  const baselineRef = useRef({ nama, jumlah, kat, tanggal, catatan, metodeUtama });
  useEffect(() => {
    if (!onDirtyChange) return;
    const b = baselineRef.current;
    const dirty = nama !== b.nama || jumlah !== b.jumlah || kat !== b.kat || tanggal !== b.tanggal || catatan !== b.catatan || metodeUtama !== b.metodeUtama;
    onDirtyChange(dirty);
  }, [nama, jumlah, kat, tanggal, catatan, metodeUtama, onDirtyChange]);

  const labelMetode = tipe === "keluar" ? "Metode Pengeluaran" : "Metode Pemasukan";
  const labelSaldo = tipe === "keluar" ? "Saldo tersedia" : "Saldo saat ini";

  // "Biaya Admin" sengaja tidak ditampilkan sebagai pilihan manual di sini — kategori ini
  // hanya boleh dibuat otomatis oleh sistem melalui alur Transfer & Kelola (lihat transferDana),
  // supaya keterkaitannya dengan transaksi Transfer induk tetap terjaga.
  const daftarKat = tipe === "keluar" ? KATEGORI_PENGELUARAN.filter((k) => k !== "Biaya Admin") : SUMBER_PEMASUKAN;
  const opsiKategoriDropdown = daftarKat.map((k) => ({
    value: k,
    label: k,
    icon: tipe === "keluar"
      ? (IKON_KATEGORI_PENGELUARAN[k] || "more")
      : (IKON_KATEGORI_PEMASUKAN[k] || "more"),
  }));
  const opsiMetodeDropdown = [
    { value: "kas", label: "Kas", icon: "cash" },
    { value: "bank", label: "Bank", icon: "bank" },
    { value: "ewallet", label: "E-Wallet", icon: "ewallet" },
  ];
  const jenisLabel = preset?.judul || (tipe === "keluar" ? "Pengeluaran" : "Pemasukan");
  const warnaAksi = tipe === "keluar" ? "#B5533C" : "#2F6F5E";

  const submit = () => {
    const nilai = Number(jumlah);
    const err = {};
    if (!nama.trim()) err.nama = "Nama transaksi wajib diisi.";
    if (!jumlah || nilai <= 0) err.jumlah = "Jumlah harus lebih besar dari 0.";
    // Validasi saldo HANYA berlaku untuk Pengeluaran — Pemasukan menambah saldo
    // sehingga tidak pernah perlu (dan tidak boleh) ditolak karena saldo kecil.
    else if (tipe === "keluar" && nilai > saldoVirtualAkun) err.jumlah = "Saldo pada metode pembayaran yang dipilih tidak mencukupi.";
    if (!kat) err.kat = tipe === "keluar" ? "Kategori wajib dipilih." : "Sumber wajib dipilih.";
    if (!tanggal) err.tanggal = "Tanggal wajib diisi.";
    if (Object.keys(err).length) return setErrors(err);

    const tanggalFormat = formatTglDariInput(tanggal);
    onSubmit({
      id: initial?.id || buatId(),
      nama: nama.trim(),
      tgl: tanggalFormat,
      kat,
      metode: namaMetode,
      akunId,
      catatan: catatan.trim(),
      jumlah: tipe === "keluar" ? -Math.abs(nilai) : Math.abs(nilai),
      terjadwal: isTanggalTerjadwal(tanggalFormat) || initial?.terjadwal || false,
    });
    onClose();
  };

  const isHalaman = layout === "halaman";

  const isiBawaan = (
    <>
        {!isHalaman && (
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? `Edit ${jenisLabel}` : `Tambah ${jenisLabel}`}
          </h3>
          <button onClick={onClose} className="text-[#8B8579] p-1.5" title="Tutup">
            <X size={18} />
          </button>
        </div>
        )}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Nama Transaksi</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value.slice(0, MAKS_NAMA))}
          onFocus={() => setFokusNama(true)}
          onBlur={() => setFokusNama(false)}
          maxLength={MAKS_NAMA}
          placeholder={tipe === "keluar" ? "Contoh: Makan siang" : "Contoh: Gaji Juli"}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.nama ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {fokusNama && (
          <p className={`text-[11px] text-right mb-1 ${nama.length >= MAKS_NAMA ? "text-[#B5533C]" : "text-[#8B8579]"}`}>
            {nama.length}/{MAKS_NAMA}
          </p>
        )}
        {errors.nama && <p className="text-[11px] text-[#B5533C] mb-2">{errors.nama}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Jumlah (Rp)</label>
        <InputNominal
          value={jumlah}
          onChange={setJumlah}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.jumlah ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
        {errors.jumlah && <p className="text-[11px] text-[#B5533C] mb-2">{errors.jumlah}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">
          {tipe === "keluar" ? "Kategori Pengeluaran" : "Sumber Pemasukan"}
        </label>
        <select
          value={kat}
          onChange={(e) => setKat(e.target.value)}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.kat ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        >
          {daftarKat.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Tanggal</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.tanggal ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {errors.tanggal && <p className="text-[11px] text-[#B5533C] mb-2">{errors.tanggal}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">{labelMetode}</label>
        <select
          value={metodeUtama}
          onChange={(e) => setMetodeUtama(e.target.value)}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E]"
        >
          <option value="kas">Kas</option>
          <option value="bank">Bank</option>
          <option value="ewallet">E-Wallet</option>
        </select>

        {errors.jumlah === "Saldo pada metode pembayaran yang dipilih tidak mencukupi." ? null : (
          <div className="flex items-center justify-between gap-2 bg-[#EAF2EE] border border-[#D8E8E1] rounded-xl px-3 py-2.5 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] text-[#1B2A26] font-medium">
              <Info size={13} className="text-[#2F6F5E] shrink-0" />
              {labelSaldo}
            </span>
            <span className="text-[12px] text-[#2F6F5E] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(saldoVirtualAkun)}</span>
          </div>
        )}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Catatan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value.slice(0, MAKS_CATATAN))}
          onFocus={() => setFokusCatatan(true)}
          onBlur={() => setFokusCatatan(false)}
          maxLength={MAKS_CATATAN}
          placeholder="Tambahkan detail tambahan…"
          rows={2}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] resize-none"
        />
        {fokusCatatan && (
          <p className={`text-[11px] text-right mb-1 ${catatan.length >= MAKS_CATATAN ? "text-[#B5533C]" : "text-[#8B8579]"}`}>
            {catatan.length}/{MAKS_CATATAN}
          </p>
        )}

        <div className="flex flex-row items-stretch gap-3 mt-5 mb-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 basis-0 min-w-0 h-[52px] px-4 rounded-2xl border border-[#B5533C] text-[#B5533C] text-[15px] font-medium flex items-center justify-center gap-1.5 active:opacity-90"
            >
              <Trash2 size={16} /> Hapus
            </button>
          )}
          <button
            onClick={submit}
            className="flex-1 basis-0 min-w-0 h-[52px] px-4 rounded-2xl text-white text-[15px] font-medium shadow-sm flex items-center justify-center active:opacity-90"
            style={{ backgroundColor: warnaAksi }}
          >
            Simpan
          </button>
        </div>
    </>
  );

  const nilaiSaatIni = Number(jumlah) || 0;
  const jumlahValid = nilaiSaatIni > 0 && nilaiSaatIni <= saldoVirtualAkun;
  const IkonKategoriAktif = tipe === "keluar"
    ? (IKON_REGISTRY[IKON_KATEGORI_PENGELUARAN[kat] || "shopping"] || ShoppingBag)
    : (IKON_REGISTRY[IKON_KATEGORI_PEMASUKAN[kat] || "salary"] || Banknote);
  const IkonMetodeAktif = IKON_REGISTRY[namaIkonMetode(metodeUtama)] || Wallet;
  const saldoSesudahTransaksi = tipe === "keluar" ? saldoVirtualAkun - nilaiSaatIni : saldoVirtualAkun + nilaiSaatIni;
  const jumlahValidHalaman = nilaiSaatIni > 0 && (tipe === "masuk" || nilaiSaatIni <= saldoVirtualAkun);
  const formHalamanValid = Boolean(nama.trim() && kat && tanggal && jumlahValidHalaman);

  // Layout halaman penuh dibuat padat agar seluruh form tambah/edit transaksi muat dalam
  // satu viewport. Tidak ada scroll paksa: setiap kelompok punya batas, tinggi, dan jarak
  // yang konsisten, sementara field yang saling berkaitan ditempatkan dalam grid.

  // Layout khusus Pemasukan: setiap ikon, label, nilai, dan kontrol memiliki area
  // mandiri. Dibuat padat untuk satu viewport tanpa menumpuk ikon dengan teks atau
  // bergantung pada ukuran font browser Android.
  const isiHalamanPemasukan = (
    <div className="min-h-0 flex flex-col gap-2.5 pb-1">
      <section className="rounded-[20px] border border-[#DCEBE4] bg-[#F3F9F6] px-3 py-2.5 shadow-[0_8px_22px_rgba(27,42,38,0.05)] overflow-hidden">
        <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(96px,38%)] items-stretch min-w-0">
          <span className="w-10 h-10 self-center rounded-[14px] bg-[#E3F1EA] text-[#2F6F5E] flex items-center justify-center overflow-hidden shrink-0">
            <IkonKategoriAktif size={18} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 self-center px-3 overflow-hidden">
            <p className="text-[9px] uppercase tracking-[0.12em] text-[#7E796F] truncate">Pemasukan · {namaMetode}</p>
            <p className="mt-0.5 text-[13px] leading-tight font-semibold text-[#1B2A26] truncate">{kat || "Pemasukan"}</p>
          </div>
          <div className="min-w-0 border-l border-[#D8E8E1] pl-3 flex flex-col justify-center text-right overflow-hidden">
            <p className="text-[9px] text-[#8B8579]">Nominal</p>
            <p className="mt-0.5 text-[14px] leading-tight font-semibold text-[#2F6F5E] whitespace-nowrap overflow-hidden text-ellipsis" title={rupiah(nilaiSaatIni)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {rupiahRingkasArea(nilaiSaatIni)}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#E8E3D8] shadow-[0_8px_22px_rgba(27,42,38,0.04)] px-3.5 py-3 flex flex-col gap-2.5">
        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Nama transaksi</label>
          <div className={`grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.nama ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]">
              <FileText size={14} />
            </span>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value.slice(0, MAKS_NAMA))}
              onFocus={() => setFokusNama(true)}
              onBlur={() => setFokusNama(false)}
              maxLength={MAKS_NAMA}
              placeholder="Contoh: Gaji Juli"
              className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[12px] text-[#1B2A26] placeholder:text-[#AAA49A]"
            />
          </div>
          {errors.nama && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.nama}</p>}
        </div>

        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Jumlah (Rp)</label>
          <div className={`grid grid-cols-[42px_minmax(0,1fr)] items-center h-[46px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.jumlah ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
            <span className="h-full border-r border-[#DDEBE4] bg-[#EDF6F1] flex items-center justify-center text-[11px] font-bold text-[#2F6F5E]">Rp</span>
            <InputNominal
              value={jumlah}
              onChange={setJumlah}
              className="w-full min-w-0 h-full px-3 bg-transparent outline-none text-[18px] font-semibold text-[#1B2A26]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          {errors.jumlah && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.jumlah}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Sumber</label>
            <DropdownPilihTunggal
              value={kat}
              options={opsiKategoriDropdown}
              onChange={setKat}
              accent="#2F6F5E"
              ariaLabel="Pilih sumber pemasukan"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Metode</label>
            <DropdownPilihTunggal
              value={metodeUtama}
              options={opsiMetodeDropdown}
              onChange={setMetodeUtama}
              accent="#2F6F5E"
              ariaLabel="Pilih metode pemasukan"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Tanggal</label>
          <div className={`grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.tanggal ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]">
              <History size={14} />
            </span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[11px] text-[#1B2A26]"
            />
          </div>
          {errors.tanggal && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.tanggal}</p>}
        </div>

        <div className={`grid grid-cols-[32px_minmax(0,1fr)_minmax(104px,45%)] items-stretch min-h-[40px] rounded-xl border overflow-hidden ${saldoSesudahTransaksi < 0 ? "bg-[#FFF1ED] border-[#E9B8AA]" : "bg-[#F1F7F4] border-[#D8E8E1]"}`}>
          <span className={`min-h-[40px] border-r flex items-center justify-center ${saldoSesudahTransaksi < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`}>
            <Wallet size={13} />
          </span>
          <span className="min-w-0 px-2.5 flex items-center text-[10px] font-medium text-[#1B2A26] truncate">Saldo setelah</span>
          <span className={`min-w-0 border-l px-2.5 flex items-center justify-end text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${saldoSesudahTransaksi < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`} title={rupiah(saldoSesudahTransaksi)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {rupiahRingkasArea(saldoSesudahTransaksi)}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F]">Catatan <span className="normal-case tracking-normal font-normal">(opsional)</span></label>
            {(fokusCatatan || catatan.length > 0) && <span className="text-[9px] text-[#9B958B]">{catatan.length}/{MAKS_CATATAN}</span>}
          </div>
          <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#2F6F5E]">
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]">
              <FileText size={14} />
            </span>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value.slice(0, MAKS_CATATAN))}
              onFocus={() => setFokusCatatan(true)}
              onBlur={() => setFokusCatatan(false)}
              maxLength={MAKS_CATATAN}
              placeholder="Tambahkan catatan bila diperlukan"
              rows={1}
              className="w-full min-w-0 h-[22px] leading-[22px] px-2.5 bg-transparent outline-none resize-none overflow-hidden text-[11px] text-[#1B2A26] placeholder:text-[#AAA49A]"
            />
          </div>
        </div>
      </section>

      <div className="flex items-stretch gap-2.5">
        {onDelete && (
          <button onClick={onDelete} className="w-[88px] h-[46px] rounded-xl border border-[#B5533C] text-[#B5533C] flex items-center justify-center gap-1.5 text-[12px] font-semibold">
            <Trash2 size={14} /> Hapus
          </button>
        )}
        <button
          onClick={submit}
          aria-disabled={!formHalamanValid}
          className={`flex-1 h-[46px] rounded-xl text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm active:opacity-90 ${formHalamanValid ? "" : "opacity-60"}`}
          style={{ backgroundColor: warnaAksi }}
        >
          <Check size={15} /> {initial ? "Simpan Perubahan" : "Simpan Pemasukan"}
        </button>
      </div>
    </div>
  );


  const isiHalamanPengeluaran = (
    <div className="min-h-0 flex flex-col gap-2.5 pb-1">
      <section className="rounded-[20px] border border-[#EEDBD4] bg-[#FFF8F5] px-3 py-2.5 shadow-[0_8px_22px_rgba(27,42,38,0.05)] overflow-hidden">
        <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(96px,38%)] items-stretch min-w-0">
          <span className="w-10 h-10 self-center rounded-[14px] bg-[#F5E6E1] text-[#B5533C] flex items-center justify-center overflow-hidden shrink-0">
            <IkonKategoriAktif size={18} strokeWidth={1.9} />
          </span>
          <div className="min-w-0 self-center px-3 overflow-hidden">
            <p className="text-[9px] uppercase tracking-[0.12em] text-[#7E796F] truncate">Pengeluaran · {namaMetode}</p>
            <p className="mt-0.5 text-[13px] leading-tight font-semibold text-[#1B2A26] truncate">{kat || "Pengeluaran"}</p>
          </div>
          <div className="min-w-0 border-l border-[#EAD7D0] pl-3 flex flex-col justify-center text-right overflow-hidden">
            <p className="text-[9px] text-[#8B8579]">Nominal</p>
            <p className="mt-0.5 text-[14px] leading-tight font-semibold text-[#B5533C] whitespace-nowrap overflow-hidden text-ellipsis" title={rupiah(nilaiSaatIni)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {rupiahRingkasArea(nilaiSaatIni)}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[20px] border border-[#E8E3D8] shadow-[0_8px_22px_rgba(27,42,38,0.04)] px-3.5 py-3 flex flex-col gap-2.5">
        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Nama transaksi</label>
          <div className={`grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.nama ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#B5533C]"}`}>
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#B5533C]">
              <FileText size={14} />
            </span>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value.slice(0, MAKS_NAMA))}
              onFocus={() => setFokusNama(true)}
              onBlur={() => setFokusNama(false)}
              maxLength={MAKS_NAMA}
              placeholder="Contoh: Makan siang"
              className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[12px] text-[#1B2A26] placeholder:text-[#AAA49A]"
            />
          </div>
          {errors.nama && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.nama}</p>}
        </div>

        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Jumlah (Rp)</label>
          <div className={`grid grid-cols-[42px_minmax(0,1fr)] items-center h-[46px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.jumlah ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#B5533C]"}`}>
            <span className="h-full border-r border-[#EBD9D2] bg-[#F8ECE8] flex items-center justify-center text-[11px] font-bold text-[#B5533C]">Rp</span>
            <InputNominal
              value={jumlah}
              onChange={setJumlah}
              className="w-full min-w-0 h-full px-3 bg-transparent outline-none text-[18px] font-semibold text-[#1B2A26]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          {errors.jumlah && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.jumlah}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Kategori</label>
            <DropdownPilihTunggal
              value={kat}
              options={opsiKategoriDropdown}
              onChange={setKat}
              accent="#B5533C"
              ariaLabel="Pilih kategori pengeluaran"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Metode</label>
            <DropdownPilihTunggal
              value={metodeUtama}
              options={opsiMetodeDropdown}
              onChange={setMetodeUtama}
              accent="#B5533C"
              ariaLabel="Pilih metode pengeluaran"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Tanggal</label>
          <div className={`grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.tanggal ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#B5533C]"}`}>
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#B5533C]">
              <History size={14} />
            </span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[11px] text-[#1B2A26]"
            />
          </div>
          {errors.tanggal && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.tanggal}</p>}
        </div>

        <div className={`grid grid-cols-[32px_minmax(0,1fr)_minmax(104px,45%)] items-stretch min-h-[40px] rounded-xl border overflow-hidden ${saldoSesudahTransaksi < 0 ? "bg-[#FFF1ED] border-[#E9B8AA]" : "bg-[#F1F7F4] border-[#D8E8E1]"}`}>
          <span className={`min-h-[40px] border-r flex items-center justify-center ${saldoSesudahTransaksi < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`}>
            <Wallet size={13} />
          </span>
          <span className="min-w-0 px-2.5 flex items-center text-[10px] font-medium text-[#1B2A26] truncate">Saldo setelah</span>
          <span className={`min-w-0 border-l px-2.5 flex items-center justify-end text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${saldoSesudahTransaksi < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`} title={rupiah(saldoSesudahTransaksi)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {rupiahRingkasArea(saldoSesudahTransaksi)}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F]">Catatan <span className="normal-case tracking-normal font-normal">(opsional)</span></label>
            {(fokusCatatan || catatan.length > 0) && <span className="text-[9px] text-[#9B958B]">{catatan.length}/{MAKS_CATATAN}</span>}
          </div>
          <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[42px] rounded-xl border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#B5533C]">
            <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#B5533C]">
              <FileText size={14} />
            </span>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value.slice(0, MAKS_CATATAN))}
              onFocus={() => setFokusCatatan(true)}
              onBlur={() => setFokusCatatan(false)}
              maxLength={MAKS_CATATAN}
              placeholder="Tambahkan catatan bila diperlukan"
              rows={1}
              className="w-full min-w-0 h-[22px] leading-[22px] px-2.5 bg-transparent outline-none resize-none overflow-hidden text-[11px] text-[#1B2A26] placeholder:text-[#AAA49A]"
            />
          </div>
        </div>
      </section>

      <div className="flex items-stretch gap-2.5">
        {onDelete && (
          <button onClick={onDelete} className="w-[88px] h-[46px] rounded-xl border border-[#B5533C] text-[#B5533C] flex items-center justify-center gap-1.5 text-[12px] font-semibold">
            <Trash2 size={14} /> Hapus
          </button>
        )}
        <button
          onClick={submit}
          aria-disabled={!formHalamanValid}
          className={`flex-1 h-[46px] rounded-xl text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm active:opacity-90 ${formHalamanValid ? "" : "opacity-60"}`}
          style={{ backgroundColor: warnaAksi }}
        >
          <Check size={15} /> {initial ? "Simpan Perubahan" : "Simpan Pengeluaran"}
        </button>
      </div>
    </div>
  );

  const isi = isHalaman ? (tipe === "masuk" ? isiHalamanPemasukan : isiHalamanPengeluaran) : isiBawaan;

  if (isHalaman) return isi;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {isi}
      </div>
    </div>
  );
}

// ---------- FORM TRANSFER ----------
// ID khusus untuk mewakili saldo Kas/Bank/E-Wallet yang berasal dari akumulasi transaksi
// (bukan aset manual). Ketiganya adalah satu kelompok "Saldo Transaksi" yang selalu
// tersedia tanpa perlu dibuat lebih dulu di menu Aset — dipakai sebagai salah satu
// opsi Metode Pembayaran/Penerimaan maupun Sumber/Tujuan Dana.
const ID_SALDO_TRANSAKSI = "saldo-transaksi";
const ID_BANK_TRANSAKSI = "bank-transaksi";
const ID_EWALLET_TRANSAKSI = "ewallet-transaksi";
const AKUN_VIRTUAL_TRANSAKSI = [ID_SALDO_TRANSAKSI, ID_BANK_TRANSAKSI, ID_EWALLET_TRANSAKSI];

// Menghitung transaksi berstatus "Menunggu Saldo": transaksi Terjadwal yang tanggal
// eksekusinya sudah tiba, tapi saldo akun virtual (Kas/Bank/E-Wallet) sumbernya tidak
// cukup untuk menjalankannya. Transaksi seperti ini SENGAJA tidak dipaksa jalan (saldo
// tidak boleh minus) — ia dikecualikan dari transaksiEfektif sampai pengguna
// menyelesaikannya (ubah metode/nominal/tanggal, tambah saldo, atau hapus).
// Diproses berurutan per tanggal (yang paling lama jatuh tempo lebih dulu) supaya
// keputusan "cukup/tidak" konsisten dengan urutan transaksi lain yang sudah lebih dulu
// mengurangi saldo akun yang sama. Baris "Biaya Admin Transfer" selalu mengikuti status
// transfer induknya (transferId yang sama) agar keduanya tidak pernah tidak sinkron.
function hitungTransaksiMenungguSaldo(transaksiSemua) {
  const base = { [ID_SALDO_TRANSAKSI]: 0, [ID_BANK_TRANSAKSI]: 0, [ID_EWALLET_TRANSAKSI]: 0 };
  const antrian = [];

  for (const t of transaksiSemua) {
    if (t.tipe === "biaya-transfer") continue; // ikut status transfer induk, ditangani terpisah di bawah
    const wasScheduled = t.terjadwal === true;
    const due = !isTanggalTerjadwal(t.tgl);

    if (t.tipe === "transfer") {
      const info = t.transferInfo || {};
      const akun = info.sumberId;
      if (!AKUN_VIRTUAL_TRANSAKSI.includes(akun)) continue; // sumber bukan akun virtual, di luar cakupan fitur ini
      const dampak = -(info.nominal + (info.biayaAdmin > 0 ? info.biayaAdmin : 0));
      if (wasScheduled && due) antrian.push({ t, akun, dampak });
      else if (due) base[akun] += dampak;
      continue;
    }

    const akun = t.akunId || ID_SALDO_TRANSAKSI;
    if (!AKUN_VIRTUAL_TRANSAKSI.includes(akun)) continue;
    if (wasScheduled && due) antrian.push({ t, akun, dampak: t.jumlah });
    else if (due) base[akun] += t.jumlah;
  }

  antrian.sort((a, b) => parseTglID(a.t.tgl) - parseTglID(b.t.tgl));

  const gagalSet = new Set();
  const gagalTransferId = new Set();
  const running = { ...base };
  for (const { t, akun, dampak } of antrian) {
    if (dampak < 0 && running[akun] + dampak < 0) {
      gagalSet.add(t);
      if (t.tipe === "transfer") gagalTransferId.add(t.transferId);
    } else {
      running[akun] += dampak;
    }
  }

  for (const t of transaksiSemua) {
    if (t.tipe === "biaya-transfer" && t.transferId && gagalTransferId.has(t.transferId)) {
      gagalSet.add(t);
    }
  }

  return gagalSet;
}

// Menghitung saldo SEBELUM & SESUDAH tiap transaksi pada akun virtual (Kas/Bank/
// E-Wallet) yang terlibat — murni untuk tampilan "Informasi Transfer" di Detail
// Transaksi (tidak memengaruhi saldo/total yang sudah dihitung di tempat lain).
// Diproses berurutan berdasarkan tanggal (lalu urutan aslinya) atas transaksi yang
// benar-benar berefek ke saldo (bukan status Menunggu Saldo, bukan Terjadwal yang
// belum tiba), supaya angka akhirnya konsisten dengan saldo akun yang sudah ada.
function hitungSaldoSebelumSesudah(transaksiSemua, gagalSet) {
  const map = new Map();
  const urut = transaksiSemua
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !isTanggalTerjadwal(t.tgl) && t.tipe !== "biaya-transfer" && !gagalSet.has(t))
    .sort((a, b) => {
      const d = parseTglID(a.t.tgl) - parseTglID(b.t.tgl);
      return d !== 0 ? d : a.i - b.i;
    });
  const running = { [ID_SALDO_TRANSAKSI]: 0, [ID_BANK_TRANSAKSI]: 0, [ID_EWALLET_TRANSAKSI]: 0 };
  for (const { t } of urut) {
    if (t.tipe === "transfer" && t.transferInfo) {
      const { sumberId, tujuanId, nominal, biayaAdmin } = t.transferInfo;
      const totalKeluar = nominal + (biayaAdmin > 0 ? biayaAdmin : 0);
      const snap = {};
      if (Object.prototype.hasOwnProperty.call(running, sumberId)) {
        snap.sumberSebelum = running[sumberId];
        running[sumberId] -= totalKeluar;
        snap.sumberSesudah = running[sumberId];
      }
      if (Object.prototype.hasOwnProperty.call(running, tujuanId)) {
        snap.tujuanSebelum = running[tujuanId];
        running[tujuanId] += nominal;
        snap.tujuanSesudah = running[tujuanId];
      }
      map.set(t, snap);
      continue;
    }
    const akun = t.akunId || ID_SALDO_TRANSAKSI;
    if (!Object.prototype.hasOwnProperty.call(running, akun)) continue;
    const sebelum = running[akun];
    running[akun] += t.jumlah;
    map.set(t, { akunSebelum: sebelum, akunSesudah: running[akun] });
  }
  return map;
}

// Tombol kecil di header (Riwayat / Bantuan) — murni bantuan visual/informasi lokal,
// tidak menambah navigasi maupun logic baru. Menampilkan tip singkat saat ditekan.
function TombolBantuanHeader({ ikon: Ikon, label, tips, varian = "kotak" }) {
  const [buka, setBuka] = useState(false);
  const pil = varian === "pil";
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setBuka((v) => !v)}
        className={
          pil
            ? "flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white border border-[#E7E1D3] active:opacity-80"
            : "flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl bg-white border border-[#E7E1D3] active:opacity-80"
        }
      >
        <Ikon size={pil ? 14 : 15} className="text-[#2F6F5E]" />
        <span className={pil ? "text-[12px] text-[#1B2A26] font-medium whitespace-nowrap" : "text-[9.5px] text-[#1B2A26] font-medium"}>{label}</span>
      </button>
      {buka && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-52 rounded-xl bg-[#1B2A26] text-white text-[11px] leading-relaxed px-3 py-2.5 shadow-lg"
          onClick={() => setBuka(false)}
        >
          {tips}
        </div>
      )}
    </div>
  );
}

// Bungkus input/select dengan badge ikon di kiri — murni tampilan, tidak mengubah
// value/onChange/logic dari elemen form yang dibungkus.
function FormTransfer({ aset, saldo, saldoBank, saldoEwallet, onClose, onSubmit, jenisOperasi = "transfer", asetAwal = null }) {
  // Format ringkas khusus area Transfer: angka pecahan dipotong ke 2 desimal
  // agar saldo tidak terlihat lebih besar dari nilai sebenarnya (contoh 9.395.000 -> 9,39 jt).
  const rupiahRingkasTransfer = (nilai) => {
    const angka = Number(nilai) || 0;
    const negatif = angka < 0;
    const abs = Math.abs(angka);
    const satuan = [
      { batas: 1e12, pembagi: 1e12, label: "t" },
      { batas: 1e9, pembagi: 1e9, label: "m" },
      { batas: 1e6, pembagi: 1e6, label: "jt" },
      { batas: 1e4, pembagi: 1e3, label: "rb" },
    ].find((item) => abs >= item.batas);

    if (!satuan) return `${negatif ? "-" : ""}Rp ${abs.toLocaleString("id-ID")}`;

    const nilaiSkala = abs / satuan.pembagi;
    const terpotong = Math.floor((nilaiSkala + Number.EPSILON) * 100) / 100;
    const bulat = Number.isInteger(terpotong);
    const teks = bulat
      ? String(terpotong)
      : terpotong.toFixed(2).replace(".", ",");
    return `${negatif ? "-" : ""}Rp ${teks} ${satuan.label}`;
  };
  const asetBisaTransfer = useMemo(
    () => jenisOperasi === "transfer" ? aset.filter((a) => KATEGORI_AKUN_TRANSFERABLE.includes(a.kategori)) : aset,
    [aset, jenisOperasi]
  );

  const semuaAkun = useMemo(() => {
    const akun = [
      { id: ID_SALDO_TRANSAKSI, nama: "Kas (Saldo Transaksi)", nilai: saldo, kategori: "Kas", ikon: Wallet },
      { id: ID_BANK_TRANSAKSI, nama: "Bank (Saldo Transaksi)", nilai: saldoBank, kategori: "Bank", ikon: Landmark },
      { id: ID_EWALLET_TRANSAKSI, nama: "E-Wallet (Saldo Transaksi)", nilai: saldoEwallet, kategori: "E-Wallet", ikon: Smartphone },
    ];
    asetBisaTransfer.forEach((a) => akun.push({
      id: a.id,
      nama: a.nama,
      nilai: Number(a.nilai) || 0,
      kategori: a.kategori,
      ikon: IKON_KATEGORI_ASET[a.kategori] || Wallet,
    }));
    return akun;
  }, [asetBisaTransfer, saldo, saldoBank, saldoEwallet]);

  const akunVirtualIds = [ID_SALDO_TRANSAKSI, ID_BANK_TRANSAKSI, ID_EWALLET_TRANSAKSI];
  const sumberTersedia = useMemo(() => {
    const dasar = semuaAkun.filter((a) => a.nilai > 0);
    if (jenisOperasi === "beli") return dasar.filter((a) => akunVirtualIds.includes(a.id));
    if (jenisOperasi === "jual") return dasar.filter((a) => !akunVirtualIds.includes(a.id));
    return dasar;
  }, [semuaAkun, jenisOperasi]);
  const tujuanOperasi = useMemo(() => {
    if (jenisOperasi === "beli") return semuaAkun.filter((a) => !akunVirtualIds.includes(a.id));
    if (jenisOperasi === "jual") return semuaAkun.filter((a) => akunVirtualIds.includes(a.id));
    return semuaAkun;
  }, [semuaAkun, jenisOperasi]);
  const [sumberId, setSumberId] = useState(() => jenisOperasi === "jual" && asetAwal?.id ? asetAwal.id : sumberTersedia[0]?.id || "");
  const [tujuanId, setTujuanId] = useState(() => jenisOperasi === "beli" && asetAwal?.id ? asetAwal.id : "");
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState("");
  const [biayaAdmin, setBiayaAdmin] = useState("0");
  const [tanggal, setTanggal] = useState(todayInput());
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [tersimpan, setTersimpan] = useState(false);

  const sumber = semuaAkun.find((a) => a.id === sumberId) || null;
  const tujuan = semuaAkun.find((a) => a.id === tujuanId) || null;
  const tujuanTersedia = tujuanOperasi.filter((a) => a.id !== sumberId);
  const nilaiNominal = Number(nominal) || 0;
  const nilaiAdmin = Number(biayaAdmin) || 0;
  const totalDebit = nilaiNominal + nilaiAdmin;
  const saldoSesudah = (sumber?.nilai || 0) - totalDebit;
  const formValid = Boolean(sumber && tujuan && sumberId !== tujuanId && nilaiNominal > 0 && nilaiAdmin >= 0 && totalDebit <= (sumber?.nilai || 0) && tanggal);

  useEffect(() => {
    if (!sumberTersedia.some((a) => a.id === sumberId)) {
      setSumberId(sumberTersedia[0]?.id || "");
    }
  }, [sumberTersedia, sumberId]);

  useEffect(() => {
    if (!tujuanTersedia.some((a) => a.id === tujuanId)) {
      setTujuanId(tujuanTersedia[0]?.id || "");
    }
  }, [sumberId, tujuanId, semuaAkun]);

  const tukarAkun = () => {
    if (!tujuan) return;
    if (tujuan.nilai <= 0) {
      setErrors((prev) => ({ ...prev, sumber: "Akun tujuan belum memiliki saldo untuk dijadikan akun asal." }));
      return;
    }
    const asalLama = sumberId;
    setSumberId(tujuanId);
    setTujuanId(asalLama);
    setErrors({});
  };

  const validasi = () => {
    const err = {};
    if (!sumber) err.sumber = "Pilih akun asal.";
    if (!tujuan) err.tujuan = "Pilih akun tujuan.";
    if (sumberId && tujuanId && sumberId === tujuanId) err.tujuan = "Akun tujuan harus berbeda.";
    if (nilaiNominal <= 0) err.nominal = "Nominal transfer harus lebih dari Rp 0.";
    if (nilaiAdmin < 0) err.biayaAdmin = "Biaya admin tidak boleh negatif.";
    if (sumber && totalDebit > sumber.nilai) err.nominal = "Saldo tidak cukup untuk transfer dan biaya admin.";
    if (!tanggal) err.tanggal = "Tanggal transfer wajib diisi.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = () => {
    if (!validasi() || tersimpan) return;
    setTersimpan(true);
    onSubmit({
      nama: nama.trim() || (jenisOperasi === "beli" ? `Beli ${tujuan?.nama || "Aset"}` : jenisOperasi === "jual" ? `Jual ${sumber?.nama || "Aset"}` : "Transfer & Kelola"),
      sumberId,
      sumberNama: sumber.nama,
      tujuanId,
      tujuanNama: tujuan.nama,
      nominal: nilaiNominal,
      biayaAdmin: nilaiAdmin,
      tanggal: formatTglDariInput(tanggal),
      catatan: catatan.trim(),
    });
    onClose();
  };

  const IkonSumber = sumber?.ikon || Wallet;

  return (
    <div className="fixed inset-x-0 top-0 bottom-[72px] z-[25] bg-[var(--ui-bg)] overflow-hidden">
      <div className="max-w-[680px] mx-auto h-[100dvh] px-4 pt-3 pb-3 flex flex-col">
        <header className="shrink-0 flex items-center gap-3 mb-2.5">
          <button type="button" onClick={onClose} className="w-9 h-10 flex items-center justify-start text-[#1B2A26] active:opacity-60" aria-label="Kembali">
            <ArrowLeft size={22} strokeWidth={1.9} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[19px] font-semibold text-[#1B2A26] leading-tight">{jenisOperasi === "beli" ? "Beli Aset" : jenisOperasi === "jual" ? "Jual Aset" : "Transfer & Kelola"}</h1>
            <p className="text-[11px] text-[#8B8579] mt-0.5">{jenisOperasi === "beli" ? "Pindahkan dana menjadi nilai aset" : jenisOperasi === "jual" ? "Ubah nilai aset menjadi saldo transaksi" : "Pindahkan saldo antar akun"}</p>
          </div>
          <div className="w-9 h-10 text-[#3C86B5] flex items-center justify-end shrink-0" aria-hidden="true">
            {jenisOperasi === "beli" ? <ShoppingBag size={22} strokeWidth={1.9} /> : jenisOperasi === "jual" ? <Banknote size={22} strokeWidth={1.9} /> : <ArrowLeftRight size={22} strokeWidth={1.9} />}
          </div>
        </header>

        {sumberTersedia.length === 0 ? (
          <section className="mt-2 bg-white border border-[#E7E1D3] rounded-[20px] p-5 text-center shadow-sm">
            <div className="w-11 h-11 rounded-xl mx-auto mb-2 bg-[#EAF2EE] text-[#2F6F5E] flex items-center justify-center"><Wallet size={20} /></div>
            <h2 className="text-[14px] font-semibold text-[#1B2A26]">Belum ada saldo yang dapat ditransfer</h2>
            <p className="text-[11px] text-[#8B8579] mt-1">Tambahkan saldo pada akun terlebih dahulu.</p>
          </section>
        ) : (
          <div className="min-h-0 flex-1 flex flex-col gap-2.5">
            <section className="shrink-0 rounded-[20px] border border-[#DCEBE4] bg-[#F3F9F6] px-3 py-2.5 shadow-[0_8px_22px_rgba(27,42,38,0.05)] overflow-hidden">
              <div className="grid grid-cols-[40px_minmax(0,1fr)_minmax(110px,40%)] items-stretch min-w-0">
                <span className="w-10 h-10 self-center rounded-[14px] bg-[#E3F1EA] text-[#2F6F5E] flex items-center justify-center overflow-hidden shrink-0">
                  <IkonSumber size={18} strokeWidth={1.9} />
                </span>
                <div className="min-w-0 self-center px-3 overflow-hidden">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-[#7E796F] truncate">Akun asal · {sumber?.kategori || "Akun"}</p>
                  <p className="mt-0.5 text-[13px] leading-tight font-semibold text-[#1B2A26] truncate">{sumber?.nama}</p>
                </div>
                <div className="min-w-0 border-l border-[#D8E8E1] pl-3 flex flex-col justify-center text-right overflow-hidden">
                  <p className="text-[9px] text-[#8B8579]">Saldo</p>
                  <p className="mt-0.5 text-[14px] leading-tight font-semibold text-[#2F6F5E] whitespace-nowrap overflow-hidden text-ellipsis" title={rupiah(sumber?.nilai || 0)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {rupiahRingkasTransfer(sumber?.nilai || 0)}
                  </p>
                </div>
              </div>
            </section>

            <section className="min-h-0 bg-white rounded-[20px] border border-[#E8E3D8] shadow-[0_8px_22px_rgba(27,42,38,0.04)] px-3.5 py-3 flex flex-col gap-2.5">
              <div>
                <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Nama transfer <span className="normal-case tracking-normal font-normal">(opsional)</span></label>
                <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[40px] rounded-xl border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#2F6F5E]">
                  <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]"><FileText size={14} /></span>
                  <input value={nama} onChange={(e) => setNama(e.target.value.slice(0, 40))} placeholder={jenisOperasi === "beli" ? "Contoh: Pembelian aset" : jenisOperasi === "jual" ? "Contoh: Penjualan aset" : "Contoh: Dana darurat"} className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[12px] text-[#1B2A26] placeholder:text-[#AAA49A]" />
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)] gap-2 items-end">
                <div className="min-w-0">
                  <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">{jenisOperasi === "beli" ? "Akun pembayaran" : jenisOperasi === "jual" ? "Aset dijual" : "Akun asal"}</label>
                  <div className={`relative h-[40px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.sumber ? "border-[#B5533C]" : "border-[#E4DED1]"}`}>
                    <select value={sumberId} onChange={(e) => { setSumberId(e.target.value); setErrors({}); }} className="w-full h-full appearance-none bg-transparent pl-2.5 pr-7 text-[11px] outline-none truncate">
                      {sumberTersedia.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8579] pointer-events-none" />
                  </div>
                </div>
                <button type="button" onClick={tukarAkun} className="w-[34px] h-[34px] mb-[3px] rounded-xl bg-[#EAF2EE] text-[#2F6F5E] flex items-center justify-center active:scale-95 transition-transform" aria-label="Tukar akun"><ArrowUpDown size={14} /></button>
                <div className="min-w-0">
                  <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">{jenisOperasi === "beli" ? "Aset tujuan" : jenisOperasi === "jual" ? "Akun penerima" : "Akun tujuan"}</label>
                  <div className={`relative h-[40px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.tujuan ? "border-[#B5533C]" : "border-[#E4DED1]"}`}>
                    <select value={tujuanId} onChange={(e) => { setTujuanId(e.target.value); setErrors({}); }} className="w-full h-full appearance-none bg-transparent pl-2.5 pr-7 text-[11px] outline-none truncate">
                      {tujuanTersedia.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8579] pointer-events-none" />
                  </div>
                </div>
              </div>
              {(errors.sumber || errors.tujuan) && <p className="-mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.sumber || errors.tujuan}</p>}

              <div>
                <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">{jenisOperasi === "beli" ? "Nilai pembelian" : jenisOperasi === "jual" ? "Nilai penjualan" : "Nominal transfer"}</label>
                <div className={`grid grid-cols-[42px_minmax(0,1fr)] items-center h-[46px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.nominal ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
                  <span className="h-full border-r border-[#DDEBE4] bg-[#EDF6F1] flex items-center justify-center text-[11px] font-bold text-[#2F6F5E]">Rp</span>
                  <InputNominal value={nominal} onChange={(v) => { setNominal(v); setErrors((e) => ({ ...e, nominal: undefined })); }} className="w-full min-w-0 h-full px-3 bg-transparent outline-none text-[18px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }} />
                </div>
                {errors.nominal && <p className="mt-1 text-[9px] leading-tight text-[#B5533C]">{errors.nominal}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="min-w-0">
                  <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Biaya admin</label>
                  <div className={`grid grid-cols-[34px_minmax(0,1fr)] h-[40px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.biayaAdmin ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
                    <span className="border-r border-[#ECE6DA] flex items-center justify-center text-[10px] font-semibold text-[#2F6F5E]">Rp</span>
                    <InputNominal value={biayaAdmin} onChange={(v) => setBiayaAdmin(v)} className="w-full min-w-0 h-full px-2.5 bg-transparent outline-none text-[12px] text-[#1B2A26]" />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="block text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F] mb-1">Tanggal</label>
                  <div className={`grid grid-cols-[32px_minmax(0,1fr)] h-[40px] rounded-xl border bg-[#FCFBF8] overflow-hidden ${errors.tanggal ? "border-[#B5533C]" : "border-[#E4DED1] focus-within:border-[#2F6F5E]"}`}>
                    <span className="border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]"><History size={13} /></span>
                    <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full min-w-0 h-full px-2 bg-transparent outline-none text-[10px] text-[#1B2A26]" />
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-[32px_minmax(0,1fr)_minmax(112px,43%)] items-stretch min-h-[40px] rounded-xl border overflow-hidden ${saldoSesudah < 0 ? "bg-[#FFF1ED] border-[#E9B8AA]" : "bg-[#F1F7F4] border-[#D8E8E1]"}`}>
                <span className={`min-h-[40px] border-r flex items-center justify-center ${saldoSesudah < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`}><Wallet size={13} /></span>
                <span className="min-w-0 px-2.5 flex items-center text-[10px] font-medium text-[#1B2A26] truncate">Saldo setelah</span>
                <span className={`min-w-0 border-l px-2.5 flex items-center justify-end text-[11px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${saldoSesudah < 0 ? "border-[#E9B8AA] text-[#B5533C]" : "border-[#D8E8E1] text-[#2F6F5E]"}`} title={rupiah(saldoSesudah)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiahRingkasTransfer(saldoSesudah)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#7E796F]">Catatan <span className="normal-case tracking-normal font-normal">(opsional)</span></label>
                  {catatan.length > 0 && <span className="text-[9px] text-[#9B958B]">{catatan.length}/160</span>}
                </div>
                <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center h-[40px] rounded-xl border border-[#E4DED1] bg-[#FCFBF8] overflow-hidden focus-within:border-[#2F6F5E]">
                  <span className="h-full border-r border-[#ECE6DA] flex items-center justify-center text-[#2F6F5E]"><FileText size={14} /></span>
                  <textarea value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 160))} rows={1} placeholder="Tambahkan catatan bila diperlukan" className="w-full min-w-0 h-[22px] leading-[22px] px-2.5 bg-transparent outline-none resize-none overflow-hidden text-[11px] text-[#1B2A26] placeholder:text-[#AAA49A]" />
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={submit}
              disabled={tersimpan}
              aria-disabled={!formValid}
              className={`shrink-0 w-full h-[46px] rounded-xl bg-[#2F6F5E] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm active:opacity-90 ${formValid ? "" : "opacity-60"}`}
            >
              <Check size={15} /> {tersimpan ? "Menyimpan…" : jenisOperasi === "beli" ? "Simpan Pembelian" : jenisOperasi === "jual" ? "Simpan Penjualan" : "Simpan Transfer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const OPSI_FAB_TRANSAKSI = [
  {
    label: "Pemasukan",
    preset: { tipe: "masuk", metode: "Cash", judul: "Pemasukan" },
    warna: "#2F6F5E",
    bgIkon: "#EAF2EE",
    ikon: ArrowDownLeft,
  },
  {
    label: "Pengeluaran",
    preset: { tipe: "keluar", metode: "Cash", judul: "Pengeluaran" },
    warna: "#B5533C",
    bgIkon: "#F3E7E1",
    ikon: ShoppingBag,
  },
  {
    label: "Transfer & Kelola",
    labelPopup: "Tf & Kelola",
    preset: { tipe: "transfer", judul: "Transfer & Kelola" },
    warna: "#5B7B8C",
    bgIkon: "#EDF1F3",
    ikon: ArrowLeftRight,
  },
];

const OPSI_FAB_ASET = [
  { label: "Tambah Aset", preset: "tambah", warna: "#2F6F5E", ikon: Plus },
  { label: "Beli Aset", preset: "beli", warna: "#3C86B5", ikon: ArrowDownLeft },
  { label: "Jual Aset", preset: "jual", warna: "#B5533C", ikon: ArrowUpRight },
];

const OPSI_FAB_HUTANG = [
  { label: "Hutang", preset: "hutang", warna: "#B5533C", ikon: ArrowUpRight },
  { label: "Piutang", preset: "piutang", warna: "#2F6F5E", ikon: ArrowDownLeft },
];

// Posisi vertikal default FAB (jarak dari bawah, dalam px), dipakai konsisten di semua halaman.
const FAB_POSISI_DEFAULT = 96;

// Komponen Floating Action Button yang independen per halaman.
// Setiap halaman yang me-render <FabMenu /> otomatis mendapat instance
// (state posisi & buka/tutup) miliknya sendiri, karena state ini hidup selama
// komponen halaman tersebut ter-mount. Saat pindah halaman (unmount), state ini
// otomatis hilang; saat halaman dibuka lagi (mount ulang), state dimulai lagi
// dari posisi default. Pola ini yang harus dipakai untuk FAB di halaman-halaman
// baru nantinya: cukup render <FabMenu ... /> di dalam komponen halaman itu
// sendiri (bukan di komponen App yang dipakai bersama banyak halaman).
function FabMenu({ onPilih, opsi = OPSI_FAB_TRANSAKSI }) {
  const [buka, setBuka] = useState(false);
  const labelTerpanjang = Math.max(...opsi.map((item) => (item.labelPopup || item.label).length), 1);
  const lebarPopup = Math.min(168, Math.max(132, labelTerpanjang * 6.4 + 48));
  const [info, setInfo] = useState(null);
  // Selalu mulai dari posisi default setiap kali halaman ini dibuka (mount).
  // Sengaja tidak disimpan ke localStorage, supaya pergeseran tombol di satu
  // halaman tidak pernah "menular" ke halaman lain, dan supaya saat halaman
  // yang sama dibuka kembali, tombol selalu kembali ke posisi default.
  const [posisiY, setPosisiY] = useState(FAB_POSISI_DEFAULT);
  const draggingRef = useRef(false);
  const gerakRef = useRef(false);
  const mulaiRef = useRef({ y: 0, posisiY: FAB_POSISI_DEFAULT });

  const mulaiGeser = (e) => {
    draggingRef.current = true;
    gerakRef.current = false;
    mulaiRef.current = { y: e.clientY, posisiY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const saatGeser = (e) => {
    if (!draggingRef.current) return;
    const delta = e.clientY - mulaiRef.current.y;
    if (Math.abs(delta) > 6) gerakRef.current = true;
    const batasBawah = FAB_POSISI_DEFAULT;
    const batasAtas = (typeof window !== "undefined" ? window.innerHeight : 800) - 200;
    const baru = Math.max(batasBawah, Math.min(batasAtas, mulaiRef.current.posisiY - delta));
    setPosisiY(baru);
  };
  const selesaiGeser = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (gerakRef.current) {
      // Posisi baru hanya berlaku selama halaman ini masih terbuka (state lokal
      // in-memory). Sengaja tidak dipersist agar kembali ke default saat
      // halaman ini dibuka lagi di kemudian hari.
    } else {
      setInfo(null);
      setBuka((v) => !v);
    }
  };

  const pilih = (preset) => {
    setInfo(null);
    setBuka(false);
    onPilih(preset);
  };

  return (
    <>
      {buka && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setInfo(null);
            setBuka(false);
          }}
        />
      )}
      <div
        className="fixed right-4 z-20 flex flex-col items-end gap-2"
        style={{ bottom: posisiY, maxWidth: "calc(100vw - 32px)" }}
      >
        {buka && info && (
          <div
            className="min-h-10 px-3 rounded-xl bg-white/62 backdrop-blur-xl border border-white/75 text-[#1B2A26] text-[11px] leading-snug shadow-[0_8px_22px_rgba(27,42,38,0.14)] flex items-center justify-center text-center box-border"
            style={{ width: lebarPopup }}
          >
            Fitur {info} akan segera hadir.
          </div>
        )}
        {buka &&
          opsi.map(({ label, labelPopup, preset, warna, bgIkon, ikon: Ikon, nonaktif }) => {
            const teksPopup = labelPopup || label;
            return (
            <button
              key={label}
              onClick={() => (nonaktif ? setInfo(teksPopup) : pilih(preset))}
              aria-disabled={nonaktif || undefined}
              className={`h-10 box-border flex items-center justify-between gap-2 pl-3 pr-1.5 rounded-xl bg-white/62 backdrop-blur-xl border border-white/75 shadow-[0_8px_22px_rgba(27,42,38,0.14)] text-[12px] font-semibold text-[#1B2A26] text-right transition-all active:scale-[0.98] overflow-hidden ${
                nonaktif ? "opacity-55" : ""
              }`}
              style={{ width: lebarPopup }}
            >
              <span className="min-w-0 flex-1 truncate text-right leading-none">{teksPopup}</span>
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-[#CFE1D8]"
                style={{ color: "#236B54", backgroundColor: "rgba(234,242,238,0.9)" }}
              >
                <Ikon size={14} strokeWidth={1.9} />
              </span>
            </button>
            );
          })}
        <button
          onPointerDown={mulaiGeser}
          onPointerMove={saatGeser}
          onPointerUp={selesaiGeser}
          onPointerCancel={selesaiGeser}
          style={{ touchAction: "none", background: "#245F50" }}
          className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_12px_28px_rgba(35,107,84,0.34)] border border-white/30"
          aria-label={buka ? "Tutup menu cepat" : "Buka menu cepat"}
        >
          <Plus size={23} strokeWidth={2.2} className={`transition-transform duration-200 ${buka ? "rotate-45" : ""}`} />
        </button>
      </div>
    </>
  );
}

// ---------- NOTIFIKASI ----------
function HalamanNotifikasi({ items = [], onClose, onOpenRencana }) {
  const bukaItem = (item) => {
    onClose();
    onOpenRencana?.(item.bagian);
  };

  return (
    <section className="fixed inset-0 z-[70] bg-[#F1F4F2] flex justify-center">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col bg-[#F5F8F6]">
        <header className="shrink-0 px-4 py-4 border-b border-[#E1E7E3] bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-[#DFE6E2] text-[#1B2A26] flex items-center justify-center active:opacity-70"
              aria-label="Kembali"
            >
              <ArrowLeft size={17} strokeWidth={2} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] leading-tight font-semibold text-[#1B2A26]">Notifikasi</h1>
              <p className="mt-0.5 text-[10.5px] leading-snug text-[#7D877F]">{items.length ? `${items.length} hal perlu diperhatikan` : "Tidak ada hal mendesak"}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[#DCE6E1] bg-white text-[#2F6F5E]"><Check size={18} /></div>
              <h2 className="mt-3 text-[13px] font-semibold text-[#1B2A26]">Semua terkendali</h2>
              <p className="mt-1 text-[10.5px] text-[#818A85]">Belum ada jatuh tempo atau batas yang perlu ditindaklanjuti.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#DFE6E2] bg-white">
              {items.map((item, index) => {
                const bahaya = item.level === "bahaya";
                const peringatan = item.level === "peringatan";
                return (
                  <button key={item.id} type="button" onClick={() => bukaItem(item)} className={`grid w-full grid-cols-[34px_minmax(0,1fr)_16px] items-center gap-3 px-3.5 py-3 text-left ${index ? "border-t border-[#EDF0EE]" : ""}`}>
                    <span className={`grid h-[34px] w-[34px] place-items-center rounded-lg ${bahaya ? "bg-[#F8E9E5] text-[#B5533C]" : peringatan ? "bg-[#F7F0DF] text-[#986D25]" : "bg-[#EAF2EE] text-[#2F6F5E]"}`}>
                      {bahaya || peringatan ? <AlertTriangle size={15} /> : <Bell size={15} />}
                    </span>
                    <span className="min-w-0"><strong className="block text-[11.5px] font-semibold text-[#23312C]">{item.judul}</strong><small className="mt-0.5 block text-[9.5px] leading-relaxed text-[#78827D]">{item.detail}</small></span>
                    <ChevronRight size={15} className="text-[#A3AAA6]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- APP ----------
export default function BukuKasApp() {
  const [tab, setTab] = useState("beranda");
  const [transaksi, setTransaksi] = useState(INITIAL_TRANSAKSI);
  const [hutang, setHutang] = useState([]);
  const [aset, setAset] = useState([]);
  const [anggaran, setAnggaran] = useState([]);
  const [targetMenabung, setTargetMenabung] = useState([]);
  const [cicilan, setCicilan] = useState([]);
  const [rencanaSection, setRencanaSection] = useState("anggaran");
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [notifikasiOpen, setNotifikasiOpen] = useState(false);
  const [presetForm, setPresetForm] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [uiPreferensi, setUiPreferensi] = useState(() => {
    try {
      const tersimpan = window.localStorage.getItem("buku-kas-ui-preferensi");
      return tersimpan ? { ...UI_PREFERENSI_DEFAULT, ...JSON.parse(tersimpan) } : UI_PREFERENSI_DEFAULT;
    } catch {
      return UI_PREFERENSI_DEFAULT;
    }
  });
  // Sinyal satu-arah ke tab Transaksi: dipakai saat Transfer dipilih dari FAB Beranda
  // agar halaman penuh "Transfer & Kelola" langsung terbuka di sana.
  const [transaksiModeAwal, setTransaksiModeAwal] = useState(null);
  // true saat halaman penuh Tambah Pemasukan/Pengeluaran aktif di tab Transaksi —
  // dipakai untuk menyembunyikan header global (logo Buku Kas) karena halaman itu
  // sudah punya header judul sendiri.
  const [transaksiHeaderTersembunyi, setTransaksiHeaderTersembunyi] = useState(false);
  // true saat halaman penuh Edit Hutang/Piutang aktif di tab Hutang, atau halaman
  // penuh Edit Aset aktif di tab Aset — dipakai untuk menyembunyikan header global
  // yang sama, konsisten dengan Edit Transaksi.
  const [rencanaHeaderTersembunyi, setRencanaHeaderTersembunyi] = useState(false);
  const [asetHeaderTersembunyi, setAsetHeaderTersembunyi] = useState(false);
  const [akunHeaderTersembunyi, setAkunHeaderTersembunyi] = useState(false);

  const bukaRencana = (bagian = "anggaran") => {
    setRencanaSection(bagian);
    setTab("rencana");
  };

  const navigasiKe = (tujuan) => {
    if (["hutang", "cicilan", "target", "anggaran"].includes(tujuan)) {
      bukaRencana(tujuan);
      return;
    }
    setTab(tujuan);
  };

  const ubahUiPreferensi = (perubahan) => {
    setUiPreferensi((sebelumnya) => ({ ...sebelumnya, ...perubahan }));
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("buku-kas-ui-preferensi", JSON.stringify(uiPreferensi));
    } catch (error) {
      console.warn("Preferensi tampilan tidak dapat disimpan:", error);
    }
  }, [uiPreferensi]);

  // Dipakai bersama oleh FAB (+) di Beranda maupun di Transaksi. Transfer, Tambah
  // Pemasukan, dan Tambah Pengeluaran semuanya diarahkan ke halaman penuh di tab
  // Transaksi (bukan popup lagi) — konsisten dengan pola Data Aset.
  const arahkanKeTransaksi = (permintaan) => {
    // Kirim mode terlebih dahulu lalu pindahkan tab dalam event yang sama. Saat
    // komponen Transaksi di-mount, ia langsung menerima mode awal tersebut.
    // Tidak memakai requestAnimationFrame karena pada sebagian browser Android
    // callback dapat berjalan sebelum commit React selesai dan sinyal terlewat.
    setTransaksiModeAwal({ ...permintaan, requestId: `${Date.now()}-${Math.random()}` });
    setTab("transaksi");
  };

  const tandaiModeTransaksiTerpakai = (requestId) => {
    setTransaksiModeAwal((aktif) =>
      aktif?.requestId === requestId ? null : aktif
    );
  };

  const bukaFormFab = (preset) => {
    if (preset?.tipe === "transfer") {
      setTransferOpen(true);
    } else if (preset?.tipe === "masuk" || preset?.tipe === "keluar") {
      arahkanKeTransaksi({ mode: "tambah", preset });
    } else {
      setPresetForm(preset);
      setFormOpen(true);
    }
  };

  const bukaDetailDariAktivitas = (item) => {
    if (!item) return;
    arahkanKeTransaksi({ mode: "detail", item });
  };

  useEffect(() => {
    try {
      const bacaDaftar = (key) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const data = JSON.parse(raw);
          return Array.isArray(data)
            ? data.filter((item) => item && typeof item === "object" && !Array.isArray(item))
            : null;
        } catch {
          return null;
        }
      };
      const saved = bacaDaftar("buku-kas-transaksi");
      if (saved) setTransaksi(saved);
      const savedHutang = bacaDaftar("buku-kas-hutang");
      if (savedHutang) setHutang(savedHutang);
      const savedAset = bacaDaftar("buku-kas-aset");
      if (savedAset) setAset(savedAset);
      const savedAnggaran = bacaDaftar("buku-kas-anggaran");
      if (savedAnggaran) setAnggaran(savedAnggaran);
      const savedTarget = bacaDaftar("buku-kas-target-menabung");
      if (savedTarget) setTargetMenabung(savedTarget);
      const savedCicilan = bacaDaftar("buku-kas-cicilan");
      if (savedCicilan) setCicilan(savedCicilan);
    } catch (e) {
      // belum ada data tersimpan, pakai data awal
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("buku-kas-transaksi", JSON.stringify(transaksi));
    } catch (e) {
      console.error("Gagal menyimpan data:", e);
    }
  }, [transaksi, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("buku-kas-hutang", JSON.stringify(hutang));
    } catch (e) {
      console.error("Gagal menyimpan data hutang:", e);
    }
  }, [hutang, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("buku-kas-aset", JSON.stringify(aset));
    } catch (e) {
      console.error("Gagal menyimpan data aset:", e);
    }
  }, [aset, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("buku-kas-anggaran", JSON.stringify(anggaran));
      localStorage.setItem("buku-kas-target-menabung", JSON.stringify(targetMenabung));
      localStorage.setItem("buku-kas-cicilan", JSON.stringify(cicilan));
    } catch (e) {
      console.error("Gagal menyimpan data rencana:", e);
    }
  }, [anggaran, targetMenabung, cicilan, loaded]);

  // status transaksi ditinjau ulang setiap hari berganti
  const hariIni = useHariIni();

  // Eksekusi satu kali untuk transaksi terjadwal yang melibatkan aset/rekening bernama.
  // Akun virtual dihitung langsung dari ledger, sedangkan aset bernama perlu diperbarui
  // ketika tanggal efektif tiba. Flag efekAkunDiterapkan mencegah mutasi ganda.
  useEffect(() => {
    if (!loaded) return;
    const due = transaksi.filter((t) => t.terjadwal === true && !isTanggalTerjadwal(t.tgl) && !t.efekAkunDiterapkan && t.tipe !== "biaya-transfer");
    if (!due.length) return;
    const perubahan = new Map();
    const berhasil = new Set();
    const menunggu = new Set();
    const nilaiAset = (id) => Number(aset.find((a) => a.id === id)?.nilai || 0) + Number(perubahan.get(id) || 0);
    const tambahPerubahan = (id, nilai) => perubahan.set(id, Number(perubahan.get(id) || 0) + nilai);

    for (const t of due) {
      if (t.tipe === "transfer" && t.transferInfo) {
        const { sumberId, tujuanId, nominal, biayaAdmin } = t.transferInfo;
        const totalKeluar = Number(nominal || 0) + Number(biayaAdmin || 0);
        if (!AKUN_VIRTUAL_TRANSAKSI.includes(sumberId) && nilaiAset(sumberId) < totalKeluar) { menunggu.add(t.id); continue; }
        if (!AKUN_VIRTUAL_TRANSAKSI.includes(sumberId)) tambahPerubahan(sumberId, -totalKeluar);
        if (!AKUN_VIRTUAL_TRANSAKSI.includes(tujuanId)) tambahPerubahan(tujuanId, Number(nominal || 0));
        berhasil.add(t.id);
      } else if (t.akunId && !AKUN_VIRTUAL_TRANSAKSI.includes(t.akunId)) {
        const dampak = Number(t.jumlah || 0);
        if (dampak < 0 && nilaiAset(t.akunId) + dampak < 0) { menunggu.add(t.id); continue; }
        tambahPerubahan(t.akunId, dampak);
        berhasil.add(t.id);
      }
    }

    if (perubahan.size) setAset((prev) => prev.map((a) => perubahan.has(a.id) ? { ...a, nilai: Number(a.nilai || 0) + perubahan.get(a.id) } : a));
    setTransaksi((prev) => prev.map((t) => {
      if (berhasil.has(t.id)) return { ...t, efekAkunDiterapkan: true, menungguSaldoManual: false, updatedAt: new Date().toISOString() };
      if (menunggu.has(t.id)) return t.menungguSaldoManual ? t : { ...t, menungguSaldoManual: true };
      if (t.tipe === "biaya-transfer" && t.transferId) {
        const induk = prev.find((x) => x.tipe === "transfer" && x.transferId === t.transferId);
        if (induk && berhasil.has(induk.id)) return { ...t, efekAkunDiterapkan: true, menungguSaldoManual: false };
        if (induk && menunggu.has(induk.id)) return t.menungguSaldoManual ? t : { ...t, menungguSaldoManual: true };
      }
      return t;
    }));
  }, [loaded, hariIni, transaksi, aset]);
  // hanya transaksi berstatus Selesai yang mempengaruhi saldo & seluruh perhitungan
  const transaksiMenungguSaldo = useMemo(() => hitungTransaksiMenungguSaldo(transaksi), [transaksi, hariIni]);
  const transaksiSaldoSnapshot = useMemo(
    () => hitungSaldoSebelumSesudah(transaksi, transaksiMenungguSaldo),
    [transaksi, hariIni, transaksiMenungguSaldo]
  );
  const transaksiEfektif = useMemo(
    () => transaksiEfektifDari(transaksi).filter((t) => !transaksiMenungguSaldo.has(t) && !t.menungguSaldoManual),
    [transaksi, hariIni, transaksiMenungguSaldo]
  );

  // Transfer pokok (tipe "transfer") hanya memindahkan dana antar akun dan bukan
  // pemasukan/pengeluaran operasional. Karena itu transfer pokok dikecualikan dari statistik.
  // Biaya admin dicatat sebagai baris "biaya-transfer" terpisah sehingga tetap masuk sebagai
  // pengeluaran dan mengurangi saldo akun asal tepat satu kali.
  const transaksiOperasional = transaksiOperasionalDari(transaksiEfektif);
  const pemasukan = transaksiOperasional.filter((t) => t.jumlah > 0).reduce((a, t) => a + t.jumlah, 0);
  const pengeluaran = Math.abs(transaksiOperasional.filter((t) => t.jumlah < 0).reduce((a, t) => a + t.jumlah, 0));
  // Saldo Kas/Bank/E-Wallet = akumulasi seluruh baris transaksi yang terikat ke akun
  // virtual tsb (akunId kosong dianggap Kas, demi kompatibilitas data lama), DITAMBAH
  // efek transfer (dibaca dari transferInfo) yang melibatkan akun virtual tsb sebagai
  // sumber/tujuan. Transaksi yang akunId-nya menunjuk ke aset bernama (mis. Tabungan/
  // Investasi/rekening lama) sudah dihitung langsung di nilai aset tsb (lihat
  // terapkanEfekAkun/transferDana), sehingga tidak boleh dihitung dobel di sini.
  const hitungSaldoVirtual = (virtualId) => {
    let total = 0;
    for (const t of transaksiEfektif) {
      if (t.tipe === "transfer" && t.transferInfo) {
        const { sumberId, tujuanId, nominal, biayaAdmin } = t.transferInfo;
        if (sumberId === virtualId) total -= nominal + (biayaAdmin > 0 ? biayaAdmin : 0);
        if (tujuanId === virtualId) total += nominal;
        continue;
      }
      // Baris "Biaya Admin Transfer" sudah tercakup lewat transferInfo.biayaAdmin di atas.
      if (t.tipe === "biaya-transfer") continue;
      const akun = t.akunId || ID_SALDO_TRANSAKSI;
      if (akun === virtualId) total += t.jumlah;
    }
    return total;
  };
  const saldo = hitungSaldoVirtual(ID_SALDO_TRANSAKSI);
  const saldoBank = hitungSaldoVirtual(ID_BANK_TRANSAKSI);
  const saldoEwallet = hitungSaldoVirtual(ID_EWALLET_TRANSAKSI);
  const transaksiUntukStatistik = useMemo(() => transaksiOperasionalDari(transaksiEfektif), [transaksiEfektif]);
  const kategoriData = hitungKategori(transaksiUntukStatistik);
  const trenData = hitungTren(transaksiUntukStatistik);

  const tambahTransaksi = (data) => {
    const kini = Date.now();
    const transaksiBaru = {
      ...data,
      id: data?.id || buatId(),
      createdAt: data?.createdAt || new Date(kini).toISOString(),
      updatedAt: new Date(kini).toISOString(),
    };
    const fingerprint = [transaksiBaru.tipe || "umum", transaksiBaru.jumlah, transaksiBaru.akunId || "", transaksiBaru.tgl || "", transaksiBaru.nama || "", transaksiBaru.relasiId || "", transaksiBaru.transferId || ""].join("|");
    setTransaksi((prev) => {
      if (prev.some((item) => item.id === transaksiBaru.id)) return prev;
      const duplikatCepat = prev.some((item) => {
        const waktu = Date.parse(item.createdAt || "") || 0;
        const fp = [item.tipe || "umum", item.jumlah, item.akunId || "", item.tgl || "", item.nama || "", item.relasiId || "", item.transferId || ""].join("|");
        return fp === fingerprint && kini - waktu < 3000;
      });
      if (duplikatCepat) return prev;
      return [transaksiBaru, ...prev];
    });
    return transaksiBaru.id;
  };
  const hapusTransaksi = (index) => setTransaksi((prev) => prev.filter((_, i) => i !== index));
  const editTransaksi = (index, data) => setTransaksi((prev) => prev.map((t, i) => (i === index ? { ...data, id: t.id, createdAt: t.createdAt || data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() } : t)));

  // Pemasukan/Pengeluaran biasa: bila akunId menunjuk ke aset bernama (bukan akun virtual
  // Kas/Bank/E-Wallet), nilai aset tsb harus ikut disesuaikan — konsisten dengan cara
  // Transfer & Kelola memperlakukan saldo per akun. arah: 1 = terapkan, -1 = batalkan.
  const terapkanEfekAkun = (data, arah) => {
    if (isTanggalTerjadwal(data?.tgl)) return;
    if (data?.terjadwal === true && data?.efekAkunDiterapkan !== true) return;
    if (data?.akunId && !AKUN_VIRTUAL_TRANSAKSI.includes(data.akunId)) {
      setAset((prev) => prev.map((a) => (a.id === data.akunId ? { ...a, nilai: Number(a.nilai || 0) + arah * Number(data.jumlah || 0) } : a)));
    }
  };
  const simpanTransaksiBaru = (data) => {
    const memakaiAsetBernama = data?.akunId && !AKUN_VIRTUAL_TRANSAKSI.includes(data.akunId);
    const efektifSekarang = !isTanggalTerjadwal(data?.tgl);
    const dataFinal = { ...data, efekAkunDiterapkan: memakaiAsetBernama && efektifSekarang ? true : data?.efekAkunDiterapkan };
    terapkanEfekAkun(dataFinal, 1);
    tambahTransaksi(dataFinal);
  };
  const perbaruiTransaksiAkun = (index, data) => {
    const lama = transaksi[index];
    terapkanEfekAkun(lama, -1);
    const memakaiAsetBernama = data?.akunId && !AKUN_VIRTUAL_TRANSAKSI.includes(data.akunId);
    const efektifSekarang = !isTanggalTerjadwal(data?.tgl);
    const dataFinal = { ...data, efekAkunDiterapkan: memakaiAsetBernama && efektifSekarang ? true : false, menungguSaldoManual: false };
    terapkanEfekAkun(dataFinal, 1);
    editTransaksi(index, dataFinal);
  };
  const hapusTransaksiAkun = (index) => {
    terapkanEfekAkun(transaksi[index], -1);
    hapusTransaksi(index);
  };

  // Transfer: kurangi saldo aset sumber, tambah saldo aset tujuan. Jika biaya admin > 0,
  // catat sebagai transaksi pengeluaran terpisah (kategori "Biaya Admin") agar masuk
  // ke statistik pengeluaran, sementara nominal transfer sendiri tidak dihitung sebagai
  // pemasukan/pengeluaran (lihat "pemasukan"/"pengeluaran" di atas).
  // Bila sumber/tujuan adalah akun virtual (Kas/Bank/E-Wallet), saldonya otomatis
  // terhitung lewat hitungSaldoVirtual (dari transferInfo) — tidak perlu diubah manual
  // di sini. Bila sumber/tujuan adalah aset bernama (mis. rekening/Tabungan/Investasi),
  // nilai aset tsb harus disesuaikan langsung.
  const transferDana = ({ nama, sumberId, sumberNama, tujuanId, tujuanNama, nominal, biayaAdmin, tanggal, catatan }) => {
    const transferTerjadwal = isTanggalTerjadwal(tanggal);
    if (!transferTerjadwal && !AKUN_VIRTUAL_TRANSAKSI.includes(sumberId)) {
      setAset((prev) => prev.map((a) => (a.id === sumberId ? { ...a, nilai: Number(a.nilai || 0) - nominal - (biayaAdmin > 0 ? biayaAdmin : 0) } : a)));
    }
    if (!transferTerjadwal && !AKUN_VIRTUAL_TRANSAKSI.includes(tujuanId)) {
      setAset((prev) => prev.map((a) => (a.id === tujuanId ? { ...a, nilai: Number(a.nilai || 0) + nominal } : a)));
    }
    const transferId = buatId();
    // Bila pengguna tidak mengisi nama, buat nama otomatis sesuai format standar (perilaku lama).
    const namaFinal = nama && nama.trim() ? nama.trim() : `Transfer: ${sumberNama} → ${tujuanNama}`;
    // Bila pengguna tidak mengisi catatan, buat catatan otomatis sesuai format standar.
    const catatanFinal = catatan && catatan.trim() ? catatan : `Transfer ${rupiah(nominal)} dari ${sumberNama} ke ${tujuanNama}.`;
    tambahTransaksi({
      id: `transfer-${transferId}`,
      nama: namaFinal,
      tgl: tanggal,
      kat: "Transfer",
      metode: "Transfer",
      catatan: catatanFinal,
      jumlah: 0,
      tipe: "transfer",
      transferId,
      transferInfo: { dari: sumberNama, ke: tujuanNama, sumberId, tujuanId, nominal, biayaAdmin },
      terjadwal: transferTerjadwal,
      efekAkunDiterapkan: !transferTerjadwal,
    });

    if (biayaAdmin > 0) {
      tambahTransaksi({
        id: `biaya-transfer-${transferId}`,
        nama: "Biaya Admin Transfer",
        tgl: tanggal,
        kat: "Biaya Admin",
        metode: "Transfer",
        akunId: sumberId,
        catatan: `Biaya Admin Transfer dari ${sumberNama} ke ${tujuanNama} senilai ${rupiah(nominal)}.`,
        jumlah: -biayaAdmin,
        tipe: "biaya-transfer",
        transferId,
        terjadwal: transferTerjadwal,
      });
    }
  };

  // Hapus transfer: batalkan perubahan saldo aset sumber/tujuan bernama, lalu hapus baris
  // transfer & baris biaya admin otomatis yang terkait (ditandai transferId yang sama).
  // Saldo akun virtual (Kas/Bank/E-Wallet) otomatis ikut terkoreksi karena dihitung
  // langsung dari daftar transaksi yang tersisa.
  const hapusTransferTransaksi = (transferId) => {
    const utama = transaksi.find((t) => t.transferId === transferId && t.tipe === "transfer");
    if (utama?.transferInfo) {
      const { sumberId, tujuanId, nominal, biayaAdmin } = utama.transferInfo;
      const efekSudahDiterapkan = utama.efekAkunDiterapkan === true || (!utama.terjadwal && !isTanggalTerjadwal(utama.tgl));
      if (efekSudahDiterapkan && !AKUN_VIRTUAL_TRANSAKSI.includes(sumberId)) {
        setAset((prev) => prev.map((a) => (a.id === sumberId ? { ...a, nilai: a.nilai + nominal + (biayaAdmin > 0 ? biayaAdmin : 0) } : a)));
      }
      if (efekSudahDiterapkan && !AKUN_VIRTUAL_TRANSAKSI.includes(tujuanId)) {
        setAset((prev) => prev.map((a) => (a.id === tujuanId ? { ...a, nilai: Number(a.nilai || 0) - nominal } : a)));
      }
    }
    setTransaksi((prev) => prev.filter((t) => t.transferId !== transferId));
  };

  const akunSaldo = useMemo(() => [
    { id: ID_SALDO_TRANSAKSI, nama: "Kas", saldo },
    { id: ID_BANK_TRANSAKSI, nama: "Bank", saldo: saldoBank },
    { id: ID_EWALLET_TRANSAKSI, nama: "E-Wallet", saldo: saldoEwallet },
  ], [saldo, saldoBank, saldoEwallet]);

  const saldoPerencanaan = useMemo(() => {
    const asetLikuid = aset
      .filter((item) => ["Kas & Bank", "E-Wallet", "Tabungan"].includes(item.kategori))
      .reduce((total, item) => total + Math.max(0, Number(item.nilai) || 0), 0);
    return Math.max(0, saldo + saldoBank + saldoEwallet + asetLikuid);
  }, [aset, saldo, saldoBank, saldoEwallet]);

  const simpanAnggaran = (data) => {
    const sekarang = new Date().toISOString();
    setAnggaran((prev) => {
      const id = data.id || buatId();
      if (prev.some((item) => item.kategori === data.kategori && item.id !== id)) return prev;
      const record = {
        ...data,
        id,
        createdAt: data.createdAt || sekarang,
        updatedAt: sekarang,
      };
      return prev.some((item) => item.id === id)
        ? prev.map((item) => item.id === id ? record : item)
        : [...prev, record];
    });
  };

  const hapusAnggaran = (id) => setAnggaran((prev) => prev.filter((item) => item.id !== id));

  const simpanTargetMenabung = (data) => {
    const sekarang = new Date().toISOString();
    setTargetMenabung((prev) => {
      const id = data.id || buatId();
      const record = {
        ...data,
        id,
        target: Math.max(0, Number(data.target) || 0),
        terkumpul: Math.max(0, Number(data.terkumpul) || 0),
        createdAt: data.createdAt || sekarang,
        updatedAt: sekarang,
      };
      return prev.some((item) => item.id === id)
        ? prev.map((item) => item.id === id ? record : item)
        : [...prev, record];
    });
  };

  const hapusTargetMenabung = (id) => setTargetMenabung((prev) => prev.filter((item) => item.id !== id));

  const ubahDanaTarget = (id, delta) => {
    const perubahan = Number(delta) || 0;
    if (!perubahan) return;
    setTargetMenabung((prev) => {
      const totalAlokasi = totalAlokasiTarget(prev);
      const saldoBebas = Math.max(0, saldoPerencanaan - totalAlokasi);
      if (perubahan > 0 && perubahan > saldoBebas) return prev;
      return prev.map((item) => {
        if (item.id !== id) return item;
        const berikutnya = Number(item.terkumpul || 0) + perubahan;
        if (berikutnya < 0 || berikutnya > Number(item.target || 0)) return item;
        return { ...item, terkumpul: berikutnya, updatedAt: new Date().toISOString() };
      });
    });
  };

  const simpanCicilan = (data) => {
    const sekarang = new Date().toISOString();
    setCicilan((prev) => {
      const id = data.id || buatId();
      const record = {
        ...data,
        id,
        total: Math.max(0, Number(data.total) || 0),
        tenor: Math.max(1, Number(data.tenor) || 1),
        pembayaran: Array.isArray(data.pembayaran) ? data.pembayaran : [],
        createdAt: data.createdAt || sekarang,
        updatedAt: sekarang,
      };
      return prev.some((item) => item.id === id)
        ? prev.map((item) => item.id === id ? record : item)
        : [...prev, record];
    });
  };

  const hapusCicilan = (id) => {
    const target = cicilan.find((item) => item.id === id);
    if (!target || totalTerbayarCicilan(target) > 0) return;
    setCicilan((prev) => prev.filter((item) => item.id !== id));
  };

  const bayarCicilan = (id, dataBayar) => {
    const target = cicilan.find((item) => item.id === id);
    if (!target) return false;
    const info = ringkasanCicilan(target);
    const jumlah = Number(dataBayar?.jumlah) || 0;
    const biaya = Math.max(0, Number(dataBayar?.biaya) || 0);
    const akunId = dataBayar?.akunId || ID_SALDO_TRANSAKSI;
    const sumber = akunSaldo.find((item) => item.id === akunId);
    if (jumlah <= 0 || jumlah > info.sisa || jumlah + biaya > Number(sumber?.saldo || 0)) return false;

    const pembayaranId = buatId();
    const tanggal = formatTglDariInput(todayInput());
    setCicilan((prev) => prev.map((item) => item.id === id ? {
      ...item,
      pembayaran: [...(item.pembayaran || []), { id: pembayaranId, tanggal, jumlah, biaya, akunId }],
      updatedAt: new Date().toISOString(),
    } : item));

    tambahTransaksi({
      id: `cicilan-${pembayaranId}`,
      nama: `Bayar cicilan - ${target.nama}`,
      tgl: tanggal,
      kat: "Cicilan",
      metode: akunVirtualLabel(akunId),
      akunId,
      catatan: "Pembayaran pokok cicilan; mengurangi kewajiban dan bukan pengeluaran operasional.",
      jumlah: -Math.abs(jumlah),
      tipe: "pembayaran-cicilan",
      relasiId: target.id,
    });

    if (biaya > 0) {
      tambahTransaksi({
        id: `biaya-cicilan-${pembayaranId}`,
        nama: `Biaya cicilan - ${target.nama}`,
        tgl: tanggal,
        kat: "Biaya Cicilan",
        metode: akunVirtualLabel(akunId),
        akunId,
        catatan: "Biaya atau denda cicilan.",
        jumlah: -Math.abs(biaya),
        tipe: "biaya-cicilan",
        relasiId: target.id,
      });
    }
    return true;
  };

  const buatMutasiRelasi = (data) => {
    if (!data.alurDana || isTanggalTerjadwal(data.tanggal) || data.alurDana === "catat-lama") return null;
    const hutangBaru = data.jenis === "hutang";
    return {
      id: `relasi-awal-${data.id}`,
      nama: hutangBaru ? `Pencairan hutang — ${data.nama}` : `Pemberian piutang — ${data.nama}`,
      tgl: data.tanggal,
      kat: hutangBaru ? "Hutang" : "Piutang",
      metode: akunVirtualLabel(data.akunId),
      akunId: data.akunId || ID_SALDO_TRANSAKSI,
      catatan: hutangBaru ? "Dana pinjaman diterima; bukan pemasukan operasional." : "Dana dipinjamkan; berubah menjadi aset piutang.",
      jumlah: hutangBaru ? Math.abs(data.jumlah) : -Math.abs(data.jumlah),
      tipe: hutangBaru ? "pencairan-hutang" : "pemberian-piutang",
      relasiId: data.id,
      terjadwal: false,
    };
  };

  const tambahHutang = (data) => {
    const mutasi = buatMutasiRelasi(data);
    const dataFinal = { ...data, efekDanaDiterapkan: Boolean(mutasi) };
    setHutang((prev) => prev.some((h) => h.id === data.id) ? prev : [...prev, dataFinal]);
    if (mutasi) tambahTransaksi(mutasi);
  };

  useEffect(() => {
    if (!loaded) return;
    const kandidat = hutang.filter((h) => h.alurDana && h.alurDana !== "catat-lama" && !isTanggalTerjadwal(h.tanggal) && !h.efekDanaDiterapkan);
    if (!kandidat.length) return;
    for (const item of kandidat) {
      if (transaksi.some((t) => t.id === `relasi-awal-${item.id}`)) {
        setHutang((prev) => prev.map((h) => h.id === item.id ? { ...h, efekDanaDiterapkan: true, menungguSaldo: false } : h));
        continue;
      }
      if (item.jenis === "piutang") {
        const sumber = akunSaldo.find((a) => a.id === item.akunId);
        if (Number(sumber?.saldo || 0) < Number(item.jumlah || 0)) {
          if (!item.menungguSaldo) setHutang((prev) => prev.map((h) => h.id === item.id ? { ...h, menungguSaldo: true } : h));
          continue;
        }
      }
      const mutasi = buatMutasiRelasi(item);
      if (mutasi) {
        tambahTransaksi(mutasi);
        setHutang((prev) => prev.map((h) => h.id === item.id ? { ...h, efekDanaDiterapkan: true, menungguSaldo: false, updatedAt: new Date().toISOString() } : h));
      }
    }
  }, [loaded, hariIni, hutang, transaksi, saldo, saldoBank, saldoEwallet]);

  const editHutang = (data) => {
    const lama = hutang.find((h) => h.id === data.id);
    if (!lama) return;
    const mutasiBaru = buatMutasiRelasi(data);
    const dataFinal = { ...data, efekDanaDiterapkan: Boolean(mutasiBaru), menungguSaldo: false };
    setHutang((prev) => prev.map((h) => (h.id === data.id ? dataFinal : h)));
    setTransaksi((prev) => {
      const tanpaMutasiLama = prev.filter((t) => !(t.relasiId === data.id && ["pencairan-hutang", "pemberian-piutang"].includes(t.tipe)));
      return mutasiBaru ? [{ ...mutasiBaru, createdAt: lama.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }, ...tanpaMutasiLama] : tanpaMutasiLama;
    });
  };

  const hapusHutang = (id) => {
    const target = hutang.find((h) => h.id === id);
    if (Number(target?.terbayar || 0) > 0) return;
    setHutang((prev) => prev.filter((h) => h.id !== id));
    setTransaksi((prev) => prev.filter((t) => t.relasiId !== id));
  };

  const bayarHutang = (id, dataBayar) => {
    const target = hutang.find((h) => h.id === id);
    if (!target) return;
    if (["Terjadwal", "Hangus"].includes(statusHutang(target).status)) return;
    const { jumlah: pokok, biaya = 0, akunId = ID_SALDO_TRANSAKSI } = dataBayar || {};
    const nilaiPokok = Number(pokok) || 0;
    if (nilaiPokok <= 0 || nilaiPokok > statusHutang(target).sisa) return;
    const tglHariIni = formatTglDariInput(todayInput());
    const pembayaranId = buatId();
    setHutang((prev) => prev.map((h) => h.id === id ? {
      ...h,
      terbayar: Number(h.terbayar || 0) + nilaiPokok,
      pembayaran: [...(h.pembayaran || []), { id: pembayaranId, tanggal: tglHariIni, jumlah: nilaiPokok, biaya, akunId }],
      akunPembayaranTerakhir: akunId,
      updatedAt: new Date().toISOString(),
    } : h));

    tambahTransaksi({
      id: `bayar-${pembayaranId}`,
      nama: `${target.jenis === "piutang" ? "Terima piutang" : "Bayar pokok hutang"} — ${target.nama}`,
      tgl: tglHariIni,
      kat: target.jenis === "piutang" ? "Piutang" : "Hutang",
      metode: akunVirtualLabel(akunId),
      akunId,
      catatan: target.jenis === "piutang" ? "Penerimaan piutang; bukan pemasukan baru." : "Pembayaran pokok; bukan pengeluaran operasional.",
      jumlah: target.jenis === "piutang" ? Math.abs(nilaiPokok) : -Math.abs(nilaiPokok),
      tipe: target.jenis === "piutang" ? "pembayaran-piutang" : "pembayaran-hutang",
      relasiId: target.id,
    });
    if (target.jenis === "hutang" && Number(biaya) > 0) {
      tambahTransaksi({
        id: `biaya-hutang-${pembayaranId}`,
        nama: `Bunga / biaya hutang — ${target.nama}`,
        tgl: tglHariIni,
        kat: "Biaya Hutang",
        metode: akunVirtualLabel(akunId),
        akunId,
        catatan: "Bunga, denda, atau biaya pinjaman.",
        jumlah: -Math.abs(Number(biaya)),
        tipe: "biaya-hutang",
        relasiId: target.id,
      });
    }
  };

  const totalHutangSisa = hutang
    .filter((h) => {
      if (h.jenis !== "hutang") return false;
      const status = statusHutang(h).status;
      return status !== "Terjadwal" && status !== "Lunas";
    })
    .reduce((a, h) => a + statusHutang(h).sisa, 0);

  const totalCicilanSisa = totalSisaCicilan(cicilan);
  const totalKewajibanSisa = totalHutangSisa + totalCicilanSisa;
  const notifikasiRencana = useMemo(() => buatNotifikasiRencana({
    cicilan,
    targetMenabung,
    anggaran,
    transaksi: transaksiUntukStatistik,
    saldoPerencanaan,
    sekarang: new Date(),
  }), [cicilan, targetMenabung, anggaran, transaksiUntukStatistik, saldoPerencanaan, hariIni]);

  const tambahAset = (data) => setAset((prev) => [...prev, data]);
  const editAset = (data) => setAset((prev) => prev.map((a) => (a.id === data.id ? data : a)));
  const hapusAset = (id) => setAset((prev) => prev.filter((a) => a.id !== id));

  const restoreSemuaData = (data) => {
    if (Array.isArray(data.transaksi)) setTransaksi(data.transaksi);
    if (Array.isArray(data.hutang)) setHutang(data.hutang);
    if (Array.isArray(data.aset)) setAset(data.aset);
    setAnggaran(Array.isArray(data.anggaran) ? data.anggaran : []);
    setTargetMenabung(Array.isArray(data.targetMenabung) ? data.targetMenabung : []);
    setCicilan(Array.isArray(data.cicilan) ? data.cicilan : []);
    if (data.snapshotAsetBulanan && typeof data.snapshotAsetBulanan === "object") simpanSnapshotAsetBulanan(data.snapshotAsetBulanan);
  };

  const NAV = [
    { id: "beranda", label: "Beranda", icon: "home" },
    { id: "transaksi", label: "Transaksi", icon: "transaction" },
    { id: "rencana", label: "Rencana", icon: "planning" },
    { id: "aset", label: "Aset", icon: "asset" },
    { id: "lainnya", label: "Akun", icon: "profile" },
  ];

  const JUDUL_HALAMAN = {
    transaksi: "Transaksi",
    rencana: "Rencana Keuangan",
    aset: "Aset",
    lainnya: "Akun",
  };

  return (
    <div
      className="app-viewport w-full bg-[#F1F4F2] flex justify-center"
      data-font-size={uiPreferensi.ukuran}
      data-font-family={uiPreferensi.font}
      style={{
        "--app-font-family": (OPSI_FONT_APLIKASI.find((item) => item.id === uiPreferensi.font) || OPSI_FONT_APLIKASI[0]).css,
        "--app-text-adjust": SKALA_FONT_APLIKASI[uiPreferensi.ukuran] || SKALA_FONT_APLIKASI.normal,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Poppins:wght@400;500;600;700&display=swap');
        :root {
          --ui-green-900:#183E34; --ui-green-800:#225C4C; --ui-green-700:#2F6F5E;
          --ui-green-600:#3D806D; --ui-green-100:#EAF2EE; --ui-ink:#1B2A26;
          --ui-muted:#817D74; --ui-line:#E1E8E4; --ui-paper:#FFFFFF; --ui-bg:#EEF3F0;
          --ui-danger:#B5533C; --ui-blue:#4E7185; --ui-gold:#C99337;
          --ui-border:#E1E8E4; --ui-shadow-soft:0 2px 8px rgba(35,62,52,.04);
          --ui-radius-card:8px; --ui-radius-control:8px; --ui-shadow:0 3px 12px rgba(35,62,52,.055); --ui-page-pad:clamp(7px,2.4vw,12px); --ui-section-gap:clamp(9px,2.8vw,13px);
        }
        * { box-sizing:border-box; font-family:var(--app-font-family,'Inter',sans-serif); }
        .app-shell * { letter-spacing:0 !important; }
        html,body,#root { margin:0; min-height:100%; background:var(--ui-bg); color:var(--ui-ink); }
        body { min-width:320px; overflow-x:hidden; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
        button,input,select,textarea { font:inherit; }
        button { -webkit-tap-highlight-color:transparent; }
        button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible {
          outline:2px solid rgba(47,111,94,.35); outline-offset:2px;
        }
        @media print { body *{visibility:hidden} #area-laporan,#area-laporan *{visibility:visible} #area-laporan{position:absolute;top:0;left:0;width:100%;border:0} }

        .app-viewport { min-height:100dvh; background:var(--ui-bg) !important; -webkit-text-size-adjust:var(--app-text-adjust,100%); text-size-adjust:var(--app-text-adjust,100%); }
        .app-shell { width:100%; max-width:480px; height:100dvh; min-height:100dvh; overflow:hidden; display:flex; flex-direction:column; padding:var(--ui-page-pad) var(--ui-page-pad) 0; background:transparent; container-type:inline-size; }
        .app-header { flex:0 0 auto; min-height:64px; margin-bottom:8px; padding:9px 10px; border:1px solid rgba(224,230,226,.95); border-radius:8px; background:#fff; box-shadow:var(--ui-shadow); }
        .app-logo { width:40px; height:40px; border-radius:8px; background:#245F50; box-shadow:0 3px 9px rgba(37,89,73,.14); }
        .app-brand-title { font-family:'Fraunces',serif; font-size:18px; line-height:1.05; font-weight:600; color:var(--ui-ink); letter-spacing:0; }
        .app-greeting { margin-top:3px; font-size:11px; color:var(--ui-muted); }
        .app-notification { width:36px; height:36px; border:1px solid #E4E9E6 !important; background:rgba(255,255,255,.78) !important; box-shadow:0 4px 12px rgba(40,62,54,.04); }
        .app-main { flex:1 1 auto; min-height:0; overflow:hidden; position:relative; }
        .app-main > * { min-height:0; }

        /* Shared surfaces and typography */
        .app-shell main section,.app-shell main article { scroll-margin-top:8px; }
        .app-shell input:not([type='checkbox']):not([type='radio']),
        .app-shell select,.app-shell textarea {
          border:1px solid var(--ui-line) !important; border-radius:var(--ui-radius-control) !important;
          background:#FCFCFA !important; color:var(--ui-ink) !important;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.9); transition:border-color .18s,box-shadow .18s,background .18s;
        }
        .app-shell input:not([type='checkbox']):not([type='radio']):focus,
        .app-shell select:focus,.app-shell textarea:focus { border-color:#A8C8BA !important; background:#fff !important; box-shadow:0 0 0 3px rgba(47,111,94,.09) !important; }
        .app-shell textarea { resize:none; }
        .app-shell input::placeholder,.app-shell textarea::placeholder { color:#AAA69D; }
        .app-shell h1,.app-shell h2,.app-shell h3,.app-shell p { overflow-wrap:anywhere; }
        .app-shell .shadow-lg,.app-shell .shadow-md,.app-shell .shadow-sm { box-shadow:var(--ui-shadow) !important; }

        /* Dashboard */
        .dashboard-page { height:100%; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; display:flex; flex-direction:column; align-items:stretch; gap:var(--ui-section-gap); padding:0 0 calc(78px + env(safe-area-inset-bottom)); background:var(--ui-bg); }
        .dashboard-page::-webkit-scrollbar { display:none; }
        .dashboard-card { flex:0 0 auto; overflow:hidden; border:1px solid rgba(220,228,223,.98); border-radius:var(--ui-radius-card); background:#FFFFFF; padding:13px; box-shadow:0 3px 12px rgba(33,67,55,.045); }
        .dashboard-balance { position:relative; flex:0 0 auto; overflow:hidden; min-height:288px; padding:19px 16px 13px; color:#fff; border-radius:8px; background:#245F50; box-shadow:0 7px 20px rgba(37,95,80,.16); }
        .dashboard-balance::before { display:none; }
        .dashboard-balance__label { position:relative;z-index:2;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600; }
        .dashboard-balance__value { position:relative;z-index:2;margin-top:10px;max-width:70%;font-size:40px;line-height:1;font-weight:700;letter-spacing:0;white-space:nowrap; }
        .dashboard-balance__trend { position:relative;z-index:2;display:flex;align-items:center;gap:6px;margin-top:13px;font-size:11px;color:#DDF3EA; }
        .dashboard-balance__stats { position:absolute;z-index:3;left:12px;right:12px;bottom:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.095);backdrop-filter:blur(8px); }
        .dashboard-stat { min-width:0;padding:10px 8px;text-align:center;overflow:hidden; }
        .dashboard-stat + .dashboard-stat { border-left:1px solid rgba(255,255,255,.14); }
        .dashboard-stat__title,.dashboard-stat__label { min-height:27px;display:flex;align-items:center;justify-content:center;gap:5px;font-size:9px;line-height:1.12;color:#F3FBF7; }
        .dashboard-stat__label { text-overflow:ellipsis; overflow:hidden; white-space:nowrap; }
        .dashboard-stat__icon { width:24px;height:24px;min-width:24px;border-radius:50%;display:grid;place-items:center; }
        .dashboard-stat__value { margin-top:4px;min-width:0;font-size:17px;line-height:1.05;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .dashboard-stat__trend { min-height:16px;margin-top:5px;display:flex;align-items:center;justify-content:center;gap:3px;font-size:9px;font-weight:700; }
        .dashboard-section-heading { display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px; }
        .dashboard-section-heading__title { display:flex;align-items:center;gap:7px;min-width:0; }
        .dashboard-section-heading h2 { margin:0;font-size:15px;line-height:1.1;font-weight:700;letter-spacing:0; }
        .dashboard-link { border:0;background:transparent;color:var(--ui-green-700);font-size:10.5px;font-weight:700;white-space:nowrap; }
        .dashboard-cashflow { min-height:224px; }
        .dashboard-chart-controls { display:flex; align-items:center; gap:7px; min-width:0; }
        .dashboard-chart { display:block !important; width:100%; height:158px; min-height:158px; overflow:hidden; }
        .dashboard-activity { min-height:118px; }
        .dashboard-activity .activity-list { min-height:52px; }
        .dashboard-empty { min-height:82px;display:grid;place-items:center;color:#969C98;font-size:11px;text-align:center; }
        .dashboard-quote { min-height:62px;margin:0;padding:11px 13px;display:grid;grid-template-columns:22px minmax(0,1fr) 30px;align-items:center;gap:8px;border:1px solid #DDE7E2;border-radius:8px;color:#33403A;background:#F0F5F2;box-shadow:none; }
        .dashboard-quote span { font-size:10.5px;line-height:1.4;text-align:center; }

        /* Consistent transaction/activity rows */
        .activity-list { display:grid;gap:0; }
        .activity-row { width:100%;min-width:0;display:grid;grid-template-columns:34px minmax(0,1fr) auto 14px;align-items:center;gap:9px;min-height:45px;padding:6px 0;text-align:left;border-bottom:1px solid #EEF0EE; }
        .activity-row:last-child { border-bottom:0; }
        .activity-row__icon { width:31px;height:31px;border-radius:8px;display:grid;place-items:center;color:#fff; }
        .activity-row__copy { min-width:0;display:flex;flex-direction:column; }
        .activity-row__copy strong { overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--ui-ink); }
        .activity-row__copy small { margin-top:2px;font-size:8.5px;color:#929890; }
        .activity-row__amount { font-size:10.5px;font-weight:700;white-space:nowrap; }

        /* Forms, details, menus */
        .app-shell [class*='rounded-3xl'] { border-radius:8px !important; }
        .app-shell [class*='rounded-2xl'] { border-radius:8px !important; }
        .app-shell [class*='rounded-xl'] { border-radius:8px !important; }
        .app-shell [class*='rounded-['] { border-radius:8px !important; }
        .app-shell button[class*='bg-[#2F6F5E]'],.app-shell button[class*='from-[#2F6F5E]'] { box-shadow:0 8px 18px rgba(47,111,94,.18); }
        .app-shell button:disabled { opacity:.48;box-shadow:none !important;cursor:not-allowed; }

        /* Bottom navigation */
        .app-bottom-nav { position:fixed;z-index:30;left:50%;bottom:0;width:min(480px,100%);transform:translateX(-50%);padding:7px 10px max(7px,env(safe-area-inset-bottom));border-top:1px solid rgba(226,231,228,.95);background:rgba(255,255,255,.95);backdrop-filter:blur(18px);box-shadow:0 -8px 25px rgba(30,56,46,.065); }
        .app-bottom-nav__inner { display:grid;grid-template-columns:repeat(5,1fr); }
        .app-nav-item { position:relative;min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#818984; }
        .app-nav-item.is-active { color:var(--ui-green-700); }
        .app-nav-item.is-active::after { content:'';position:absolute;bottom:0;width:25px;height:3px;border-radius:999px;background:var(--ui-green-700); }
        .app-nav-item span { font-size:8.5px;font-weight:650; }


        /* One consistent application canvas behind every card and form */
        .app-shell,.app-main { background:var(--ui-bg) !important; }
        .app-main > div,
        .app-main > section,
        .app-main > article { background-color:transparent; }
        .app-main [class*='bg-[#F1F4F2]'],
        .app-main [class*='bg-[#F2F4F2]'],
        .app-main [class*='bg-[#EDF1EE]'],
        .app-main [class*='bg-[#FAFBFA]'][class*='h-full'],
        .app-main [class*='bg-[#FCFBF8]'][class*='h-full'] { background:var(--ui-bg) !important; }
        .app-main form { background:transparent; }

        /* Home-screen rhythm: every section keeps its content and natural boundary */
        .dashboard-page > section,.dashboard-page > blockquote { width:100%; min-width:0; }
        /* Sistem form terpadu: semua form memakai canvas, card, kontrol, dan aksi yang sama. */
        .app-form-page { height:100%; min-height:0; overflow-y:auto; overscroll-behavior:contain; background:var(--ui-bg); padding:12px 16px calc(88px + env(safe-area-inset-bottom)); scrollbar-width:none; }
        .app-form-page::-webkit-scrollbar { display:none; }
        .app-form-stack { display:flex; flex-direction:column; gap:10px; min-width:0; }
        .app-form-card { background:#fff; border:1px solid var(--ui-border); border-radius:8px; padding:12px 14px; box-shadow:var(--ui-shadow-soft); min-width:0; }
        .app-form-summary { border-radius:8px; padding:10px 12px; border:1px solid #DCEBE4; background:#F3F9F6; box-shadow:var(--ui-shadow-soft); min-width:0; overflow:hidden; }
        .app-form-label { display:block; margin-bottom:4px; color:#7E796F; font-size:9px; line-height:1.2; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
        .app-form-control { width:100%; min-width:0; height:42px; border:1px solid #E4DED1; border-radius:8px; background:#FCFBF8; color:#1B2A26; padding:0 11px; font-size:12px; outline:none; }
        .app-form-control:focus,.app-form-control:focus-within { border-color:#2F6F5E; }
        textarea.app-form-control { height:42px; min-height:42px; padding-top:10px; resize:none; }
        .app-form-grid-2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; }
        .app-form-action { width:100%; min-height:46px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:13px; font-weight:700; }
        .app-form-secondary { background:#fff; color:#B5533C; border:1px solid #D9A99D; }
        .app-form-primary { background:#2F6F5E; color:#fff; border:1px solid #2F6F5E; box-shadow:0 7px 18px rgba(47,111,94,.16); }
        .app-form-primary--expense { background:#B5533C; border-color:#B5533C; box-shadow:0 7px 18px rgba(181,83,60,.16); }
        .app-form-header { display:grid; grid-template-columns:36px minmax(0,1fr) 36px; align-items:center; gap:8px; min-height:48px; margin-bottom:10px; }
        .app-form-header__back,.app-form-header__icon { width:36px; height:40px; display:flex; align-items:center; justify-content:center; background:transparent; border:0; }
        .app-form-header__copy { min-width:0; }
        .app-form-header__title { color:#1B2A26; font-size:19px; line-height:1.15; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .app-form-header__description { margin-top:2px; color:#8B8579; font-size:10.5px; line-height:1.25; white-space:normal; }
        .laporan-page { height:100%; overflow-y:auto; padding-bottom:88px; }
        .laporan-filter-card { display:grid; gap:11px; padding:12px; }
        .laporan-page #area-laporan-preview { margin-top:2px; border-radius:8px; box-shadow:0 3px 12px rgba(35,62,52,.04); }
        @media (max-width:360px) {
          .laporan-filter-card { padding:10px; gap:9px; }
        }
        .asset-form-stack { gap:8px; overflow:hidden; }
        .asset-form-card { flex:1; min-height:0; overflow:hidden; padding:10px 12px; }
        .asset-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 9px; align-content:start; min-width:0; }
        .asset-form-field { min-width:0; }
        .asset-form-field--full { grid-column:1 / -1; }
        .asset-form-field .app-form-label { display:block; margin-bottom:4px; }
        .asset-form-field .app-form-control { height:39px; border-radius:8px; padding-inline:10px; font-size:11.5px; }
        .asset-form-field textarea.app-form-control { height:42px; min-height:42px; padding-top:8px; line-height:1.25; }
        .asset-form-note { resize:none; }
        .asset-form-submit { flex:0 0 auto; margin-top:0; min-height:44px; }
        .app-form-error { margin-top:3px; color:#B5533C; font-size:9px; line-height:1.15; }
        @media (max-width:360px) {
          .app-form-page { padding-left:12px; padding-right:12px; }
          .app-form-card { padding:11px 12px; }
          .app-form-grid-2 { gap:8px; }
          .app-form-header__title { font-size:17px; }
          .asset-form-card { padding:9px 10px; }
          .asset-form-grid { gap:7px 8px; }
          .asset-form-field .app-form-control { height:37px; font-size:11px; }
          .asset-form-field textarea.app-form-control { height:39px; min-height:39px; }
        }
        .dashboard-section-heading { min-height:28px; margin-bottom:9px; }
        .dashboard-section-heading__title svg { flex:0 0 auto; color:#168565; }
        .dashboard-section-heading h2 { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dashboard-cashflow .dashboard-section-heading { align-items:center; }
        .dashboard-activity .activity-row { min-height:48px; }

        /* Responsive/adaptive safeguards */
        .app-shell .grid > *,.app-shell .flex > * { min-width:0; }
        .app-shell input,.app-shell select,.app-shell textarea,.app-shell button { max-width:100%; }
        .app-shell img,.app-shell svg { max-width:100%; }
        .account-page { overscroll-behavior:contain; scrollbar-width:none; }
        .account-page::-webkit-scrollbar { display:none; }
        .account-settings-card button { overflow:hidden; }
        [data-font-size="besar"] .app-brand-title { font-size:18px; }
        [data-font-size="besar"] .dashboard-balance__value { max-width:74%; }
        [data-font-size="besar"] .dashboard-stat__title,[data-font-size="besar"] .dashboard-stat__label { letter-spacing:0; }
        @container (max-width:350px) {
          .dashboard-balance__stats { left:8px; right:8px; bottom:8px; }
          .dashboard-stat { padding-inline:4px; }
          .dashboard-stat__icon { transform:scale(.9); transform-origin:center; }
        }

        /* Responsive safety */
        @media(max-width:370px){
          .app-shell{padding-inline:7px}.app-header{padding-inline:9px}.dashboard-balance{min-height:282px;padding-inline:13px}
          .dashboard-balance__value{font-size:31px}.dashboard-stat{padding-inline:5px}.dashboard-stat__title,.dashboard-stat__label{font-size:8.5px}.dashboard-stat__value{font-size:14px}
        }


        /* Aset: layout padat, terbaca, dan aman dari FAB pada layar Redmi */
        .asset-dashboard-page {
          gap:10px;
          padding-bottom:calc(150px + env(safe-area-inset-bottom));
        }
        .dashboard-balance--asset {
          min-height:238px;
          padding:16px 14px 10px;
        }
        .dashboard-balance--asset .dashboard-balance__value {
          max-width:76%;
          margin-top:7px;
          font-size:40px;
        }
        .dashboard-balance--asset .dashboard-balance__trend { margin-top:8px; }
        .dashboard-balance--asset .asset-balance__stats {
          left:10px; right:10px; bottom:10px; min-height:78px;
          border-radius:8px;
        }
        .asset-balance-stat {
          min-width:0; padding:8px 10px 7px; overflow:hidden;
          display:grid; grid-template-rows:24px 31px 14px; align-items:center;
        }
        .asset-balance-stat > div:nth-child(2) { justify-content:flex-start !important; }
        .asset-balance-stat > div:nth-child(3) { justify-content:flex-start !important; }
        .asset-balance-stat > div:nth-child(2) span:nth-child(2) {
          font-size:22px !important;
        }
        .asset-category-section { flex:0 0 auto; }
        .asset-category-section > div:first-child { padding-top:11px; padding-bottom:10px; }
        .asset-category-section > div:nth-child(2) { padding-top:7px; padding-bottom:7px; }
        .asset-category-section > div:nth-child(3) { gap:9px; padding:10px; }
        .asset-category-card { min-height:112px; }
        .asset-category-card__inner { min-height:112px; padding:11px !important; }
        .asset-category-card__inner--wide { min-height:76px; padding:11px !important; }
        .asset-category-card .mt-auto { padding-top:5px !important; }
        .asset-category-card--wide { min-height:76px; }
        .asset-motto { flex:0 0 auto; min-height:60px; margin-bottom:16px; }
        @media(max-width:370px){
          .dashboard-balance--asset{min-height:230px;padding-inline:12px}
          .asset-balance-stat{padding-inline:8px}
          .asset-category-card,.asset-category-card__inner{min-height:106px}
        }

        /* Hero Beranda ringkas: saldo terpusat, dua ringkasan, footer cash flow */
        .dashboard-balance--compact{min-height:258px;padding:16px 12px 11px;display:grid;grid-template-rows:minmax(88px,auto) 106px 34px;gap:8px;background:#245F50}
        .dashboard-balance--compact::before{opacity:.7}.dashboard-balance__main{position:relative;z-index:2;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .dashboard-balance__label--center{justify-content:center;font-size:14px}.dashboard-balance__label--center button{color:inherit;display:grid;place-items:center;padding:0;border:0;background:transparent}
        .dashboard-balance__value--center{max-width:100%;margin-top:7px;text-align:center;font-size:44px}.dashboard-balance__amount{display:inline-flex;align-items:baseline;justify-content:center;gap:5px;max-width:100%;white-space:nowrap}
        .dashboard-balance__currency{font-size:.48em;font-weight:700}.dashboard-balance__number{min-width:0;overflow:hidden;text-overflow:ellipsis}.dashboard-balance__unit{font-size:.42em;font-weight:700}.dashboard-balance__trend--center{justify-content:center;margin-top:9px;font-size:11px}
        .dashboard-balance__stats--two{position:relative;left:auto;right:auto;bottom:auto;width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-radius:8px;overflow:hidden;background:rgba(3,65,49,.28);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px)}
        .dashboard-balance__stats--two .dashboard-stat{grid-template-rows:24px 38px 18px!important;padding:8px 8px 7px!important;background:rgba(255,255,255,.035)!important}.dashboard-balance__stats--two .dashboard-stat__title{grid-template-columns:22px minmax(0,1fr)!important;font-size:10.5px!important}
        .dashboard-balance__stats--two .dashboard-stat__icon{width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important}.dashboard-balance__stats--two .dashboard-stat__value{height:38px!important}.dashboard-balance__stats--two .dashboard-stat__value>span{max-width:100%}
        .dashboard-balance__footer{position:relative;z-index:3;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12)}.dashboard-balance__cashflow{min-width:0;display:flex;align-items:center;gap:6px;color:#F4FFF9;font-size:11px;white-space:nowrap;overflow:hidden}
        .dashboard-balance__cashflow>svg{color:#8BE5BC;flex:0 0 auto;width:17px;height:17px}.dashboard-balance__cashflow-label{overflow:hidden;text-overflow:ellipsis;font-weight:500}.dashboard-balance__cashflow-value{display:inline-flex;align-items:baseline;gap:3px;font-size:14px;color:#fff;flex:0 0 auto;font-weight:700;font-variant-numeric:tabular-nums}
        .dashboard-balance__cashflow-trend{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;flex:0 0 auto;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,0.08)}.dashboard-balance__cashflow-trend.is-good{color:#87E7B8;background:rgba(135,231,184,0.12)}.dashboard-balance__cashflow-trend.is-bad{color:#FFB2A8;background:rgba(255,178,168,0.12)}
        .dashboard-balance__health{height:30px;max-width:100px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:999px;border:1px solid rgba(255,255,255,0.28);background:rgba(6,78,57,0.55);color:#fff;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;backdrop-filter:blur(6px)}.dashboard-balance__health span{overflow:hidden;text-overflow:ellipsis}
        .dashboard-balance__health svg{width:15px;height:15px;flex:0 0 auto}
        .dashboard-balance__health--warning{background:rgba(157,59,46,0.75);border-color:rgba(255,255,255,0.35)}.dashboard-balance__health--netral{background:rgba(73,91,85,0.72);border-color:rgba(255,255,255,0.3)}.dashboard-balance__health--stabil{background:rgba(25,111,82,0.72);border-color:rgba(255,255,255,0.32)}
        @media(max-width:360px){.dashboard-balance--compact{min-height:250px;grid-template-rows:minmax(82px,auto) 102px 32px;padding-inline:9px}.dashboard-balance__footer{gap:8px;margin-top:12px;padding-top:10px}.dashboard-balance__cashflow{gap:5px}.dashboard-balance__cashflow-label{max-width:85px}.dashboard-balance__health{max-width:85px;padding-inline:8px;height:28px}}
      `}</style>

      <div className="app-shell">
        

        {!(
          (tab === "transaksi" && transaksiHeaderTersembunyi) ||
          (tab === "rencana" && rencanaHeaderTersembunyi) ||
          (tab === "aset" && asetHeaderTersembunyi) ||
          (tab === "lainnya" && akunHeaderTersembunyi)
        ) && (
          <header className="app-header flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="app-logo flex items-center justify-center shrink-0" aria-hidden="true">
                <BarChart3 size={22} className="text-[#F3C94B]" strokeWidth={2.6} />
              </div>
              <div className="min-w-0">
                <div className="app-brand-title truncate">
                  Buku Kas
                </div>
                {tab === "beranda" ? (
                  <div className="app-greeting truncate">{salamWaktu()}</div>
                ) : (
                  <div className="text-[12.5px] text-[#8B8579] truncate">{JUDUL_HALAMAN[tab]}</div>
                )}
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <button type="button" onClick={() => setNotifikasiOpen(true)} className="app-notification relative rounded-full border border-[#E3E9E6] flex items-center justify-center text-[#1B2A26]" aria-label="Buka notifikasi">
                <Bell size={17} strokeWidth={1.9} />
                {notifikasiRencana.length > 0 && <span className="absolute top-[3px] right-[3px] w-2 h-2 rounded-full bg-[#B5533C] border border-white" />}
              </button>
            </div>
          </header>
        )}

        <main className="app-main">
          {!loaded ? (
            <p className="text-[12px] text-[#8B8579] text-center py-10">Memuat data…</p>
          ) : (
            <>
              {tab === "beranda" && (
                <Beranda
                  goTo={navigasiKe}
                  onBukaDetail={bukaDetailDariAktivitas}
                  transaksi={transaksiEfektif}
                  saldo={saldo + saldoBank + saldoEwallet}
                  pemasukan={pemasukan}
                  pengeluaran={pengeluaran}
                  aset={aset}
                  hutang={hutang}
                  anggaran={anggaran}
                  targetMenabung={targetMenabung}
                  cicilan={cicilan}
                  onBukaRencana={bukaRencana}
                  onPilihFab={bukaFormFab}
                />
              )}
              {tab === "transaksi" && (
                <Transaksi
                  transaksi={transaksi}
                  hutang={hutang}
                  menungguSaldoSet={transaksiMenungguSaldo}
                  saldoSnapshot={transaksiSaldoSnapshot}
                  goTo={navigasiKe}
                  onDelete={hapusTransaksiAkun}
                  onEdit={perbaruiTransaksiAkun}
                  onHapusTransfer={hapusTransferTransaksi}
                  onPilihFab={bukaFormFab}
                  aset={aset}
                  saldo={saldo}
                  saldoBank={saldoBank}
                  saldoEwallet={saldoEwallet}
                  onTransfer={transferDana}
                  onTambah={simpanTransaksiBaru}
                  modeAwal={transaksiModeAwal}
                  onModeAwalTerpakai={tandaiModeTransaksiTerpakai}
                  onHeaderHiddenChange={setTransaksiHeaderTersembunyi}
                  pencarianTerbuka={true}
                />
              )}
              {tab === "rencana" && (
                <React.Suspense fallback={<div className="grid h-full place-items-center text-[11px] text-[#7C8580]">Memuat rencana...</div>}>
                <Rencana
                  initialSection={rencanaSection}
                  hideNavigation={rencanaHeaderTersembunyi}
                  anggaran={anggaran}
                  targetMenabung={targetMenabung}
                  cicilan={cicilan}
                  transaksi={transaksiUntukStatistik}
                  kategoriPengeluaran={KATEGORI_PENGELUARAN.filter((kategori) => !["Cicilan", "Biaya Cicilan"].includes(kategori))}
                  saldoPerencanaan={saldoPerencanaan}
                  akunSaldo={akunSaldo}
                  onSimpanAnggaran={simpanAnggaran}
                  onHapusAnggaran={hapusAnggaran}
                  onSimpanTarget={simpanTargetMenabung}
                  onHapusTarget={hapusTargetMenabung}
                  onUbahDanaTarget={ubahDanaTarget}
                  onSimpanCicilan={simpanCicilan}
                  onHapusCicilan={hapusCicilan}
                  onBayarCicilan={bayarCicilan}
                  onSectionChange={setRencanaSection}
                  hutangView={(
                    <HutangPiutang
                      daftar={hutang}
                      onTambah={tambahHutang}
                      onEdit={editHutang}
                      onHapus={hapusHutang}
                      onBayar={bayarHutang}
                      onHeaderHiddenChange={setRencanaHeaderTersembunyi}
                      akunSaldo={akunSaldo}
                    />
                  )}
                />
                </React.Suspense>
              )}
              {tab === "aset" && (
                <Aset
                  daftar={aset}
                  hutang={hutang}
                  saldo={saldo}
                  saldoBank={saldoBank}
                  saldoEwallet={saldoEwallet}
                  jumlahTransaksi={transaksiEfektif.length}
                  totalHutangSisa={totalKewajibanSisa}
                  hutangTersedia={true}
                  onTambah={tambahAset}
                  onEdit={editAset}
                  onHapus={hapusAset}
                  onTransfer={transferDana}
                  goTo={navigasiKe}
                  onHeaderHiddenChange={setAsetHeaderTersembunyi}
                />
              )}
              {tab === "lainnya" && (
                <Lainnya
                  transaksi={transaksi}
                  transaksiEfektif={transaksiEfektif}
                  aset={aset}
                  hutang={hutang}
                  anggaran={anggaran}
                  targetMenabung={targetMenabung}
                  cicilan={cicilan}
                  onRestore={restoreSemuaData}
                  kategoriStatistik={kategoriData}
                  trenStatistik={trenData}
                  totalPengeluaran={pengeluaran}
                  uiPreferensi={uiPreferensi}
                  onUbahUiPreferensi={ubahUiPreferensi}
                  onHeaderHiddenChange={setAkunHeaderTersembunyi}
                />
              )}
            </>
          )}
        </main>

        {notifikasiOpen && (
          <HalamanNotifikasi items={notifikasiRencana} onClose={() => setNotifikasiOpen(false)} onOpenRencana={bukaRencana} />
        )}

        {transferOpen && (
          <FormTransfer
            aset={aset}
            saldo={saldo}
            saldoBank={saldoBank}
            saldoEwallet={saldoEwallet}
            onClose={() => setTransferOpen(false)}
            onSubmit={transferDana}
          />
        )}

        {formOpen && (
          <FormTambah
            preset={presetForm}
            saldo={saldo}
            saldoBank={saldoBank}
            saldoEwallet={saldoEwallet}
            onClose={() => { setFormOpen(false); setPresetForm(null); }}
            onSubmit={simpanTransaksiBaru}
          />
        )}

        <nav className="app-bottom-nav">
          <div className="app-bottom-nav__inner">
            {NAV.map(({ id, label, icon }) => {
              const aktif = tab === id;
              return (
                <button key={id} onClick={() => navigasiKe(id)} className={`app-nav-item ${aktif ? "is-active" : ""}`}>
                  <Icon name={icon} size={20} strokeWidth={aktif ? 2.2 : 1.8} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
