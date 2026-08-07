import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CreditCard,
  GraduationCap,
  HandCoins,
  Landmark,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Plane,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  BAGIAN_RENCANA,
  KATEGORI_TARGET_MENABUNG,
  cicilanTerdekat,
  formatTanggalRencana,
  progresTarget,
  ringkasanAnggaran,
  ringkasanCicilan,
  saldoBebasTarget,
  totalAlokasiTarget,
  totalSisaCicilan,
  totalTerbayarCicilan,
  penggunaanAnggaran,
} from "./domain.js";

const rupiahRencana = (nilai) =>
  `Rp ${Math.round(Number(nilai) || 0).toLocaleString("id-ID")}`;

const angkaInput = (nilai) => String(nilai ?? "").replace(/[^0-9]/g, "");
const tanggalHariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CONTROL = "w-full h-11 rounded-lg border border-[#DCE4E0] bg-white px-3 text-[13px] text-[#1B2A26] outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/10";
const LABEL = "block mb-1.5 text-[10px] font-semibold text-[#67716C]";

function InputNominalRencana({ value, onChange, placeholder = "0", ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#65716B]">Rp</span>
      <input
        {...props}
        inputMode="numeric"
        value={value ? Number(value).toLocaleString("id-ID") : ""}
        onChange={(event) => onChange(angkaInput(event.target.value))}
        placeholder={placeholder}
        className={`${CONTROL} pl-9 font-medium tabular-nums`}
      />
    </div>
  );
}

function ProgressBar({ value, tone = "hijau" }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  const warna = tone === "merah" ? "#B5533C" : tone === "emas" ? "#B9862F" : "#2F6F5E";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#E9EEEB]" aria-hidden="true">
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${width}%`, backgroundColor: warna }} />
    </div>
  );
}

function ModalRencana({ judul, subjudul, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex justify-center bg-[#E9EFEC]" role="dialog" aria-modal="true" aria-label={judul}>
      <div className="flex h-[100dvh] w-full max-w-[480px] min-w-0 flex-col bg-[#F7F9F8]">
        <header className="flex min-h-[66px] items-center gap-3 border-b border-[#DEE6E2] bg-white px-4">
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#DEE6E2] text-[#34453E]" aria-label="Tutup">
            <X size={17} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-[#17231F]">{judul}</h2>
            {subjudul && <p className="mt-0.5 truncate text-[10.5px] text-[#77817C]">{subjudul}</p>}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

function KonfirmasiHapus({ judul, detail, onBatal, onHapus }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/30 px-5" role="alertdialog" aria-modal="true" aria-label={judul}>
      <div className="w-full max-w-sm rounded-lg border border-[#E2E7E4] bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F8E9E5] text-[#B5533C]"><AlertTriangle size={17} /></span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[#17231F]">{judul}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[#727C77]">{detail}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onBatal} className="h-10 rounded-lg border border-[#DCE4E0] text-[12px] font-semibold text-[#55615C]">Batal</button>
          <button type="button" onClick={onHapus} className="h-10 rounded-lg bg-[#B5533C] text-[12px] font-semibold text-white">Hapus</button>
        </div>
      </div>
    </div>
  );
}

function EmptyRencana({ icon: Icon, judul, detail, aksi, onAksi }) {
  return (
    <div className="py-12 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg border border-[#DEE6E2] bg-white text-[#2F6F5E]"><Icon size={19} /></span>
      <h3 className="mt-3 text-[13px] font-semibold text-[#24332D]">{judul}</h3>
      <p className="mx-auto mt-1 max-w-[280px] text-[10.5px] leading-relaxed text-[#7B847F]">{detail}</p>
      <button type="button" onClick={onAksi} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2F6F5E] px-3 text-[11px] font-semibold text-white">
        <Plus size={14} /> {aksi}
      </button>
    </div>
  );
}

function JudulDomain({ title, description, onTambah, labelTambah, disabled = false }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-[#17231F]">{title}</h2>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[#79837E]">{description}</p>
      </div>
      <button type="button" disabled={disabled} onClick={onTambah} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#245F50] px-3 text-[10.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
        <Plus size={14} /> {labelTambah}
      </button>
    </div>
  );
}

function FormAnggaran({ initial, kategoriTersedia, onClose, onSubmit }) {
  const [kategori, setKategori] = useState(initial?.kategori || kategoriTersedia[0] || "Lainnya");
  const [batas, setBatas] = useState(initial?.batas ? String(initial.batas) : "");
  const [error, setError] = useState("");

  const simpan = (event) => {
    event.preventDefault();
    const nilai = Number(batas);
    if (!kategori || !Number.isFinite(nilai) || nilai <= 0) {
      setError("Pilih kategori dan isi batas anggaran lebih dari Rp 0.");
      return;
    }
    onSubmit({ ...initial, kategori, batas: nilai });
  };

  return (
    <ModalRencana judul={initial ? "Edit Anggaran" : "Tambah Anggaran"} subjudul="Batas pengeluaran per kategori setiap bulan" onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        <div>
          <label className={LABEL}>Kategori pengeluaran</label>
          <select value={kategori} onChange={(event) => { setKategori(event.target.value); setError(""); }} className={CONTROL}>
            {kategoriTersedia.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Batas per bulan</label>
          <InputNominalRencana value={batas} onChange={(value) => { setBatas(value); setError(""); }} autoFocus />
        </div>
        <div className="rounded-lg border border-[#DDE8E3] bg-[#F2F7F4] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#52635B]">
          Anggaran adalah batas kontrol. Menambah atau mengubah anggaran tidak memindahkan saldo akun.
        </div>
        {error && <p className="text-[10.5px] text-[#B5533C]">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-lg bg-[#245F50] text-[12px] font-semibold text-white">Simpan Anggaran</button>
      </form>
    </ModalRencana>
  );
}

function AnggaranView({ daftar, transaksi, kategoriPengeluaran, onSimpan, onHapus }) {
  const [form, setForm] = useState(null);
  const [hapus, setHapus] = useState(null);
  const ringkasan = useMemo(() => ringkasanAnggaran(daftar, transaksi), [daftar, transaksi]);
  const kategoriTersedia = kategoriPengeluaran.filter((kategori) => !daftar.some((item) => item.kategori === kategori));

  const bukaTambah = () => setForm({ mode: "tambah" });
  const daftarKategoriForm = form?.item
    ? [form.item.kategori, ...kategoriTersedia.filter((item) => item !== form.item.kategori)]
    : kategoriTersedia.length ? kategoriTersedia : kategoriPengeluaran;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-2">
      <JudulDomain title="Anggaran Bulanan" description="Batas belanja berdasarkan kategori transaksi." onTambah={bukaTambah} labelTambah="Anggaran" disabled={kategoriTersedia.length === 0} />

      <section className="mb-3 rounded-lg border border-[#DDE5E1] bg-white p-3.5" aria-label="Ringkasan anggaran">
        <div className="grid grid-cols-3 divide-x divide-[#E8ECEA]">
          <div className="pr-2"><p className="text-[9px] text-[#7A837F]">Batas</p><strong className="mt-1 block truncate text-[11px] tabular-nums text-[#22312B]">{rupiahRencana(ringkasan.batas)}</strong></div>
          <div className="px-2"><p className="text-[9px] text-[#7A837F]">Terpakai</p><strong className="mt-1 block truncate text-[11px] tabular-nums text-[#B5533C]">{rupiahRencana(ringkasan.terpakai)}</strong></div>
          <div className="pl-2"><p className="text-[9px] text-[#7A837F]">Tersisa</p><strong className={`mt-1 block truncate text-[11px] tabular-nums ${ringkasan.sisa < 0 ? "text-[#B5533C]" : "text-[#2F6F5E]"}`}>{rupiahRencana(ringkasan.sisa)}</strong></div>
        </div>
        <div className="mt-3"><ProgressBar value={ringkasan.persen} tone={ringkasan.persen >= 100 ? "merah" : ringkasan.persen >= 85 ? "emas" : "hijau"} /></div>
      </section>

      {daftar.length === 0 ? (
        <EmptyRencana icon={Receipt} judul="Belum ada anggaran" detail="Tetapkan batas pada kategori yang paling penting untuk dikendalikan." aksi="Tambah Anggaran" onAksi={bukaTambah} />
      ) : (
        <div className="space-y-2">
          {daftar.map((item) => {
            const terpakai = penggunaanAnggaran(item, transaksi);
            const persen = item.batas > 0 ? (terpakai / item.batas) * 100 : 0;
            const sisa = item.batas - terpakai;
            return (
              <article key={item.id} className="rounded-lg border border-[#DEE5E1] bg-white px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[12.5px] font-semibold text-[#1C2B25]">{item.kategori}</h3>
                    <p className="mt-0.5 text-[9.5px] text-[#7A837F]">{Math.round(persen)}% terpakai bulan ini</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => setForm({ mode: "edit", item })} className="grid h-7 w-7 place-items-center rounded-lg text-[#64716B] hover:bg-[#F0F4F2]" aria-label={`Edit anggaran ${item.kategori}`} title="Edit"><Pencil size={13} /></button>
                    <button type="button" onClick={() => setHapus(item)} className="grid h-7 w-7 place-items-center rounded-lg text-[#A45B4A] hover:bg-[#F8EFEC]" aria-label={`Hapus anggaran ${item.kategori}`} title="Hapus"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="mt-2.5"><ProgressBar value={persen} tone={persen >= 100 ? "merah" : persen >= 85 ? "emas" : "hijau"} /></div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[9.5px]">
                  <span className="text-[#717C76]">{rupiahRencana(terpakai)} / {rupiahRencana(item.batas)}</span>
                  <span className={sisa < 0 ? "font-semibold text-[#B5533C]" : "font-semibold text-[#2F6F5E]"}>{sisa < 0 ? `Lewat ${rupiahRencana(Math.abs(sisa))}` : `Sisa ${rupiahRencana(sisa)}`}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <FormAnggaran
          initial={form.item}
          kategoriTersedia={daftarKategoriForm}
          onClose={() => setForm(null)}
          onSubmit={(data) => { onSimpan(data); setForm(null); }}
        />
      )}
      {hapus && <KonfirmasiHapus judul={`Hapus anggaran ${hapus.kategori}?`} detail="Riwayat transaksi tidak ikut terhapus. Hanya batas anggarannya yang dihapus." onBatal={() => setHapus(null)} onHapus={() => { onHapus(hapus.id); setHapus(null); }} />}
    </div>
  );
}

const IKON_TARGET = {
  Barang: ShoppingBag,
  "Jalan-jalan": Plane,
  "Dana Darurat": ShieldCheck,
  Pendidikan: GraduationCap,
  Ibadah: Landmark,
  Lainnya: MoreHorizontal,
};

function FormTarget({ initial, onClose, onSubmit }) {
  const [nama, setNama] = useState(initial?.nama || "");
  const [kategori, setKategori] = useState(initial?.kategori || KATEGORI_TARGET_MENABUNG[0]);
  const [target, setTarget] = useState(initial?.target ? String(initial.target) : "");
  const [targetDate, setTargetDate] = useState(initial?.targetDate || "");
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [error, setError] = useState("");

  const simpan = (event) => {
    event.preventDefault();
    const nilaiTarget = Number(target);
    if (!nama.trim()) return setError("Nama target wajib diisi.");
    if (!Number.isFinite(nilaiTarget) || nilaiTarget <= 0) return setError("Nominal target harus lebih dari Rp 0.");
    if (nilaiTarget < Number(initial?.terkumpul || 0)) return setError("Target tidak boleh lebih kecil dari dana yang sudah dialokasikan.");
    onSubmit({ ...initial, nama: nama.trim(), kategori, target: nilaiTarget, targetDate, catatan: catatan.trim(), terkumpul: Number(initial?.terkumpul || 0) });
  };

  return (
    <ModalRencana judul={initial ? "Edit Target Menabung" : "Target Menabung Baru"} subjudul="Untuk barang, perjalanan, dana darurat, atau tujuan lain" onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        <div><label className={LABEL}>Nama target</label><input value={nama} onChange={(e) => { setNama(e.target.value.slice(0, 50)); setError(""); }} placeholder="Contoh: Liburan ke Jepang" className={CONTROL} autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>Tujuan</label><select value={kategori} onChange={(e) => setKategori(e.target.value)} className={CONTROL}>{KATEGORI_TARGET_MENABUNG.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className={LABEL}>Tenggat</label><input type="date" value={targetDate} min={initial ? undefined : tanggalHariIni()} onChange={(e) => setTargetDate(e.target.value)} className={CONTROL} /></div>
        </div>
        <div><label className={LABEL}>Nominal target</label><InputNominalRencana value={target} onChange={(value) => { setTarget(value); setError(""); }} /></div>
        <div><label className={LABEL}>Catatan</label><textarea value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 160))} placeholder="Opsional" className={`${CONTROL} h-[74px] py-3 resize-none`} /></div>
        <div className="rounded-lg border border-[#DDE8E3] bg-[#F2F7F4] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#52635B]">Dana target adalah alokasi dari saldo yang sudah ada, bukan pengeluaran atau akun baru.</div>
        {error && <p className="text-[10.5px] text-[#B5533C]">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-lg bg-[#245F50] text-[12px] font-semibold text-white">Simpan Target</button>
      </form>
    </ModalRencana>
  );
}

function FormAlokasi({ item, saldoBebas, onClose, onSubmit }) {
  const progress = progresTarget(item);
  const [mode, setMode] = useState("tambah");
  const [jumlah, setJumlah] = useState("");
  const [error, setError] = useState("");
  const maksimum = mode === "tambah" ? Math.min(saldoBebas, progress.kurang) : progress.terkumpul;

  const simpan = (event) => {
    event.preventDefault();
    const nilai = Number(jumlah);
    if (!Number.isFinite(nilai) || nilai <= 0) return setError("Isi nominal lebih dari Rp 0.");
    if (nilai > maksimum) return setError(mode === "tambah" ? "Nominal melebihi saldo bebas yang dapat dialokasikan." : "Nominal melebihi dana target yang tersedia.");
    onSubmit(mode === "tambah" ? nilai : -nilai);
  };

  return (
    <ModalRencana judul="Kelola Dana Target" subjudul={item.nama} onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        <div className="grid grid-cols-2 rounded-lg border border-[#DCE4E0] bg-[#EEF3F0] p-1">
          {[['tambah','Alokasikan'],['kurangi','Lepaskan']].map(([id,label]) => <button key={id} type="button" onClick={() => { setMode(id); setJumlah(""); setError(""); }} className={`h-9 rounded-md text-[11px] font-semibold ${mode === id ? "bg-white text-[#245F50] shadow-sm" : "text-[#748079]"}`}>{label}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#E1E7E4] bg-white p-3">
          <div><p className="text-[9px] text-[#7B847F]">Sudah dialokasikan</p><strong className="mt-1 block text-[12px] text-[#22312B]">{rupiahRencana(progress.terkumpul)}</strong></div>
          <div><p className="text-[9px] text-[#7B847F]">{mode === "tambah" ? "Saldo bebas" : "Dapat dilepas"}</p><strong className="mt-1 block text-[12px] text-[#2F6F5E]">{rupiahRencana(maksimum)}</strong></div>
        </div>
        <div><label className={LABEL}>Nominal</label><InputNominalRencana value={jumlah} onChange={(value) => { setJumlah(value); setError(""); }} autoFocus /></div>
        {error && <p className="text-[10.5px] text-[#B5533C]">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-lg bg-[#245F50] text-[12px] font-semibold text-white">{mode === "tambah" ? "Alokasikan Dana" : "Lepaskan Dana"}</button>
      </form>
    </ModalRencana>
  );
}

function TargetView({ daftar, saldoPerencanaan, onSimpan, onHapus, onUbahDana }) {
  const [form, setForm] = useState(null);
  const [alokasi, setAlokasi] = useState(null);
  const [hapus, setHapus] = useState(null);
  const totalAlokasi = totalAlokasiTarget(daftar);
  const saldoBebas = saldoBebasTarget(daftar, saldoPerencanaan);
  const jumlahTercapai = daftar.filter((item) => progresTarget(item).tercapai).length;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-2">
      <JudulDomain title="Target Menabung" description="Alokasikan dana tanpa mengubah total kekayaan." onTambah={() => setForm({ mode: "tambah" })} labelTambah="Target" />
      <section className="mb-3 rounded-lg border border-[#DDE5E1] bg-white p-3.5">
        <div className="grid grid-cols-3 divide-x divide-[#E8ECEA]">
          <div className="pr-2"><p className="text-[9px] text-[#7A837F]">Dialokasikan</p><strong className="mt-1 block truncate text-[11px] text-[#22312B]">{rupiahRencana(totalAlokasi)}</strong></div>
          <div className="px-2"><p className="text-[9px] text-[#7A837F]">Saldo bebas</p><strong className="mt-1 block truncate text-[11px] text-[#2F6F5E]">{rupiahRencana(saldoBebas)}</strong></div>
          <div className="pl-2"><p className="text-[9px] text-[#7A837F]">Tercapai</p><strong className="mt-1 block text-[11px] text-[#22312B]">{jumlahTercapai} / {daftar.length}</strong></div>
        </div>
      </section>

      {daftar.length === 0 ? (
        <EmptyRencana icon={PiggyBank} judul="Belum ada target menabung" detail="Buat tujuan yang jelas, lalu alokasikan dana sedikit demi sedikit." aksi="Buat Target" onAksi={() => setForm({ mode: "tambah" })} />
      ) : (
        <div className="space-y-2">
          {daftar.map((item) => {
            const progress = progresTarget(item);
            const Ikon = IKON_TARGET[item.kategori] || Target;
            return (
              <article key={item.id} className="rounded-lg border border-[#DEE5E1] bg-white p-3.5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EDF5F1] text-[#2F6F5E]"><Ikon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><h3 className="truncate text-[12.5px] font-semibold text-[#1C2B25]">{item.nama}</h3><p className="mt-0.5 text-[9.5px] text-[#7A837F]">{item.kategori}{item.targetDate ? ` | ${formatTanggalRencana(item.targetDate)}` : ""}</p></div>
                      {progress.tercapai && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E6F2EC] px-2 py-1 text-[8.5px] font-semibold text-[#2F6F5E]"><Check size={10} /> Tercapai</span>}
                    </div>
                    <div className="mt-2.5"><ProgressBar value={progress.persen} /></div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[9.5px]"><span className="text-[#67736D]">{rupiahRencana(progress.terkumpul)} / {rupiahRencana(progress.target)}</span><strong className="text-[#2F6F5E]">{Math.round(progress.persen)}%</strong></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#EDF0EE] pt-2.5">
                  <button type="button" onClick={() => setAlokasi(item)} className="h-8 flex-1 rounded-lg bg-[#EDF5F1] text-[10px] font-semibold text-[#2F6F5E]">Kelola Dana</button>
                  <button type="button" onClick={() => setForm({ mode: "edit", item })} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E1E6E3] text-[#65716B]" aria-label={`Edit target ${item.nama}`} title="Edit"><Pencil size={13} /></button>
                  <button type="button" onClick={() => setHapus(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E9DCD8] text-[#A45B4A]" aria-label={`Hapus target ${item.nama}`} title="Hapus"><Trash2 size={13} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {form && <FormTarget initial={form.item} onClose={() => setForm(null)} onSubmit={(data) => { onSimpan(data); setForm(null); }} />}
      {alokasi && <FormAlokasi item={alokasi} saldoBebas={saldoBebas} onClose={() => setAlokasi(null)} onSubmit={(delta) => { onUbahDana(alokasi.id, delta); setAlokasi(null); }} />}
      {hapus && <KonfirmasiHapus judul={`Hapus target ${hapus.nama}?`} detail={Number(hapus.terkumpul || 0) > 0 ? "Dana yang dialokasikan akan dilepaskan kembali menjadi saldo bebas. Saldo akun tidak berubah." : "Target akan dihapus tanpa mengubah transaksi atau saldo akun."} onBatal={() => setHapus(null)} onHapus={() => { onHapus(hapus.id); setHapus(null); }} />}
    </div>
  );
}

function FormCicilan({ initial, onClose, onSubmit }) {
  const [nama, setNama] = useState(initial?.nama || "");
  const [penyedia, setPenyedia] = useState(initial?.penyedia || "");
  const [total, setTotal] = useState(initial?.total ? String(initial.total) : "");
  const [tenor, setTenor] = useState(initial?.tenor ? String(initial.tenor) : "12");
  const [jatuhTempoPertama, setJatuhTempoPertama] = useState(initial?.jatuhTempoPertama || tanggalHariIni());
  const [angsuranAwal, setAngsuranAwal] = useState(initial?.angsuranAwal ? String(initial.angsuranAwal) : "0");
  const [catatan, setCatatan] = useState(initial?.catatan || "");
  const [error, setError] = useState("");
  const adaRiwayat = (initial?.pembayaran || []).length > 0;

  const simpan = (event) => {
    event.preventDefault();
    const nilaiTotal = Number(total);
    const nilaiTenor = Number(tenor);
    const awal = Number(angsuranAwal) || 0;
    if (!nama.trim()) return setError("Nama cicilan wajib diisi.");
    if (!Number.isFinite(nilaiTotal) || nilaiTotal <= 0) return setError("Total kewajiban harus lebih dari Rp 0.");
    if (!Number.isInteger(nilaiTenor) || nilaiTenor < 1 || nilaiTenor > 360) return setError("Tenor harus 1 sampai 360 bulan.");
    if (!jatuhTempoPertama) return setError("Tanggal jatuh tempo pertama wajib diisi.");
    if (!Number.isInteger(awal) || awal < 0 || awal >= nilaiTenor) return setError("Jumlah cicilan yang sudah dibayar harus lebih kecil dari tenor.");
    if (initial && nilaiTotal < totalTerbayarCicilan(initial)) return setError("Total kewajiban tidak boleh lebih kecil dari pembayaran yang sudah tercatat.");
    onSubmit({ ...initial, nama: nama.trim(), penyedia: penyedia.trim(), total: nilaiTotal, tenor: nilaiTenor, jatuhTempoPertama, angsuranAwal: awal, catatan: catatan.trim(), pembayaran: initial?.pembayaran || [] });
  };

  return (
    <ModalRencana judul={initial ? "Edit Cicilan" : "Tambah Cicilan"} subjudul="Kewajiban terjadwal untuk pembelian atau pembiayaan" onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        <div><label className={LABEL}>Nama cicilan</label><input value={nama} onChange={(e) => { setNama(e.target.value.slice(0, 50)); setError(""); }} placeholder="Contoh: Laptop kerja" className={CONTROL} autoFocus /></div>
        <div><label className={LABEL}>Penyedia / merchant</label><input value={penyedia} onChange={(e) => setPenyedia(e.target.value.slice(0, 50))} placeholder="Opsional" className={CONTROL} /></div>
        <div><label className={LABEL}>Total kewajiban</label><InputNominalRencana value={total} onChange={(value) => { setTotal(value); setError(""); }} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>Tenor (bulan)</label><input inputMode="numeric" value={tenor} onChange={(e) => setTenor(angkaInput(e.target.value).slice(0, 3))} className={CONTROL} /></div>
          <div><label className={LABEL}>Sudah dibayar</label><input inputMode="numeric" value={angsuranAwal} disabled={adaRiwayat} onChange={(e) => setAngsuranAwal(angkaInput(e.target.value).slice(0, 3))} className={`${CONTROL} disabled:bg-[#EEF1EF] disabled:text-[#929995]`} aria-label="Jumlah cicilan yang sudah dibayar sebelum dicatat di aplikasi" /></div>
        </div>
        <div><label className={LABEL}>Jatuh tempo pertama</label><input type="date" value={jatuhTempoPertama} onChange={(e) => setJatuhTempoPertama(e.target.value)} className={CONTROL} /></div>
        <div><label className={LABEL}>Catatan</label><textarea value={catatan} onChange={(e) => setCatatan(e.target.value.slice(0, 160))} placeholder="Opsional" className={`${CONTROL} h-[74px] py-3 resize-none`} /></div>
        <div className="rounded-lg border border-[#E7E1D4] bg-[#FAF7F0] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#665F51]">Cicilan dicatat sebagai kewajiban. Saldo baru berkurang saat pembayaran benar-benar dilakukan.</div>
        {error && <p className="text-[10.5px] text-[#B5533C]">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-lg bg-[#245F50] text-[12px] font-semibold text-white">Simpan Cicilan</button>
      </form>
    </ModalRencana>
  );
}

function FormBayarCicilan({ item, akunSaldo, onClose, onSubmit }) {
  const info = ringkasanCicilan(item);
  const [akunId, setAkunId] = useState(akunSaldo[0]?.id || "saldo-transaksi");
  const [jumlah, setJumlah] = useState(info.tagihanBerikut ? String(Math.round(info.tagihanBerikut)) : "");
  const [biaya, setBiaya] = useState("0");
  const [error, setError] = useState("");
  const akun = akunSaldo.find((itemAkun) => itemAkun.id === akunId);

  const simpan = (event) => {
    event.preventDefault();
    const nilai = Number(jumlah);
    const nilaiBiaya = Number(biaya) || 0;
    if (!Number.isFinite(nilai) || nilai <= 0) return setError("Nominal pembayaran harus lebih dari Rp 0.");
    if (nilai > info.sisa) return setError("Pembayaran melebihi sisa kewajiban.");
    if (nilai + nilaiBiaya > Number(akun?.saldo || 0)) return setError("Saldo akun yang dipilih tidak mencukupi.");
    onSubmit({ jumlah: nilai, biaya: nilaiBiaya, akunId });
  };

  return (
    <ModalRencana judul="Bayar Cicilan" subjudul={item.nama} onClose={onClose}>
      <form onSubmit={simpan} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#E1E7E4] bg-white p-3"><div><p className="text-[9px] text-[#7B847F]">Tagihan berikut</p><strong className="mt-1 block text-[12px] text-[#22312B]">{rupiahRencana(info.tagihanBerikut)}</strong></div><div><p className="text-[9px] text-[#7B847F]">Jatuh tempo</p><strong className="mt-1 block text-[12px] text-[#22312B]">{formatTanggalRencana(info.jatuhTempo)}</strong></div></div>
        <div><label className={LABEL}>Bayar dari akun</label><select value={akunId} onChange={(e) => { setAkunId(e.target.value); setError(""); }} className={CONTROL}>{akunSaldo.map((itemAkun) => <option key={itemAkun.id} value={itemAkun.id}>{itemAkun.nama} - {rupiahRencana(itemAkun.saldo)}</option>)}</select></div>
        <div><label className={LABEL}>Bayar pokok</label><InputNominalRencana value={jumlah} onChange={(value) => { setJumlah(value); setError(""); }} autoFocus /></div>
        <div><label className={LABEL}>Biaya / denda</label><InputNominalRencana value={biaya} onChange={(value) => { setBiaya(value || "0"); setError(""); }} /></div>
        <div className="rounded-lg border border-[#DDE8E3] bg-[#F2F7F4] px-3 py-2.5 text-[10.5px] leading-relaxed text-[#52635B]">Pokok mengurangi kewajiban dan saldo. Biaya atau denda dicatat terpisah sebagai pengeluaran.</div>
        {error && <p className="text-[10.5px] text-[#B5533C]">{error}</p>}
        <button type="submit" className="h-11 w-full rounded-lg bg-[#245F50] text-[12px] font-semibold text-white">Catat Pembayaran</button>
      </form>
    </ModalRencana>
  );
}

function CicilanView({ daftar, akunSaldo, onSimpan, onHapus, onBayar }) {
  const [form, setForm] = useState(null);
  const [bayar, setBayar] = useState(null);
  const [hapus, setHapus] = useState(null);
  const totalSisa = totalSisaCicilan(daftar);
  const terdekat = cicilanTerdekat(daftar);
  const aktif = daftar.filter((item) => ringkasanCicilan(item).sisa > 0).length;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-2">
      <JudulDomain title="Cicilan" description="Jadwal kewajiban dan pembayaran yang terhubung ke ledger." onTambah={() => setForm({ mode: "tambah" })} labelTambah="Cicilan" />
      <section className="mb-3 rounded-lg border border-[#DDE5E1] bg-white p-3.5">
        <div className="grid grid-cols-3 divide-x divide-[#E8ECEA]">
          <div className="pr-2"><p className="text-[9px] text-[#7A837F]">Sisa kewajiban</p><strong className="mt-1 block truncate text-[11px] text-[#B5533C]">{rupiahRencana(totalSisa)}</strong></div>
          <div className="px-2"><p className="text-[9px] text-[#7A837F]">Aktif</p><strong className="mt-1 block text-[11px] text-[#22312B]">{aktif} cicilan</strong></div>
          <div className="pl-2"><p className="text-[9px] text-[#7A837F]">Terdekat</p><strong className="mt-1 block truncate text-[11px] text-[#22312B]">{terdekat ? formatTanggalRencana(terdekat.info.jatuhTempo) : "-"}</strong></div>
        </div>
      </section>

      {daftar.length === 0 ? (
        <EmptyRencana icon={CreditCard} judul="Belum ada cicilan" detail="Catat kewajiban terjadwal agar jatuh tempo dan sisa pembayaran selalu terlihat." aksi="Tambah Cicilan" onAksi={() => setForm({ mode: "tambah" })} />
      ) : (
        <div className="space-y-2">
          {daftar.map((item) => {
            const info = ringkasanCicilan(item);
            const terlambat = info.status === "Terlambat";
            const dekat = info.status === "Jatuh Tempo";
            const lunas = info.status === "Lunas";
            const bisaHapus = totalTerbayarCicilan(item) <= 0;
            return (
              <article key={item.id} className="rounded-lg border border-[#DEE5E1] bg-white p-3.5">
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${terlambat ? "bg-[#F8E9E5] text-[#B5533C]" : "bg-[#F3F0E8] text-[#8C6B2E]"}`}><CreditCard size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><h3 className="truncate text-[12.5px] font-semibold text-[#1C2B25]">{item.nama}</h3><p className="mt-0.5 truncate text-[9.5px] text-[#7A837F]">{item.penyedia || "Cicilan"} | {info.angsuranSelesai}/{info.tenor} periode</p></div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[8.5px] font-semibold ${lunas ? "bg-[#E6F2EC] text-[#2F6F5E]" : terlambat ? "bg-[#F8E9E5] text-[#B5533C]" : dekat ? "bg-[#F8F0DF] text-[#9A6A1E]" : "bg-[#EEF2F0] text-[#64716B]"}`}>{info.status}</span>
                    </div>
                    <div className="mt-2.5"><ProgressBar value={info.persen} tone={terlambat ? "merah" : dekat ? "emas" : "hijau"} /></div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[9.5px]"><span className="text-[#67736D]">Sisa {rupiahRencana(info.sisa)}</span><span className="font-semibold text-[#3C4C45]">{lunas ? "Selesai" : `${rupiahRencana(info.tagihanBerikut)} | ${formatTanggalRencana(info.jatuhTempo)}`}</span></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#EDF0EE] pt-2.5">
                  <button type="button" disabled={lunas} onClick={() => setBayar(item)} className="h-8 flex-1 rounded-lg bg-[#EDF5F1] text-[10px] font-semibold text-[#2F6F5E] disabled:opacity-45">Bayar Cicilan</button>
                  <button type="button" onClick={() => setForm({ mode: "edit", item })} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E1E6E3] text-[#65716B]" aria-label={`Edit cicilan ${item.nama}`} title="Edit"><Pencil size={13} /></button>
                  <button type="button" disabled={!bisaHapus} onClick={() => setHapus(item)} className="grid h-8 w-8 place-items-center rounded-lg border border-[#E9DCD8] text-[#A45B4A] disabled:cursor-not-allowed disabled:opacity-35" aria-label={`Hapus cicilan ${item.nama}`} title={bisaHapus ? "Hapus" : "Cicilan dengan riwayat pembayaran tidak dapat dihapus"}><Trash2 size={13} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {form && <FormCicilan initial={form.item} onClose={() => setForm(null)} onSubmit={(data) => { onSimpan(data); setForm(null); }} />}
      {bayar && <FormBayarCicilan item={bayar} akunSaldo={akunSaldo} onClose={() => setBayar(null)} onSubmit={(data) => { onBayar(bayar.id, data); setBayar(null); }} />}
      {hapus && <KonfirmasiHapus judul={`Hapus cicilan ${hapus.nama}?`} detail="Cicilan tanpa riwayat pembayaran dapat dihapus. Tidak ada transaksi yang akan berubah." onBatal={() => setHapus(null)} onHapus={() => { onHapus(hapus.id); setHapus(null); }} />}
    </div>
  );
}

const TAB_RENCANA = [
  { id: "anggaran", label: "Anggaran", icon: Receipt },
  { id: "target", label: "Target", icon: Target },
  { id: "cicilan", label: "Cicilan", icon: CreditCard },
  { id: "hutang", label: "Utang", icon: HandCoins },
];

export default function Rencana({
  initialSection = "anggaran",
  hideNavigation = false,
  anggaran = [],
  targetMenabung = [],
  cicilan = [],
  transaksi = [],
  kategoriPengeluaran = [],
  saldoPerencanaan = 0,
  akunSaldo = [],
  hutangView = null,
  onSimpanAnggaran,
  onHapusAnggaran,
  onSimpanTarget,
  onHapusTarget,
  onUbahDanaTarget,
  onSimpanCicilan,
  onHapusCicilan,
  onBayarCicilan,
  onSectionChange,
}) {
  const [section, setSection] = useState(BAGIAN_RENCANA.includes(initialSection) ? initialSection : "anggaran");

  useEffect(() => {
    if (BAGIAN_RENCANA.includes(initialSection)) setSection(initialSection);
  }, [initialSection]);

  const pilih = (id) => {
    setSection(id);
    onSectionChange?.(id);
  };

  if (hideNavigation && section === "hutang") {
    return <div className="h-full min-h-0 overflow-hidden">{hutangView}</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F8F6]">
      <div className="shrink-0 px-4 pb-2 pt-1">
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#DDE5E1] bg-[#E9EFEC] p-1" role="tablist" aria-label="Bagian rencana keuangan">
          {TAB_RENCANA.map(({ id, label, icon: Icon }) => {
            const aktif = section === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={aktif} onClick={() => pilih(id)} className={`flex h-10 min-w-0 items-center justify-center gap-1 rounded-md px-1 text-[9.5px] font-semibold transition-colors ${aktif ? "bg-white text-[#245F50] shadow-sm" : "text-[#78827D]"}`}>
                <Icon size={13} strokeWidth={aktif ? 2.2 : 1.8} /><span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" role="tabpanel">
        {section === "anggaran" && <AnggaranView daftar={anggaran} transaksi={transaksi} kategoriPengeluaran={kategoriPengeluaran} onSimpan={onSimpanAnggaran} onHapus={onHapusAnggaran} />}
        {section === "target" && <TargetView daftar={targetMenabung} saldoPerencanaan={saldoPerencanaan} onSimpan={onSimpanTarget} onHapus={onHapusTarget} onUbahDana={onUbahDanaTarget} />}
        {section === "cicilan" && <CicilanView daftar={cicilan} akunSaldo={akunSaldo} onSimpan={onSimpanCicilan} onHapus={onHapusCicilan} onBayar={onBayarCicilan} />}
        {section === "hutang" && <div className="h-full min-h-0 overflow-hidden">{hutangView}</div>}
      </div>
    </div>
  );
}
