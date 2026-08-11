# Empal Gentong Control

Bangun aplikasi WEB ADMIN + DASHBOARD LAPORAN untuk restoran "Empal Gentong" (rumah makan khas Cirebon) dengan beberapa cabang. Seluruh UI dalam Bahasa Indonesia. Gunakan Supabase (Postgres) sebagai backend.

PENTING — ini akan jadi sistem produksi yang menangani uang. Ikuti aturan skema di bawah PERSIS, jangan disederhanakan:

ATURAN WAJIB:
1. Semua primary key pakai UUID (gen_random_uuid()), JANGAN auto-increment integer. Nanti ada aplikasi kasir Android offline yang membuat ID sendiri di device.
2. Semua nilai uang disimpan sebagai BIGINT dalam rupiah penuh (tanpa desimal/sen). JANGAN pakai float/numeric untuk uang.
3. Semua timestamp pakai TIMESTAMPTZ (UTC), ditampilkan dalam WIB.
4. Transaksi TIDAK PERNAH dihapus. Pembatalan = set kolom voided_at + void_reason. Terapkan ini juga di UI: tombolnya "Batalkan", bukan "Hapus".
5. Tabel order_items WAJIB menyimpan snapshot: name_snapshot, unit_price_snapshot. Laporan lama harus tetap menampilkan harga saat transaksi terjadi, bukan harga master terkini.

SKEMA DATABASE:

branches (id, code, name, address, phone, tax_rate INT default 10, service_charge_rate INT default 0, receipt_header, receipt_footer, is_active)
users (id, name, phone, email, role, is_active) — role: owner | manager | kasir | waiter | dapur | akunting
user_branches (user_id, branch_id) — satu user bisa akses banyak cabang
devices (id, branch_id, name, code, last_sync_at)

categories (id, name, sort_order, is_active)
menu_items (id, category_id, sku, name, description, base_price BIGINT, image_url, is_active, sort_order)
menu_variants (id, menu_item_id, name, price_delta BIGINT, is_default)
modifier_groups (id, name, min_select, max_select, is_required)
modifiers (id, group_id, name, price_delta BIGINT)
item_modifiers (menu_item_id, modifier_group_id)
branch_menu (branch_id, menu_item_id, price_override BIGINT nullable, is_available) — INI KUNCI multi-cabang: harga dasar di menu_items, tiap cabang bisa menimpa harganya dan menandai menu habis tanpa mengganggu cabang lain

promos (id, name, type, value BIGINT, min_purchase BIGINT, valid_from, valid_to, active_days, active_hours_start, active_hours_end, is_active) — type: percent | fixed
promo_branches (promo_id, branch_id)

tables (id, branch_id, name, capacity, area)

shifts (id, branch_id, device_id, user_id, opened_at, closed_at, opening_cash BIGINT, closing_cash_counted BIGINT, closing_cash_expected BIGINT, variance BIGINT, notes)
orders (id, branch_id, device_id, shift_id, order_no, table_id, order_type, guest_count, customer_name, status, subtotal BIGINT, discount_total BIGINT, tax_total BIGINT, service_charge_total BIGINT, grand_total BIGINT, created_by, created_at, closed_at, voided_at, void_reason) — order_type: dine_in | takeaway | delivery; status: open | paid | void
order_items (id, order_id, menu_item_id, variant_id, name_snapshot, unit_price_snapshot BIGINT, qty, discount BIGINT, line_total BIGINT, notes)
order_item_modifiers (id, order_item_id, modifier_id, name_snapshot, price_snapshot BIGINT)
payments (id, order_id, method, amount BIGINT, reference_no, cash_received BIGINT, change_given BIGINT, paid_at) — method: tunai | qris | debit | kartu_kredit | gofood | grabfood | shopeefood

expense_categories (id, name)
expenses (id, branch_id, category_id, date, amount BIGINT, description, payment_method, created_by)
audit_log (id, branch_id, user_id, action, entity, entity_id, before_json, after_json, created_at)

HALAMAN YANG DIBUTUHKAN:

1. Dashboard Owner — kartu ringkasan (omzet hari ini, jumlah struk, rata-rata per struk, perbandingan vs kemarin), grafik omzet 30 hari terakhir, perbandingan antar cabang, menu terlaris. Ada filter rentang tanggal dan filter cabang.

2. Manajemen Menu — daftar kategori & menu, tambah/edit menu, kelola varian (contoh: Pakai Nasi / Pakai Lontong) dan modifier (contoh: Level Pedas, Extra Daging). Ada tab "Harga per Cabang" berupa tabel matriks: baris = menu, kolom = cabang, isi = harga (kosong berarti ikut harga dasar) plus toggle tersedia/habis.

3. Manajemen Cabang — CRUD cabang, atur tarif pajak PB1 dan service charge per cabang, header/footer struk.

4. Manajemen User & Hak Akses — CRUD user, atur peran, tentukan cabang mana saja yang bisa diakses.

5. Promo & Diskon — CRUD promo, pilih cabang yang berlaku, atur hari & jam aktif.

6. Manajemen Meja — daftar meja per cabang, dikelompokkan per area.

7. Biaya Operasional — input biaya harian per cabang dengan kategori (bahan baku, gaji, sewa, listrik, gas, lain-lain), tabel riwayat dengan filter.

8. Laporan Penjualan — beberapa tab: ringkasan harian, per cabang, per menu, per jam (grafik untuk lihat jam ramai), per metode pembayaran, per kasir. Semua bisa difilter tanggal & cabang, dan bisa diekspor CSV.

9. Laporan Keuangan — laba rugi sederhana (omzet bersih dikurangi biaya operasional), rekap PB1 per cabang untuk setoran pajak daerah bulanan (ini penting: dipisah per cabang karena disetor ke Bapenda masing-masing), dan rekap arus kas per shift.

10. Kontrol & Audit — daftar transaksi yang dibatalkan beserta alasan dan pelakunya, daftar diskon manual, dan shift dengan selisih kas.

CATATAN PENTING SOAL PAJAK: pajak restoran di Indonesia adalah PB1 (pajak daerah), BUKAN PPN. Beri label "PB1" di semua tampilan, bukan "PPN" atau "VAT". Tarifnya diambil dari kolom tax_rate milik cabang masing-masing.

DATA CONTOH — isi 3 cabang: "Cabang Cirebon Kota" (CRB1), "Cabang Plered" (PLR1), "Cabang Jakarta Selatan" (JKS1). Cabang Jakarta harganya sekitar 25% lebih tinggi lewat price_override.

Menu contoh (harga dalam rupiah):
Makanan Utama: Empal Gentong 35000, Empal Asem 33000, Sate Kambing (10 tusuk) 45000, Nasi Lengko 20000, Docang 18000
Pelengkap: Nasi Putih 6000, Lontong 6000, Kerupuk Melarat 5000, Sambal Cabe Kering 3000, Emping 8000
Minuman: Es Teh Manis 6000, Teh Tawar Hangat 4000, Es Jeruk 10000, Air Mineral 5000, Es Campur 15000

Varian untuk Empal Gentong dan Empal Asem: "Pakai Nasi" (+0, default), "Pakai Lontong" (+0), "Tanpa Nasi" (-5000). Varian Sate Kambing: "10 tusuk" (+0), "20 tusuk" (+40000).
Modifier group "Level Pedas" (pilih 1, wajib): Tidak Pedas +0, Sedang +0, Pedas +0, Extra Pedas +0.
Modifier group "Tambahan" (pilih banyak, opsional): Extra Daging +15000, Extra Kuah +5000, Extra Kerupuk +5000.

Isi juga sekitar 60 hari data transaksi contoh yang realistis di ketiga cabang supaya semua grafik dan laporan langsung terlihat berisi — dengan pola jam ramai di makan siang (11.00-14.00) dan makan malam (18.00-20.00), akhir pekan lebih ramai, serta campuran metode pembayaran (tunai dominan, QRIS, debit, dan sebagian ojol). Sertakan juga beberapa transaksi yang dibatalkan agar halaman kontrol ada isinya.

Desain: bersih, profesional, mudah dibaca di layar laptop maupun tablet. Sidebar navigasi di kiri. Ada pemilih cabang di header yang berlaku global. Format semua angka sebagai rupiah Indonesia (contoh: Rp 35.000) dan tanggal dalam format Indonesia. Nuansa warna hangat yang cocok untuk restoran, tapi tetap terasa seperti alat kerja yang serius — bukan aplikasi konsumen.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/18f1a947-ca18-47a1-ab89-88b42be56607).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
