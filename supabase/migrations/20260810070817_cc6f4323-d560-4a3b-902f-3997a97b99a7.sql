-- ===== Cabang =====
INSERT INTO public.branches (code, name, address, phone, tax_rate, service_charge_rate, receipt_header, receipt_footer) VALUES
('CRB1','Cabang Cirebon Kota','Jl. Siliwangi No. 112, Cirebon','0231-201155',10,0,'EMPAL GENTONG MANG DARMA','Terima kasih atas kunjungan Anda'),
('PLR1','Cabang Plered','Jl. Raya Plered No. 45, Kab. Cirebon','0231-321998',10,0,'EMPAL GENTONG MANG DARMA - PLERED','Terima kasih, sampai jumpa kembali'),
('JKS1','Cabang Jakarta Selatan','Jl. Tebet Raya No. 8, Jakarta Selatan','021-8290110',10,5,'EMPAL GENTONG MANG DARMA - JAKARTA','Terima kasih. Harga sudah termasuk PB1');

-- ===== Pengguna =====
INSERT INTO public.users (name, phone, email, role) VALUES
('Haji Darma','081211112222','darma@empalgentong.id','owner'),
('Siti Aminah','081233334444','siti@empalgentong.id','manager'),
('Rizky Pratama','081244445555','rizky@empalgentong.id','kasir'),
('Dewi Lestari','081255556666','dewi@empalgentong.id','kasir'),
('Agus Setiawan','081266667777','agus@empalgentong.id','kasir'),
('Nur Hidayah','081277778888','nur@empalgentong.id','waiter'),
('Bambang Sudiro','081288889999','bambang@empalgentong.id','dapur'),
('Fitri Handayani','081299990000','fitri@empalgentong.id','akunting');

INSERT INTO public.user_branches (user_id, branch_id)
SELECT u.id, b.id FROM public.users u CROSS JOIN public.branches b
WHERE u.role IN ('owner','manager','akunting');

INSERT INTO public.user_branches (user_id, branch_id)
SELECT u.id, b.id FROM public.users u JOIN public.branches b ON b.code = CASE u.name
  WHEN 'Rizky Pratama' THEN 'CRB1' WHEN 'Dewi Lestari' THEN 'PLR1' WHEN 'Agus Setiawan' THEN 'JKS1'
  WHEN 'Nur Hidayah' THEN 'CRB1' WHEN 'Bambang Sudiro' THEN 'PLR1' END
WHERE u.role IN ('kasir','waiter','dapur');

INSERT INTO public.devices (branch_id, name, code, last_sync_at)
SELECT b.id, 'Kasir 1', b.code || '-POS1', now() - interval '20 minutes' FROM public.branches b;
INSERT INTO public.devices (branch_id, name, code, last_sync_at)
SELECT b.id, 'Kasir 2', b.code || '-POS2', now() - interval '3 hours' FROM public.branches b WHERE b.code <> 'PLR1';

-- ===== Menu =====
INSERT INTO public.categories (name, sort_order) VALUES ('Makanan Utama',1),('Pelengkap',2),('Minuman',3);

INSERT INTO public.menu_items (category_id, sku, name, description, base_price, sort_order)
SELECT c.id, v.sku, v.name, v.descr, v.price, v.ord FROM (VALUES
('Makanan Utama','MU-001','Empal Gentong','Kuah santan rempah khas Cirebon dengan daging sapi',35000,1),
('Makanan Utama','MU-002','Empal Asem','Kuah bening segar dengan belimbing wuluh',33000,2),
('Makanan Utama','MU-003','Sate Kambing (10 tusuk)','Sate kambing muda bumbu kecap',45000,3),
('Makanan Utama','MU-004','Nasi Lengko','Nasi dengan tahu, tempe, dan bumbu kacang',20000,4),
('Makanan Utama','MU-005','Docang','Lontong dengan kuah dage dan daun singkong',18000,5),
('Pelengkap','PL-001','Nasi Putih','Sepiring nasi putih hangat',6000,1),
('Pelengkap','PL-002','Lontong','Lontong potong',6000,2),
('Pelengkap','PL-003','Kerupuk Melarat','Kerupuk khas Cirebon digoreng dengan pasir',5000,3),
('Pelengkap','PL-004','Sambal Cabe Kering','Sambal cabe kering pedas',3000,4),
('Pelengkap','PL-005','Emping','Emping melinjo gurih',8000,5),
('Minuman','MN-001','Es Teh Manis','Teh manis dengan es batu',6000,1),
('Minuman','MN-002','Teh Tawar Hangat','Teh tawar hangat',4000,2),
('Minuman','MN-003','Es Jeruk','Jeruk peras segar',10000,3),
('Minuman','MN-004','Air Mineral','Air mineral botol 600ml',5000,4),
('Minuman','MN-005','Es Campur','Es campur buah dan sirup',15000,5)
) AS v(cat, sku, name, descr, price, ord)
JOIN public.categories c ON c.name = v.cat;

INSERT INTO public.menu_variants (menu_item_id, name, price_delta, is_default)
SELECT m.id, v.name, v.delta, v.is_def FROM (VALUES
('Empal Gentong','Pakai Nasi',0,true),('Empal Gentong','Pakai Lontong',0,false),('Empal Gentong','Tanpa Nasi',-5000,false),
('Empal Asem','Pakai Nasi',0,true),('Empal Asem','Pakai Lontong',0,false),('Empal Asem','Tanpa Nasi',-5000,false),
('Sate Kambing (10 tusuk)','10 tusuk',0,true),('Sate Kambing (10 tusuk)','20 tusuk',40000,false)
) AS v(item, name, delta, is_def)
JOIN public.menu_items m ON m.name = v.item;

INSERT INTO public.modifier_groups (name, min_select, max_select, is_required) VALUES
('Level Pedas',1,1,true),('Tambahan',0,5,false);

INSERT INTO public.modifiers (group_id, name, price_delta)
SELECT g.id, v.name, v.delta FROM (VALUES
('Level Pedas','Tidak Pedas',0),('Level Pedas','Sedang',0),('Level Pedas','Pedas',0),('Level Pedas','Extra Pedas',0),
('Tambahan','Extra Daging',15000),('Tambahan','Extra Kuah',5000),('Tambahan','Extra Kerupuk',5000)
) AS v(grp, name, delta)
JOIN public.modifier_groups g ON g.name = v.grp;

INSERT INTO public.item_modifiers (menu_item_id, modifier_group_id)
SELECT m.id, g.id FROM public.menu_items m JOIN public.categories c ON c.id = m.category_id
CROSS JOIN public.modifier_groups g WHERE c.name = 'Makanan Utama';

-- Harga per cabang: Jakarta +25%
INSERT INTO public.branch_menu (branch_id, menu_item_id, price_override, is_available)
SELECT b.id, m.id,
  CASE WHEN b.code = 'JKS1' THEN (round(m.base_price * 1.25 / 500.0) * 500)::BIGINT ELSE NULL END,
  true
FROM public.branches b CROSS JOIN public.menu_items m;

UPDATE public.branch_menu SET is_available = false
WHERE menu_item_id = (SELECT id FROM public.menu_items WHERE name = 'Es Campur')
  AND branch_id = (SELECT id FROM public.branches WHERE code = 'PLR1');

-- ===== Promo =====
INSERT INTO public.promos (name, type, value, min_purchase, valid_from, valid_to, active_days, active_hours_start, active_hours_end)
VALUES
('Diskon Makan Siang 10%','percent',10,50000,current_date - 60, current_date + 60,'{1,2,3,4,5}','11:00','14:00'),
('Potongan Akhir Pekan Rp 15.000','fixed',15000,100000,current_date - 60, current_date + 60,'{0,6}','10:00','21:00'),
('Promo Pembukaan Jakarta 15%','percent',15,75000,current_date - 30, current_date + 30,'{0,1,2,3,4,5,6}','10:00','21:00');

INSERT INTO public.promo_branches (promo_id, branch_id)
SELECT p.id, b.id FROM public.promos p CROSS JOIN public.branches b WHERE p.name <> 'Promo Pembukaan Jakarta 15%';
INSERT INTO public.promo_branches (promo_id, branch_id)
SELECT p.id, b.id FROM public.promos p JOIN public.branches b ON b.code = 'JKS1' WHERE p.name = 'Promo Pembukaan Jakarta 15%';

-- ===== Meja =====
INSERT INTO public.tables (branch_id, name, capacity, area)
SELECT b.id, 'Meja ' || g, CASE WHEN g % 4 = 0 THEN 6 ELSE 4 END,
  CASE WHEN g <= 4 THEN 'Indoor' WHEN g <= 8 THEN 'Outdoor' ELSE 'Lesehan' END
FROM public.branches b CROSS JOIN generate_series(1,12) g;

-- ===== Kategori biaya =====
INSERT INTO public.expense_categories (name) VALUES
('Bahan Baku'),('Gaji'),('Sewa'),('Listrik'),('Gas'),('Lain-lain');
