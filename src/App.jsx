import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { Home, Receipt, PieChart as PieIcon, FileText, ArrowDownLeft, ArrowUpRight, Search, Download, ChevronRight, Plus, X, Trash2, HandCoins, Pencil, Wallet, Landmark, CreditCard, TrendingUp, Car, Building2, Gem, MoreHorizontal, UploadCloud, DownloadCloud, ArrowLeft, Users } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, ResponsiveContainer } from "recharts";

// ---------- DATA CONTOH ----------

const KATEGORI_PENGELUARAN = ["Makan", "Belanja", "Transportasi", "Tagihan", "Kesehatan", "Hiburan", "Lainnya"];
const SUMBER_PEMASUKAN = ["Gaji", "Bonus", "Freelance", "Penjualan", "Investasi", "Hadiah", "Cashback", "Bunga Bank", "Lainnya"];
const METODE_LIST = ["Cash", "Transfer", "E-wallet"];
// Sumber tunggal daftar kategori gabungan — dipakai di filter Transaksi & Laporan agar selalu konsisten
const KATEGORI_TRANSAKSI_SEMUA = [...new Set([...KATEGORI_PENGELUARAN, ...SUMBER_PEMASUKAN, "Hutang", "Piutang"])];
// Status hutang/piutang, dipakai untuk filter & urutkan (di menu Hutang & di Laporan)
const STATUS_HUTANG_OPSI = ["Aktif", "Terlambat", "Gagal Bayar", "Lunas"];
const PRIORITAS_STATUS = { "Gagal Bayar": 0, Terlambat: 1, Aktif: 2, Lunas: 3 };

const HARI_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];


const INITIAL_TRANSAKSI = [];

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

// Helper format angka Indonesia (pemisah ribuan ".") — dipakai ulang oleh semua input nominal
const angkaMurni = (str) => (str || "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
const formatRibuan = (digitStr) => (digitStr ? digitStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "");

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
  const [d, b, y] = str.split(" ");
  return new Date(Number(y), BULAN_ID[b] ?? 0, Number(d)).getTime();
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

const buatId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  const sisa = Math.max(0, item.jumlah - item.terbayar);
  if (sisa <= 0) return { sisa, status: "Lunas" };

  if (!item.jatuhTempo) return { sisa, status: "Aktif" };
  const jatuhTempoTs = parseTglID(item.jatuhTempo);
  const hariIni = new Date().setHours(0, 0, 0, 0);
  if (jatuhTempoTs >= hariIni) return { sisa, status: "Aktif" };
  const hariTerlambat = Math.floor((hariIni - jatuhTempoTs) / 86400000);
  return { sisa, status: hariTerlambat > 90 ? "Gagal Bayar" : "Terlambat" };
}

const KATEGORI_ASET = ["Kas & Bank", "E-Wallet", "Investasi", "Kendaraan", "Properti", "Barang Berharga"];
// Kategori tampilan di halaman Aset (termasuk Piutang, yang datanya otomatis dari menu Hutang — bukan input manual)
const KATEGORI_ASET_TAMPIL = [...KATEGORI_ASET, "Piutang"];
const IKON_KATEGORI_ASET = {
  "Kas & Bank": Landmark,
  "E-Wallet": CreditCard,
  Investasi: TrendingUp,
  Kendaraan: Car,
  Properti: Building2,
  "Barang Berharga": Gem,
  Piutang: Users,
};
const WARNA_KATEGORI_ASET = {
  "Kas & Bank": "#2F6F5E",
  "E-Wallet": "#C9A24B",
  Investasi: "#5B7B8C",
  Kendaraan: "#B5533C",
  Properti: "#A3763F",
  "Barang Berharga": "#8B8579",
  Piutang: "#3F8F7A",
};

const PALET_KATEGORI = ["#2F6F5E", "#C9A24B", "#B5533C", "#5B7B8C", "#A3763F", "#8B8579"];
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
function Spine() {
  return (
    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 flex flex-col items-center py-6 gap-3 z-10">
      <div className="w-px h-full border-l border-dashed border-[#C9BFA8] absolute left-2" />
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9BFA8] relative z-10" />
      ))}
    </div>
  );
}

function TornEdge({ flip }) {
  return (
    <svg
      viewBox="0 0 400 12"
      preserveAspectRatio="none"
      className={`w-full h-3 ${flip ? "rotate-180" : ""}`}
    >
      <polygon
        points="0,0 400,0 400,12 380,4 360,10 340,3 320,9 300,2 280,11 260,5 240,9 220,2 200,10 180,4 160,11 140,3 120,9 100,2 80,10 60,4 40,11 20,3 0,9"
        fill="#F6F3EC"
      />
    </svg>
  );
}

function StatusPill({ text, warna = "hijau" }) {
  const kelas = warna === "merah" ? "text-[#B5533C] bg-[#F3E7E1]" : "text-[#2F6F5E] bg-[#E4EEE9]";
  return (
    <span className={`text-[11px] tracking-wide uppercase px-2.5 py-1 rounded-full font-medium ${kelas}`}>
      {text}
    </span>
  );
}

// ---------- LAYAR: BERANDA ----------
function Beranda({ goTo, transaksi, saldo, pemasukan, pengeluaran }) {
  const polaMingguan = useMemo(() => {
    const hasil = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const totalHari = transaksi
        .filter((t) => t.jumlah < 0)
        .filter((t) => {
          const td = parseTglID(t.tgl);
          return new Date(td).getFullYear() === d.getFullYear() && new Date(td).getMonth() === d.getMonth() && new Date(td).getDate() === d.getDate();
        })
        .reduce((a, t) => a + Math.abs(t.jumlah), 0);
      hasil.push({ hari: HARI_ID[d.getDay()], jumlah: totalHari, iniHari: i === 0 });
    }
    return hasil;
  }, [transaksi]);
  const totalPolaMingguan = polaMingguan.reduce((a, d) => a + d.jumlah, 0);

  return (
    <div className="pb-4">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#8B8579]">Saldo Total</span>
          <StatusPill text={saldo < 0 ? "Minus" : "Sehat"} warna={saldo < 0 ? "merah" : "hijau"} />
        </div>
        <div
          className="font-serif text-[40px] leading-none mb-1"
          style={{ fontFamily: "'Fraunces', serif", color: saldo < 0 ? "#B5533C" : "#1B2A26" }}
        >
          {rupiah(saldo)}
        </div>
        <p className="text-[13px] text-[#8B8579] mb-5">
          {saldo < 0 ? "Pengeluaran melebihi pemasukan tercatat" : "Seluruh transaksi tercatat rapi"}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-[#EAF2EE] p-4">
            <div className="flex items-center gap-1.5 text-[#2F6F5E] mb-2">
              <ArrowDownLeft size={15} strokeWidth={2.5} />
              <span className="text-[11px] uppercase tracking-wide font-medium">Pemasukan</span>
            </div>
            <div className="text-[20px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Rp {(pemasukan / 1000000).toFixed(1)}jt
            </div>
          </div>
          <div className="rounded-2xl bg-[#F3E7E1] p-4">
            <div className="flex items-center gap-1.5 text-[#B5533C] mb-2">
              <ArrowUpRight size={15} strokeWidth={2.5} />
              <span className="text-[11px] uppercase tracking-wide font-medium">Pengeluaran</span>
            </div>
            <div className="text-[20px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Rp {(pengeluaran / 1000000).toFixed(1)}jt
            </div>
          </div>
        </div>
      </div>

      <TornEdge />

      <div className="px-6 pt-5">
        <h3 className="font-serif text-[17px] text-[#1B2A26] mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
          Pola 7 Hari Terakhir
        </h3>
        <p className="text-[12px] text-[#8B8579] mb-3">
          {totalPolaMingguan > 0 ? `Total ${rupiah(totalPolaMingguan)}` : "Belum ada pengeluaran"}
        </p>
        <div className="h-32 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={polaMingguan}>
              <XAxis dataKey="hari" tick={{ fontSize: 11, fill: "#8B8579" }} axisLine={false} tickLine={false} />
              <Bar dataKey="jumlah" radius={[5, 5, 0, 0]}>
                {polaMingguan.map((d, i) => (
                  <Cell key={i} fill={d.iniHari ? "#1B2A26" : "#2F6F5E"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-[17px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            Transaksi Terbaru
          </h3>
          <button onClick={() => goTo("transaksi")} className="text-[12px] text-[#2F6F5E] font-medium flex items-center gap-0.5">
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>
        <div className="rounded-2xl border border-[#E7E1D3] overflow-hidden bg-white">
          {transaksi.slice(0, 4).map((t, i) => (
            <TxRow key={i} t={t} last={i === Math.min(3, transaksi.length - 1)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TxRow({ t, last, onDelete, onEdit }) {
  const positif = t.jumlah > 0;
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${!last ? "border-b border-[#F0EBDD]" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${positif ? "bg-[#EAF2EE] text-[#2F6F5E]" : "bg-[#F3E7E1] text-[#B5533C]"}`}>
          {positif ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
        </div>
        <div>
          <div className="text-[14px] text-[#1B2A26] font-medium">{t.nama}</div>
          <div className="text-[11px] text-[#8B8579]">{t.tgl} · {t.kat} · {t.metode}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div
          className={`text-[13px] font-semibold mr-1 ${positif ? "text-[#2F6F5E]" : "text-[#B5533C]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rupiah(t.jumlah)}
        </div>
        {onEdit && (
          <button onClick={onEdit} className="text-[#8B8579] p-1.5">
            <Pencil size={14} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-[#C9BFA8] p-1.5">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- LAYAR: TRANSAKSI ----------
const URUTAN_OPSI = [
  ["terbaru", "Terbaru"],
  ["terlama", "Terlama"],
  ["terbesar", "Nominal Terbesar"],
  ["terkecil", "Nominal Terkecil"],
];

function Transaksi({ transaksi, onDelete, onEdit }) {
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("semua");
  const [urutan, setUrutan] = useState("terbaru");
  const [editItem, setEditItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let hasil = transaksi.filter((t) => t.nama.toLowerCase().includes(q.toLowerCase()));
    if (kategori !== "semua") hasil = hasil.filter((t) => t.kat === kategori);
    hasil = [...hasil].sort((a, b) => {
      if (urutan === "terbaru") return parseTglID(b.tgl) - parseTglID(a.tgl);
      if (urutan === "terlama") return parseTglID(a.tgl) - parseTglID(b.tgl);
      if (urutan === "terbesar") return Math.abs(b.jumlah) - Math.abs(a.jumlah);
      return Math.abs(a.jumlah) - Math.abs(b.jumlah);
    });
    return hasil;
  }, [transaksi, q, kategori, urutan]);

  return (
    <div className="px-6 pt-6 pb-4">
      <h2 className="font-serif text-[22px] text-[#1B2A26] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
        Semua Transaksi
      </h2>

      <div className="flex items-center gap-2 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 mb-3">
        <Search size={15} className="text-[#8B8579]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari transaksi…"
          className="flex-1 text-[13px] text-[#1B2A26] bg-transparent outline-none placeholder:text-[#8B8579]"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="flex-1 min-w-0 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]"
        >
          <option value="semua">Semua Kategori</option>
          {KATEGORI_TRANSAKSI_SEMUA.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select
          value={urutan}
          onChange={(e) => setUrutan(e.target.value)}
          className="flex-1 min-w-0 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]"
        >
          {URUTAN_OPSI.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <p className="text-[11px] text-[#8B8579] mb-3">{filtered.length} dari {transaksi.length} transaksi</p>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada transaksi yang cocok.</p>
      ) : (
        <div className="rounded-2xl border border-[#E7E1D3] overflow-hidden bg-white">
          {filtered.map((t, i) => (
            <TxRow
              key={i}
              t={t}
              last={i === filtered.length - 1}
              onEdit={() => { setEditItem(t); setFormOpen(true); }}
              onDelete={() => onDelete(transaksi.indexOf(t))}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <FormTambah
          initial={editItem}
          onClose={() => setFormOpen(false)}
          onSubmit={(data) => onEdit(transaksi.indexOf(editItem), data)}
        />
      )}
    </div>
  );
}

// ---------- LAYAR: STATISTIK ----------
function Statistik({ kategori, tren, totalPengeluaran }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <h2 className="font-serif text-[22px] text-[#1B2A26] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
        Statistik
      </h2>

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
                <span className="text-[13px] font-semibold text-[#1B2A26]">Rp{(totalPengeluaran / 1000000).toFixed(1)}jt</span>
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
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#F6F3EC", useCORS: true });
  await new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve();
      await simpanBlob(blob, buatNamaFile("png"), "image/png");
      resolve();
    }, "image/png");
  });
}

// ---------- LAYAR: LAPORAN (berbasis filter) ----------
function Laporan({ transaksi, aset, hutang }) {
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
  const tampilkanStatusHutang = jenisData === "hutang" || jenisData === "piutang";
  const tampilkanSaldoAwal = jenisData === "semua" || jenisData === "pemasukan" || jenisData === "pengeluaran";
  const opsiKategori =
    jenisData === "aset"
      ? KATEGORI_ASET
      : jenisData === "pemasukan"
      ? [...SUMBER_PEMASUKAN, "Piutang"]
      : jenisData === "pengeluaran"
      ? [...KATEGORI_PENGELUARAN, "Hutang"]
      : KATEGORI_TRANSAKSI_SEMUA;

  const gantiJenisData = (v) => {
    setJenisData(v);
    setKategori("semua");
    setMetode("semua");
    setStatusFilter("semua");
  };

  const { tipe, baris, ringkasan } = useMemo(() => {
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
          ["Total Nilai Aset", rupiah(total)],
        ],
      };
    }

    if (jenisData === "hutang" || jenisData === "piutang") {
      let hasil = hutang.filter((h) => h.jenis === jenisData && dalam(h.tanggal));
      if (statusFilter !== "semua") hasil = hasil.filter((h) => statusHutang(h).status === statusFilter);
      hasil = [...hasil].sort((a, b) => {
        if (urutanHutang === "status") return PRIORITAS_STATUS[statusHutang(a).status] - PRIORITAS_STATUS[statusHutang(b).status];
        return urutanHutang === "terbaru" ? parseTglID(b.tanggal) - parseTglID(a.tanggal) : parseTglID(a.tanggal) - parseTglID(b.tanggal);
      });
      const totalSisa = hasil.reduce((acc, h) => acc + statusHutang(h).sisa, 0);
      return {
        tipe: "hutang",
        baris: hasil,
        ringkasan: [
          ["Jumlah Catatan", String(hasil.length)],
          [jenisData === "piutang" ? "Total Sisa Piutang" : "Total Sisa Hutang", rupiah(totalSisa)],
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
    if (tanggalSaldoAwal) {
      const batasAwal = new Date(tanggalSaldoAwal).setHours(23, 59, 59, 999);
      const saldoPerTanggal = transaksi.filter((t) => parseTglID(t.tgl) <= batasAwal).reduce((a, t) => a + t.jumlah, 0);
      ringkasanTransaksi.push([`Saldo per ${formatTglDariInput(tanggalSaldoAwal)}`, rupiah(saldoPerTanggal)]);
    }
    ringkasanTransaksi.push(
      ["Total Pemasukan", "+" + rupiah(totalMasuk)],
      ["Total Pengeluaran", rupiah(-totalKeluar)],
      ["Saldo Akhir", rupiah(totalMasuk - totalKeluar)]
    );

    return { tipe: "transaksi", baris: hasil, ringkasan: ringkasanTransaksi };
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
        await buatPDFFilter({ tipe, baris, ringkasan, judulPeriode, tanggalCetak });
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

  const ChipGroup = ({ opsi, aktif, onPilih }) => (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {opsi.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onPilih(v)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${aktif === v ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="px-6 pt-6 pb-4">
      <h2 className="font-serif text-[22px] text-[#1B2A26] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
        Laporan
      </h2>

      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-4 mb-5">
        <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-2">Jenis Data</div>
        <ChipGroup opsi={JENIS_DATA_OPSI} aktif={jenisData} onPilih={gantiJenisData} />

        <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-2">Rentang Tanggal</div>
        <ChipGroup opsi={RENTANG_OPSI} aktif={rentang} onPilih={setRentang} />
        {rentang === "kustom" && (
          <div className="flex gap-2 mb-4 -mt-2">
            <input type="date" value={dariKustom} onChange={(e) => setDariKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
            <input type="date" value={sampaiKustom} onChange={(e) => setSampaiKustom(e.target.value)} className="flex-1 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-[#2F6F5E]" />
          </div>
        )}

        {tampilkanKategori && (
          <>
            <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Kategori</div>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-4 outline-none focus:border-[#2F6F5E]"
            >
              <option value="semua">Semua Kategori</option>
              {opsiKategori.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}

        {tampilkanMetode && (
          <>
            <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Metode Pembayaran</div>
            <select
              value={metode}
              onChange={(e) => setMetode(e.target.value)}
              className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-4 outline-none focus:border-[#2F6F5E]"
            >
              <option value="semua">Semua Metode</option>
              {METODE_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}

        {tampilkanStatusHutang && (
          <>
            <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Status</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-4 outline-none focus:border-[#2F6F5E]"
            >
              <option value="semua">Semua Status</option>
              {STATUS_HUTANG_OPSI.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Urutkan</div>
            <select
              value={urutanHutang}
              onChange={(e) => setUrutanHutang(e.target.value)}
              className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2F6F5E]"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="status">Status (Gagal Bayar dulu)</option>
            </select>
          </>
        )}

        {tampilkanSaldoAwal && (
          <>
            <div className="text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Saldo Awal (opsional)</div>
            <input
              type="date"
              value={tanggalSaldoAwal}
              onChange={(e) => setTanggalSaldoAwal(e.target.value)}
              className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2F6F5E]"
            />
            <p className="text-[11px] text-[#8B8579] mt-1.5">Pilih tanggal untuk melihat saldo yang pernah terjadi pada tanggal itu, dihitung otomatis dari riwayat transaksi.</p>
          </>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => ekspor("pdf")}
          disabled={!!mengunduh}
          className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium text-white bg-[#1B2A26] px-3 py-3 rounded-xl disabled:opacity-60"
        >
          <Download size={13} /> {mengunduh === "pdf" ? "Memproses…" : "Ekspor PDF (A4)"}
        </button>
        <button
          onClick={() => ekspor("png")}
          disabled={!!mengunduh}
          className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#1B2A26] bg-white border border-[#E7E1D3] px-3 py-3 rounded-xl disabled:opacity-60"
        >
          <Download size={13} /> {mengunduh === "png" ? "Memproses…" : "Ekspor PNG (HD)"}
        </button>
      </div>
      {pesanGagal && <p className="text-[11px] text-[#B5533C] mb-4">{pesanGagal}</p>}

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
                  <td className="py-1.5 text-right text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{angkaSaja(a.nilai)}</td>
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
                    <td className="py-1.5 text-right text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{angkaSaja(sisa)}</td>
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
                    {angkaSaja(t.jumlah)}
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
  { id: "laporan", label: "Laporan", deskripsi: "Ekspor data ke PDF atau PNG", icon: FileText },
  { id: "backup", label: "Backup Data", deskripsi: "Simpan cadangan seluruh data aplikasi", icon: UploadCloud },
  { id: "restore", label: "Restore Data", deskripsi: "Pulihkan data dari cadangan", icon: DownloadCloud },
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

function HalamanSegeraHadir({ judul, pesan, onBack }) {
  return (
    <div className="px-6 pt-6 pb-4">
      <HeaderSubHalaman judul={judul} onBack={onBack} />
      <div className="rounded-2xl border border-[#E7E1D3] bg-white p-8 flex flex-col items-center text-center">
        <p className="text-[13px] text-[#8B8579]">{pesan}</p>
      </div>
    </div>
  );
}

function Lainnya({ transaksi, aset, hutang }) {
  const [layar, setLayar] = useState("menu");

  if (layar === "laporan") {
    return (
      <div>
        <div className="px-6 pt-6">
          <HeaderSubHalaman judul="Laporan" onBack={() => setLayar("menu")} />
        </div>
        <div className="-mt-6">
          <Laporan transaksi={transaksi} aset={aset} hutang={hutang} />
        </div>
      </div>
    );
  }
  if (layar === "backup") {
    return <HalamanSegeraHadir judul="Backup Data" pesan="Fitur backup data akan segera hadir." onBack={() => setLayar("menu")} />;
  }
  if (layar === "restore") {
    return <HalamanSegeraHadir judul="Restore Data" pesan="Fitur restore data akan segera hadir." onBack={() => setLayar("menu")} />;
  }

  return (
    <div className="px-6 pt-6 pb-4">
      <h2 className="font-serif text-[22px] text-[#1B2A26] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
        Lainnya
      </h2>
      <div className="rounded-2xl border border-[#E7E1D3] overflow-hidden bg-white">
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
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] uppercase tracking-wide font-semibold ${warnaJenis}`}>{jenisLabel}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${warnaStatus}`}>{status}</span>
          </div>
          <div className="text-[15px] text-[#1B2A26] font-medium">{item.nama}</div>
          {item.jatuhTempo && <div className="text-[11px] text-[#8B8579]">Jatuh tempo {item.jatuhTempo}</div>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="text-[#8B8579] p-1.5"><Pencil size={14} /></button>
          <button onClick={onDelete} className="text-[#C9BFA8] p-1.5"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="w-full h-1.5 bg-[#F0EBDD] rounded-full overflow-hidden mb-2">
        <div className="h-full bg-[#2F6F5E]" style={{ width: `${persen}%` }} />
      </div>

      <div className="flex items-center justify-between text-[12px] mb-3">
        <span className="text-[#8B8579]">Terbayar {rupiah(item.terbayar)} / {rupiah(item.jumlah)}</span>
        <span className="font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Sisa {rupiah(sisa)}</span>
      </div>

      {sisa > 0 && (
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

function FormHutang({ initial, onClose, onSubmit }) {
  const [jenis, setJenis] = useState(initial?.jenis || "hutang");
  const [nama, setNama] = useState(initial?.nama || "");
  const [jumlah, setJumlah] = useState(initial ? String(initial.jumlah) : "");
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tanggal) : todayInput());
  const [jatuhTempo, setJatuhTempo] = useState(initial?.jatuhTempo ? tglKeInput(initial.jatuhTempo) : "");
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const nilai = Number(jumlah);
    const err = {};
    if (!nama.trim()) err.nama = "Nama wajib diisi.";
    if (!jumlah || nilai <= 0) err.jumlah = "Jumlah harus lebih besar dari 0.";
    if (initial && nilai < initial.terbayar) err.jumlah = "Jumlah tidak boleh kurang dari yang sudah terbayar.";
    if (!tanggal) err.tanggal = "Tanggal wajib diisi.";
    if (Object.keys(err).length) return setErrors(err);

    onSubmit({
      id: initial?.id || buatId(),
      jenis,
      nama: nama.trim(),
      jumlah: nilai,
      terbayar: initial?.terbayar || 0,
      tanggal: formatTglDariInput(tanggal),
      jatuhTempo: jatuhTempo ? formatTglDariInput(jatuhTempo) : "",
      catatan: catatan.trim(),
      pembayaran: initial?.pembayaran || [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#F6F3EC] rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? "Edit Catatan" : "Tambah Hutang / Piutang"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setJenis("hutang")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium ${jenis === "hutang" ? "bg-[#B5533C] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            Hutang Saya
          </button>
          <button
            onClick={() => setJenis("piutang")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium ${jenis === "piutang" ? "bg-[#2F6F5E] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            Piutang Saya
          </button>
        </div>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">
          {jenis === "hutang" ? "Berhutang Kepada" : "Nama Peminjam"}
        </label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Budi"
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.nama ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {errors.nama && <p className="text-[11px] text-[#B5533C] mb-2">{errors.nama}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Jumlah Total (Rp)</label>
        <InputNominal
          value={jumlah}
          onChange={setJumlah}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.jumlah ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
        {errors.jumlah && <p className="text-[11px] text-[#B5533C] mb-2">{errors.jumlah}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Tanggal</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.tanggal ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {errors.tanggal && <p className="text-[11px] text-[#B5533C] mb-2">{errors.tanggal}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Jatuh Tempo (opsional)</label>
        <input
          type="date"
          value={jatuhTempo}
          onChange={(e) => setJatuhTempo(e.target.value)}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#2F6F5E]"
        />

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Catatan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
          placeholder="Detail tambahan…"
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#2F6F5E] resize-none"
        />

        <button onClick={submit} className="w-full bg-[#1B2A26] text-white py-3 rounded-xl text-[14px] font-medium mt-1">
          Simpan
        </button>
      </div>
    </div>
  );
}

function FormBayar({ item, onClose, onSubmit }) {
  const { sisa } = statusHutang(item);
  const [jumlah, setJumlah] = useState(String(sisa));
  const [error, setError] = useState("");

  const submit = () => {
    const nilai = Number(jumlah);
    if (!jumlah || nilai <= 0) return setError("Jumlah harus lebih besar dari 0.");
    if (nilai > sisa) return setError(`Jumlah tidak boleh melebihi sisa (${rupiah(sisa)}).`);
    onSubmit(nilai);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#F6F3EC] rounded-t-3xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {item.jenis === "piutang" ? "Terima Pembayaran" : "Bayar Hutang"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>

        <p className="text-[12px] text-[#8B8579] mb-3">Sisa saat ini: <span className="font-medium text-[#1B2A26]">{rupiah(sisa)}</span></p>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Jumlah (Rp)</label>
        <InputNominal
          value={jumlah}
          onChange={(v) => { setJumlah(v); setError(""); }}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${error ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
        {error && <p className="text-[11px] text-[#B5533C] mb-2">{error}</p>}

        <button onClick={() => setJumlah(String(sisa))} className="text-[12px] text-[#2F6F5E] font-medium mb-4">
          Lunasi seluruh sisa ({rupiah(sisa)})
        </button>

        <button onClick={submit} className="w-full bg-[#1B2A26] text-white py-3 rounded-xl text-[14px] font-medium">
          Konfirmasi
        </button>
      </div>
    </div>
  );
}

function HutangPiutang({ daftar, onTambah, onEdit, onHapus, onBayar }) {
  const [tab, setTab] = useState("semua");
  const [urutan, setUrutan] = useState("terbaru");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [bayarItem, setBayarItem] = useState(null);

  const filtered = daftar.filter((h) => tab === "semua" || h.jenis === tab);
  const totalHutang = daftar.filter((h) => h.jenis === "hutang").reduce((a, h) => a + statusHutang(h).sisa, 0);
  const totalPiutang = daftar.filter((h) => h.jenis === "piutang").reduce((a, h) => a + statusHutang(h).sisa, 0);

  return (
    <div className="px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[22px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
          Hutang & Piutang
        </h2>
        <button
          onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1B2A26] text-white"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-[#F3E7E1] p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#B5533C] font-medium mb-1">Sisa Hutang Saya</div>
          <div className="text-[16px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(totalHutang)}</div>
        </div>
        <div className="rounded-2xl bg-[#EAF2EE] p-4">
          <div className="text-[11px] uppercase tracking-wide text-[#2F6F5E] font-medium mb-1">Sisa Piutang Saya</div>
          <div className="text-[16px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(totalPiutang)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {[["semua", "Semua"], ["hutang", "Hutang"], ["piutang", "Piutang"]].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-medium ${tab === v ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <select
        value={urutan}
        onChange={(e) => setUrutan(e.target.value)}
        className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[13px] mb-4 outline-none focus:border-[#2F6F5E]"
      >
        <option value="terbaru">Urutkan: Terbaru</option>
        <option value="terlama">Urutkan: Terlama</option>
        <option value="status">Urutkan: Status (Gagal Bayar dulu)</option>
      </select>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada catatan hutang/piutang.</p>
      ) : (
        filtered
          .slice()
          .sort((a, b) => {
            if (urutan === "status") return PRIORITAS_STATUS[statusHutang(a).status] - PRIORITAS_STATUS[statusHutang(b).status];
            return urutan === "terbaru" ? parseTglID(b.tanggal) - parseTglID(a.tanggal) : parseTglID(a.tanggal) - parseTglID(b.tanggal);
          })
          .map((item) => (
            <KartuHutang
              key={item.id}
              item={item}
              onBayar={() => setBayarItem(item)}
              onEdit={() => { setEditItem(item); setFormOpen(true); }}
              onDelete={() => onHapus(item.id)}
            />
          ))
      )}

      {formOpen && (
        <FormHutang
          initial={editItem}
          onClose={() => setFormOpen(false)}
          onSubmit={(data) => (editItem ? onEdit(data) : onTambah(data))}
        />
      )}
      {bayarItem && (
        <FormBayar
          item={bayarItem}
          onClose={() => setBayarItem(null)}
          onSubmit={(jml) => onBayar(bayarItem.id, jml)}
        />
      )}
    </div>
  );
}

// ---------- LAYAR: ASET ----------
function KartuAset({ item, onEdit, onDelete }) {
  const Ikon = IKON_KATEGORI_ASET[item.kategori] || Wallet;
  const warna = WARNA_KATEGORI_ASET[item.kategori] || "#8B8579";
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBDD] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
          <Ikon size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-[#1B2A26] font-medium truncate">{item.nama}</div>
          <div className="text-[11px] text-[#8B8579]">{item.kategori} · {item.tanggal}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right mr-1">
          <div className="text-[13px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(item.nilai)}</div>
        </div>
        <button onClick={onEdit} className="text-[#8B8579] p-1.5"><Pencil size={14} /></button>
        <button onClick={onDelete} className="text-[#C9BFA8] p-1.5"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function KartuAsetOtomatis({ nama, keterangan, badge, warnaBadge, nilai, ikon: Ikon, warna, goTo, tabTujuan, judulTujuan }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0EBDD] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
          <Ikon size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-[#1B2A26] font-medium truncate">{nama}</div>
          <div className="text-[11px] text-[#8B8579] flex items-center gap-1.5 flex-wrap">
            <span>{keterangan}</span>
            {badge && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${warnaBadge}`}>{badge}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="text-right mr-1">
          <div className="text-[13px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(nilai)}</div>
        </div>
        {goTo && (
          <button onClick={() => goTo(tabTujuan)} className="text-[#8B8579] p-1.5" title={`Kelola di menu ${judulTujuan}`}>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function FormAset({ initial, onClose, onSubmit }) {
  const [nama, setNama] = useState(initial?.nama || "");
  const [kategori, setKategori] = useState(initial?.kategori || KATEGORI_ASET[0]);
  const [nilai, setNilai] = useState(initial ? String(initial.nilai) : "");
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tanggal) : todayInput());
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const nilaiAngka = Number(nilai);
    const err = {};
    if (!nama.trim()) err.nama = "Nama aset wajib diisi.";
    if (!nilai || nilaiAngka <= 0) err.nilai = "Nilai harus lebih besar dari 0.";
    if (!tanggal) err.tanggal = "Tanggal dibeli wajib diisi.";
    if (Object.keys(err).length) return setErrors(err);

    onSubmit({
      id: initial?.id || buatId(),
      nama: nama.trim(),
      kategori,
      nilai: nilaiAngka,
      tanggal: formatTglDariInput(tanggal),
      catatan: catatan.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#F6F3EC] rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? "Edit Aset" : "Tambah Aset"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]"><X size={18} /></button>
        </div>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Nama Aset</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Tabungan BCA"
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.nama ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {errors.nama && <p className="text-[11px] text-[#B5533C] mb-2">{errors.nama}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Kategori</label>
        <select
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#2F6F5E]"
        >
          {KATEGORI_ASET.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Nilai Saat Ini (Rp)</label>
        <InputNominal
          value={nilai}
          onChange={setNilai}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.nilai ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
        {errors.nilai && <p className="text-[11px] text-[#B5533C] mb-2">{errors.nilai}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Tanggal Dibeli</label>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.tanggal ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
        {errors.tanggal && <p className="text-[11px] text-[#B5533C] mb-2">{errors.tanggal}</p>}

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Catatan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
          placeholder="Detail tambahan…"
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#2F6F5E] resize-none"
        />

        <button onClick={submit} className="w-full bg-[#1B2A26] text-white py-3 rounded-xl text-[14px] font-medium mt-1">
          Simpan Aset
        </button>
      </div>
    </div>
  );
}

function Aset({ daftar, hutang, saldo, jumlahTransaksi, totalHutangSisa, hutangTersedia, onTambah, onEdit, onHapus, goTo }) {
  const [q, setQ] = useState("");
  const [kategoriAktif, setKategoriAktif] = useState("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const piutangAset = useMemo(() => hutang.filter((h) => h.jenis === "piutang"), [hutang]);
  const totalPiutangSisa = piutangAset.reduce((a, h) => a + statusHutang(h).sisa, 0);
  const totalAsetManual = daftar.reduce((a, i) => a + i.nilai, 0);
  const totalAset = totalAsetManual + totalPiutangSisa + saldo;

  const totalPerKategori = useMemo(() => {
    const map = {};
    KATEGORI_ASET_TAMPIL.forEach((k) => (map[k] = 0));
    daftar.forEach((i) => (map[i.kategori] = (map[i.kategori] || 0) + i.nilai));
    map["Kas & Bank"] = (map["Kas & Bank"] || 0) + saldo;
    map["Piutang"] = totalPiutangSisa;
    return map;
  }, [daftar, totalPiutangSisa, saldo]);

  // Gabungkan aset manual + piutang (live) + saldo transaksi (live) — piutang & saldo read-only
  const gabungan = useMemo(() => {
    const tglHariIni = formatTglDariInput(todayInput());
    const dariAset = daftar.map((a) => ({ tipe: "aset", asli: a, nama: a.nama, kategori: a.kategori, tanggal: a.tanggal }));
    const dariPiutang = piutangAset.map((h) => ({ tipe: "piutang", asli: h, nama: h.nama, kategori: "Piutang", tanggal: h.tanggal }));
    const dariSaldo = jumlahTransaksi > 0 ? [{ tipe: "saldo", nama: "Saldo Transaksi", kategori: "Kas & Bank", tanggal: tglHariIni }] : [];
    return [...dariAset, ...dariPiutang, ...dariSaldo];
  }, [daftar, piutangAset, jumlahTransaksi]);

  const filtered = useMemo(() => {
    let hasil = gabungan.filter((i) => i.nama.toLowerCase().includes(q.toLowerCase()));
    if (kategoriAktif !== "semua") hasil = hasil.filter((i) => i.kategori === kategoriAktif);
    return [...hasil].sort((a, b) => parseTglID(b.tanggal) - parseTglID(a.tanggal));
  }, [gabungan, q, kategoriAktif]);

  return (
    <div className="px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-[22px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
          Aset
        </h2>
        <button
          onClick={() => { setEditItem(null); setFormOpen(true); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1B2A26] text-white"
        >
          <Plus size={17} />
        </button>
      </div>

      <div className="rounded-2xl bg-[#EAF2EE] p-4 mb-3">
        <div className="text-[11px] uppercase tracking-wide text-[#2F6F5E] font-medium mb-1">Total Aset</div>
        <div className="text-[24px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(totalAset)}</div>
      </div>

      {hutangTersedia && (
        <div className="rounded-2xl bg-white border border-[#E7E1D3] p-4 mb-5">
          <div className="text-[11px] uppercase tracking-wide text-[#8B8579] font-medium mb-1">Kekayaan Bersih (Net Worth)</div>
          <div
            className="text-[18px] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: totalAset - totalHutangSisa < 0 ? "#B5533C" : "#1B2A26" }}
          >
            {rupiah(totalAset - totalHutangSisa)}
          </div>
          <div className="text-[11px] text-[#8B8579] mt-1">Total Aset {rupiah(totalAset)} (termasuk Saldo {rupiah(saldo)} & Piutang {rupiah(totalPiutangSisa)}) − Sisa Hutang {rupiah(totalHutangSisa)}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        {KATEGORI_ASET_TAMPIL.map((k) => {
          const Ikon = IKON_KATEGORI_ASET[k];
          const warna = WARNA_KATEGORI_ASET[k];
          return (
            <div key={k} className="rounded-2xl border border-[#E7E1D3] bg-white p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${warna}1A`, color: warna }}>
                  <Ikon size={13} />
                </div>
                <span className="text-[11px] text-[#8B8579] truncate">{k}</span>
              </div>
              <div className="text-[13px] font-semibold text-[#1B2A26]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rupiah(totalPerKategori[k])}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5">
          <Search size={15} className="text-[#8B8579]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari aset…"
            className="flex-1 text-[13px] text-[#1B2A26] bg-transparent outline-none placeholder:text-[#8B8579]"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setKategoriAktif("semua")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${kategoriAktif === "semua" ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
        >
          Semua
        </button>
        {KATEGORI_ASET_TAMPIL.map((k) => (
          <button
            key={k}
            onClick={() => setKategoriAktif(k)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium ${kategoriAktif === k ? "bg-[#1B2A26] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            {k}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-[#8B8579] mb-3">{filtered.length} dari {gabungan.length} aset</p>

      {filtered.length === 0 ? (
        <p className="text-[13px] text-[#8B8579] text-center py-10">Belum ada aset yang cocok.</p>
      ) : (
        <div className="rounded-2xl border border-[#E7E1D3] overflow-hidden bg-white">
          {filtered.map((item) => {
            if (item.tipe === "piutang") {
              const { sisa, status } = statusHutang(item.asli);
              return (
                <KartuAsetOtomatis
                  key={`p-${item.asli.id}`}
                  nama={item.asli.nama}
                  keterangan={`Piutang · ${item.asli.tanggal}`}
                  badge={status}
                  warnaBadge={warnaBadgeStatus(status)}
                  nilai={sisa}
                  ikon={Users}
                  warna={WARNA_KATEGORI_ASET.Piutang}
                  goTo={goTo}
                  tabTujuan="hutang"
                  judulTujuan="Hutang"
                />
              );
            }
            if (item.tipe === "saldo") {
              return (
                <KartuAsetOtomatis
                  key="saldo-transaksi"
                  nama="Saldo Transaksi"
                  keterangan="Kas & Bank · otomatis dari transaksi"
                  nilai={saldo}
                  ikon={Landmark}
                  warna={WARNA_KATEGORI_ASET["Kas & Bank"]}
                  goTo={goTo}
                  tabTujuan="transaksi"
                  judulTujuan="Transaksi"
                />
              );
            }
            return (
              <KartuAset
                key={item.asli.id}
                item={item.asli}
                onEdit={() => { setEditItem(item.asli); setFormOpen(true); }}
                onDelete={() => onHapus(item.asli.id)}
              />
            );
          })}
        </div>
      )}

      {formOpen && (
        <FormAset
          initial={editItem}
          onClose={() => setFormOpen(false)}
          onSubmit={(data) => (editItem ? onEdit(data) : onTambah(data))}
        />
      )}
    </div>
  );
}

// ---------- FORM TAMBAH TRANSAKSI ----------
function FormTambah({ initial, onClose, onSubmit }) {
  const [tipe, setTipe] = useState(initial ? (initial.jumlah < 0 ? "keluar" : "masuk") : "keluar");
  const [nama, setNama] = useState(initial?.nama || "");
  const [jumlah, setJumlah] = useState(initial ? String(Math.abs(initial.jumlah)) : "");
  const [kat, setKat] = useState(initial?.kat || KATEGORI_PENGELUARAN[0]);
  const [metode, setMetode] = useState(initial?.metode || "Cash");
  const [tanggal, setTanggal] = useState(initial ? tglKeInput(initial.tgl) : todayInput());
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [errors, setErrors] = useState({});

  const daftarKat = tipe === "keluar" ? KATEGORI_PENGELUARAN : SUMBER_PEMASUKAN;

  const gantiTipe = (t) => {
    setTipe(t);
    setKat(t === "keluar" ? KATEGORI_PENGELUARAN[0] : SUMBER_PEMASUKAN[0]);
    setErrors({});
  };

  const submit = () => {
    const nilai = Number(jumlah);
    const err = {};
    if (!nama.trim()) err.nama = "Nama transaksi wajib diisi.";
    if (!jumlah || nilai <= 0) err.jumlah = "Jumlah harus lebih besar dari 0.";
    if (!kat) err.kat = tipe === "keluar" ? "Kategori wajib dipilih." : "Sumber wajib dipilih.";
    if (!tanggal) err.tanggal = "Tanggal wajib diisi.";
    if (Object.keys(err).length) return setErrors(err);

    onSubmit({
      nama: nama.trim(),
      tgl: formatTglDariInput(tanggal),
      kat,
      metode,
      catatan: catatan.trim(),
      jumlah: tipe === "keluar" ? -Math.abs(nilai) : Math.abs(nilai),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#F6F3EC] rounded-t-3xl p-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-[#1B2A26]" style={{ fontFamily: "'Fraunces', serif" }}>
            {initial ? "Edit Transaksi" : "Tambah Transaksi"}
          </h3>
          <button onClick={onClose} className="text-[#8B8579]">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => gantiTipe("keluar")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium ${tipe === "keluar" ? "bg-[#B5533C] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => gantiTipe("masuk")}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium ${tipe === "masuk" ? "bg-[#2F6F5E] text-white" : "bg-white border border-[#E7E1D3] text-[#8B8579]"}`}
          >
            Pemasukan
          </button>
        </div>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1">Nama Transaksi</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder={tipe === "keluar" ? "Contoh: Makan siang" : "Contoh: Gaji Juli"}
          className={`w-full bg-white border rounded-xl px-3 py-2.5 text-[14px] mb-1 outline-none focus:border-[#2F6F5E] ${errors.nama ? "border-[#B5533C]" : "border-[#E7E1D3]"}`}
        />
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
          {tipe === "keluar" ? "Kategori" : "Sumber Pemasukan"}
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

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Metode</label>
        <select
          value={metode}
          onChange={(e) => setMetode(e.target.value)}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-2 outline-none focus:border-[#2F6F5E]"
        >
          {METODE_LIST.map((m) => <option key={m}>{m}</option>)}
        </select>

        <label className="block text-[11px] uppercase tracking-wide text-[#8B8579] mb-1 mt-2">Catatan (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tambahkan detail tambahan…"
          rows={2}
          className="w-full bg-white border border-[#E7E1D3] rounded-xl px-3 py-2.5 text-[14px] mb-3 outline-none focus:border-[#2F6F5E] resize-none"
        />

        <button onClick={submit} className="w-full bg-[#1B2A26] text-white py-3 rounded-xl text-[14px] font-medium mt-1">
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
}

// ---------- APP ----------
export default function BukuKasApp() {
  const [tab, setTab] = useState("beranda");
  const [transaksi, setTransaksi] = useState(INITIAL_TRANSAKSI);
  const [hutang, setHutang] = useState([]);
  const [aset, setAset] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("buku-kas-transaksi");
      if (saved) setTransaksi(JSON.parse(saved));
      const savedHutang = localStorage.getItem("buku-kas-hutang");
      if (savedHutang) setHutang(JSON.parse(savedHutang));
      const savedAset = localStorage.getItem("buku-kas-aset");
      if (savedAset) setAset(JSON.parse(savedAset));
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

  const pemasukan = transaksi.filter((t) => t.jumlah > 0).reduce((a, t) => a + t.jumlah, 0);
  const pengeluaran = Math.abs(transaksi.filter((t) => t.jumlah < 0).reduce((a, t) => a + t.jumlah, 0));
  const saldo = pemasukan - pengeluaran;
  const kategoriData = hitungKategori(transaksi);
  const trenData = hitungTren(transaksi);

  const tambahTransaksi = (data) => setTransaksi((prev) => [data, ...prev]);
  const hapusTransaksi = (index) => setTransaksi((prev) => prev.filter((_, i) => i !== index));
  const editTransaksi = (index, data) => setTransaksi((prev) => prev.map((t, i) => (i === index ? data : t)));

  const tambahHutang = (data) => setHutang((prev) => [...prev, data]);
  const editHutang = (data) => setHutang((prev) => prev.map((h) => (h.id === data.id ? data : h)));
  const hapusHutang = (id) => setHutang((prev) => prev.filter((h) => h.id !== id));
  const bayarHutang = (id, jml) => {
    const target = hutang.find((h) => h.id === id);
    if (!target) return;
    const tglHariIni = formatTglDariInput(todayInput());
    setHutang((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, terbayar: h.terbayar + jml, pembayaran: [...h.pembayaran, { tanggal: tglHariIni, jumlah: jml }] }
          : h
      )
    );
    // integrasi otomatis ke data transaksi
    tambahTransaksi({
      nama: `${target.jenis === "piutang" ? "Terima piutang" : "Bayar hutang"} — ${target.nama}`,
      tgl: tglHariIni,
      kat: target.jenis === "piutang" ? "Piutang" : "Hutang",
      metode: "Cash",
      catatan: `Pembayaran ${target.jenis} atas nama ${target.nama}`,
      jumlah: target.jenis === "piutang" ? Math.abs(jml) : -Math.abs(jml),
    });
  };

  const totalHutangSisa = hutang.filter((h) => h.jenis === "hutang").reduce((a, h) => a + statusHutang(h).sisa, 0);

  const tambahAset = (data) => setAset((prev) => [...prev, data]);
  const editAset = (data) => setAset((prev) => prev.map((a) => (a.id === data.id ? data : a)));
  const hapusAset = (id) => setAset((prev) => prev.filter((a) => a.id !== id));

  const NAV = [
    { id: "beranda", label: "Beranda", icon: Home },
    { id: "transaksi", label: "Transaksi", icon: Receipt },
    { id: "aset", label: "Aset", icon: Wallet },
    { id: "hutang", label: "Hutang", icon: HandCoins },
    { id: "statistik", label: "Statistik", icon: PieIcon },
    { id: "lainnya", label: "Lainnya", icon: MoreHorizontal },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F6F3EC] flex justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @media print {
          body * { visibility: hidden; }
          #area-laporan, #area-laporan * { visibility: visible; }
          #area-laporan { position: absolute; top: 0; left: 0; width: 100%; border: none; }
        }
      `}</style>

      <div className="relative w-full max-w-sm bg-[#F6F3EC] min-h-screen pl-4">
        <Spine />

        <header className="px-6 pt-7 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1B2A26] flex items-center justify-center">
              <span className="text-[#F6F3EC] text-[13px] font-serif" style={{ fontFamily: "'Fraunces', serif" }}>B</span>
            </div>
            <span className="font-serif text-[16px] text-[#1B2A26] tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Buku Kas
            </span>
          </div>
          <span className="text-[11px] text-[#8B8579] border border-[#E7E1D3] rounded-full px-2.5 py-1">Semua Waktu</span>
        </header>

        <main className="pb-24">
          {!loaded ? (
            <p className="text-[12px] text-[#8B8579] text-center py-10">Memuat data…</p>
          ) : (
            <>
              {tab === "beranda" && (
                <Beranda goTo={setTab} transaksi={transaksi} saldo={saldo} pemasukan={pemasukan} pengeluaran={pengeluaran} />
              )}
              {tab === "transaksi" && <Transaksi transaksi={transaksi} onDelete={hapusTransaksi} onEdit={editTransaksi} />}
              {tab === "aset" && (
                <Aset
                  daftar={aset}
                  hutang={hutang}
                  saldo={saldo}
                  jumlahTransaksi={transaksi.length}
                  totalHutangSisa={totalHutangSisa}
                  hutangTersedia={true}
                  onTambah={tambahAset}
                  onEdit={editAset}
                  onHapus={hapusAset}
                  goTo={setTab}
                />
              )}
              {tab === "hutang" && (
                <HutangPiutang daftar={hutang} onTambah={tambahHutang} onEdit={editHutang} onHapus={hapusHutang} onBayar={bayarHutang} />
              )}
              {tab === "statistik" && <Statistik kategori={kategoriData} tren={trenData} totalPengeluaran={pengeluaran} />}
              {tab === "lainnya" && <Lainnya transaksi={transaksi} aset={aset} hutang={hutang} />}
            </>
          )}
        </main>

        {(tab === "beranda" || tab === "transaksi") && (
          <button
            onClick={() => setFormOpen(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#1B2A26] text-white flex items-center justify-center shadow-lg z-20"
          >
            <Plus size={22} />
          </button>
        )}

        {formOpen && <FormTambah onClose={() => setFormOpen(false)} onSubmit={tambahTransaksi} />}

        <nav className="fixed bottom-0 w-full max-w-sm bg-[#F6F3EC]/95 backdrop-blur border-t border-[#E7E1D3] px-0.5 py-2 flex justify-around">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center gap-0.5 px-1 py-1"
            >
              <Icon size={17} strokeWidth={2} color={tab === id ? "#1B2A26" : "#B3AC9A"} />
              <span className={`text-[8px] ${tab === id ? "text-[#1B2A26] font-medium" : "text-[#B3AC9A]"}`}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
