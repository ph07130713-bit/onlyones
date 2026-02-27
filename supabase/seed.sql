-- MVP seed data for quiz_questions and products

insert into quiz_questions (id, question, type, options, order_index) values
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0101', 'Your gender identity?', 'single',
   '{"options":["Woman","Man","Non-binary","Prefer not to say"]}', 1),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0102', 'What styles do you like most?', 'multi',
   '{"options":["Minimal","Casual","Street","Classic","Athleisure","Vintage","Preppy"]}', 2),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0103', 'Preferred fit for tops?', 'single',
   '{"options":["Slim","Regular","Relaxed","Oversized"]}', 3),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0104', 'Preferred fit for bottoms?', 'single',
   '{"options":["Skinny","Straight","Wide","Relaxed"]}', 4),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0105', 'Colors you wear most?', 'multi',
   '{"options":["Black","White","Gray","Navy","Beige","Brown","Olive","Blue","Red","Pastels"]}', 5),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0106', 'Seasonal preference?', 'multi',
   '{"options":["Spring","Summer","Fall","Winter"]}', 6),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0107', 'Budget per item?', 'single',
   '{"options":["₩50,000 이하","₩50,000-₩100,000","₩100,000-₩200,000","₩200,000+"]}', 7),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0108', 'Occasions you shop for?', 'multi',
   '{"options":["Work","Casual","Date","Travel","Workout","Events"]}', 8),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0109', 'Fabric preference?', 'multi',
   '{"options":["Cotton","Linen","Wool","Denim","Knit","Technical"]}', 9),
  ('0f2d2b1f-0e8d-4f2e-9a8a-1b2f8b7a0110', 'How bold is your style?', 'scale',
   '{"min":1,"max":5,"labels":{"1":"Very subtle","3":"Balanced","5":"Bold"}}', 10)
on conflict (order_index) do update
  set
    question = excluded.question,
    type = excluded.type,
    options = excluded.options;

-- New recommendation catalog (>=40 rows)
insert into catalog_items (title, brand, price_krw, image_url, tags, active)
select
  format('Catalog Look %s', gs) as title,
  (array['Mono Studio','Northline','Apex','Fieldworks','Luma','Formline','Breezeline','Crestline'])[(gs % 8) + 1] as brand,
  39000 + (gs * 3500) as price_krw,
  format('https://picsum.photos/seed/catalog-look-%s/600/800', gs) as image_url,
  array[
    (array['minimal','casual','work','street','classic','sporty'])[(gs % 6) + 1],
    (array['black','white','gray','navy','beige','olive'])[((gs + 1) % 6) + 1],
    (array['summer','winter','spring','fall'])[((gs + 2) % 4) + 1],
    (array['oversized','slim','regular','relaxed'])[((gs + 3) % 4) + 1],
    (array['cotton','linen','denim','knit','technical'])[((gs + 4) % 5) + 1]
  ]::text[] as tags,
  true as active
from generate_series(1, 48) as gs
on conflict do nothing;
