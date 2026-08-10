DO $$
DECLARE
  b RECORD; d DATE; dev UUID; kasir UUID; v_shift UUID; ord UUID; oi UUID;
  n INT; i INT; j INT; hr INT; mn INT; ts TIMESTAMPTZ;
  v_qty INT; unit BIGINT; line BIGINT; sub BIGINT; disc BIGINT; tax BIGINT; svc BIGINT; grand BIGINT;
  it RECORD; vr RECORD; md RECORD;
  cash_total BIGINT; opening BIGINT; var_amt BIGINT; expected BIGINT; counted BIGINT;
  method TEXT; r NUMERIC; is_void BOOLEAN; seq INT; weekend BOOLEAN;
  tbl UUID; otype TEXT; kasir_list UUID[]; item_count INT;
BEGIN
FOR b IN SELECT * FROM public.branches ORDER BY code LOOP
  SELECT id INTO dev FROM public.devices WHERE branch_id = b.id ORDER BY code LIMIT 1;
  SELECT array_agg(u.id) INTO kasir_list FROM public.users u
    JOIN public.user_branches ub ON ub.user_id = u.id
    WHERE ub.branch_id = b.id AND u.role IN ('kasir','manager');

  FOR d IN SELECT generate_series(current_date - 59, current_date, interval '1 day')::date LOOP
    weekend := extract(dow FROM d) IN (0,6);
    kasir := kasir_list[1 + floor(random() * array_length(kasir_list,1))::int];

    opening := 500000;
    INSERT INTO public.shifts (branch_id, device_id, user_id, opened_at, opening_cash)
    VALUES (b.id, dev, kasir, (d::timestamp + interval '9 hours') AT TIME ZONE 'Asia/Jakarta', opening)
    RETURNING id INTO v_shift;

    n := CASE b.code WHEN 'JKS1' THEN 34 WHEN 'CRB1' THEN 30 ELSE 22 END;
    IF weekend THEN n := (n * 1.55)::int; END IF;
    n := n + floor(random() * 8)::int - 3;

    cash_total := 0;
    seq := 0;

    FOR i IN 1..n LOOP
      seq := seq + 1;
      r := random();
      hr := CASE
        WHEN r < 0.40 THEN 11 + floor(random() * 3)::int
        WHEN r < 0.72 THEN 18 + floor(random() * 3)::int
        WHEN r < 0.86 THEN 14 + floor(random() * 4)::int
        ELSE 9 + floor(random() * 2)::int END;
      mn := floor(random() * 60)::int;
      ts := (d::timestamp + make_interval(hours => hr, mins => mn)) AT TIME ZONE 'Asia/Jakarta';

      r := random();
      otype := CASE WHEN r < 0.72 THEN 'dine_in' WHEN r < 0.9 THEN 'takeaway' ELSE 'delivery' END;
      SELECT id INTO tbl FROM public.tables WHERE branch_id = b.id ORDER BY random() LIMIT 1;
      IF otype <> 'dine_in' THEN tbl := NULL; END IF;

      is_void := random() < 0.018;

      INSERT INTO public.orders (branch_id, device_id, shift_id, order_no, table_id, order_type,
        guest_count, customer_name, status, created_by, created_at)
      VALUES (b.id, dev, v_shift,
        b.code || '-' || to_char(d,'YYYYMMDD') || '-' || lpad(seq::text, 4, '0'),
        tbl, otype,
        CASE WHEN otype = 'dine_in' THEN 1 + floor(random() * 4)::int ELSE 1 END,
        CASE WHEN otype = 'delivery' THEN 'Pelanggan Ojol' ELSE NULL END,
        'open', kasir, ts)
      RETURNING id INTO ord;

      sub := 0;
      item_count := 1 + floor(random() * 3)::int;

      FOR j IN 1..item_count LOOP
        SELECT m.id, m.name, coalesce(bm.price_override, m.base_price) AS price, c.name AS cat
        INTO it
        FROM public.menu_items m
        JOIN public.categories c ON c.id = m.category_id
        LEFT JOIN public.branch_menu bm ON bm.menu_item_id = m.id AND bm.branch_id = b.id
        WHERE (j = 1 AND c.name = 'Makanan Utama') OR j > 1
        ORDER BY random() LIMIT 1;

        vr := NULL;
        SELECT v.id, v.name, v.price_delta INTO vr
        FROM public.menu_variants v WHERE v.menu_item_id = it.id ORDER BY random() LIMIT 1;

        v_qty := CASE WHEN random() < 0.75 THEN 1 ELSE 2 END;
        unit := it.price + coalesce(vr.price_delta, 0);
        line := unit * v_qty;

        INSERT INTO public.order_items (order_id, menu_item_id, variant_id, name_snapshot,
          unit_price_snapshot, qty, discount, line_total)
        VALUES (ord, it.id, vr.id,
          it.name || CASE WHEN vr.name IS NOT NULL THEN ' (' || vr.name || ')' ELSE '' END,
          unit, v_qty, 0, line)
        RETURNING id INTO oi;

        IF it.cat = 'Makanan Utama' THEN
          SELECT mo.id, mo.name, mo.price_delta INTO md
          FROM public.modifiers mo JOIN public.modifier_groups g ON g.id = mo.group_id
          WHERE g.name = 'Level Pedas' ORDER BY random() LIMIT 1;
          INSERT INTO public.order_item_modifiers (order_item_id, modifier_id, name_snapshot, price_snapshot)
          VALUES (oi, md.id, md.name, md.price_delta);

          IF random() < 0.25 THEN
            SELECT mo.id, mo.name, mo.price_delta INTO md
            FROM public.modifiers mo JOIN public.modifier_groups g ON g.id = mo.group_id
            WHERE g.name = 'Tambahan' ORDER BY random() LIMIT 1;
            INSERT INTO public.order_item_modifiers (order_item_id, modifier_id, name_snapshot, price_snapshot)
            VALUES (oi, md.id, md.name, md.price_delta);
            unit := unit + md.price_delta;
            line := unit * v_qty;
            UPDATE public.order_items SET unit_price_snapshot = unit, line_total = line WHERE id = oi;
          END IF;
        END IF;

        sub := sub + line;
      END LOOP;

      disc := 0;
      IF random() < 0.09 THEN
        disc := (round(sub * 0.1 / 500.0) * 500)::BIGINT;
      END IF;

      svc := (round((sub - disc) * b.service_charge_rate / 100.0 / 500.0) * 500)::BIGINT;
      tax := (round((sub - disc + svc) * b.tax_rate / 100.0))::BIGINT;
      grand := sub - disc + svc + tax;

      IF is_void THEN
        UPDATE public.orders SET status = 'void', subtotal = sub, discount_total = disc,
          service_charge_total = svc, tax_total = tax, grand_total = grand,
          voided_at = ts + interval '4 minutes',
          void_reason = (ARRAY['Salah input menu','Pelanggan batal pesan','Struk dobel','Salah cabang input','Menu habis di dapur'])[1 + floor(random()*5)::int]
        WHERE id = ord;
      ELSE
        r := random();
        method := CASE
          WHEN otype = 'delivery' THEN (ARRAY['gofood','grabfood','shopeefood'])[1 + floor(random()*3)::int]
          WHEN r < 0.58 THEN 'tunai'
          WHEN r < 0.82 THEN 'qris'
          WHEN r < 0.94 THEN 'debit'
          ELSE 'kartu_kredit' END;

        UPDATE public.orders SET status = 'paid', subtotal = sub, discount_total = disc,
          service_charge_total = svc, tax_total = tax, grand_total = grand,
          closed_at = ts + interval '35 minutes'
        WHERE id = ord;

        INSERT INTO public.payments (order_id, method, amount, reference_no, cash_received, change_given, paid_at)
        VALUES (ord, method, grand,
          CASE WHEN method = 'tunai' THEN NULL ELSE upper(substr(md5(random()::text), 1, 10)) END,
          CASE WHEN method = 'tunai' THEN ceil(grand / 10000.0) * 10000 ELSE NULL END,
          CASE WHEN method = 'tunai' THEN ceil(grand / 10000.0) * 10000 - grand ELSE NULL END,
          ts + interval '35 minutes');

        IF method = 'tunai' THEN cash_total := cash_total + grand; END IF;
      END IF;
    END LOOP;

    expected := opening + cash_total;
    var_amt := CASE WHEN random() < 0.18 THEN (floor(random() * 9) - 4)::int * 5000 ELSE 0 END;
    counted := expected + var_amt;

    UPDATE public.shifts SET closed_at = (d::timestamp + interval '22 hours') AT TIME ZONE 'Asia/Jakarta',
      closing_cash_expected = expected, closing_cash_counted = counted, variance = var_amt,
      notes = CASE WHEN var_amt < 0 THEN 'Kas kurang, sedang ditelusuri'
                   WHEN var_amt > 0 THEN 'Kas lebih, kemungkinan kembalian belum diberikan'
                   ELSE 'Kas sesuai' END
    WHERE id = v_shift;

    INSERT INTO public.expenses (branch_id, category_id, date, amount, description, payment_method, created_by)
    SELECT b.id, ec.id, d,
      CASE ec.name
        WHEN 'Bahan Baku' THEN ((2000000 + floor(random() * 1500000))::bigint / 1000) * 1000
        WHEN 'Gas' THEN 300000
        ELSE 250000 END,
      CASE ec.name WHEN 'Bahan Baku' THEN 'Belanja daging, santan, dan sayur' WHEN 'Gas' THEN 'Isi ulang gas LPG' ELSE 'Token listrik harian' END,
      'tunai', kasir
    FROM public.expense_categories ec WHERE ec.name IN ('Bahan Baku','Gas','Listrik');

    IF extract(day FROM d) = 1 THEN
      INSERT INTO public.expenses (branch_id, category_id, date, amount, description, payment_method, created_by)
      SELECT b.id, ec.id, d,
        CASE ec.name WHEN 'Gaji' THEN CASE b.code WHEN 'JKS1' THEN 45000000 WHEN 'CRB1' THEN 32000000 ELSE 24000000 END
                     ELSE CASE b.code WHEN 'JKS1' THEN 25000000 WHEN 'CRB1' THEN 12000000 ELSE 8000000 END END,
        CASE ec.name WHEN 'Gaji' THEN 'Gaji karyawan bulanan' ELSE 'Sewa tempat bulanan' END,
        'debit', kasir
      FROM public.expense_categories ec WHERE ec.name IN ('Gaji','Sewa');
    END IF;
  END LOOP;
END LOOP;
END $$;
