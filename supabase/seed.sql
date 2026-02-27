-- MVP seed data for quiz_questions and products

insert into quiz_questions (locale, question, type, options, order_index) values
  ('en', 'Your gender identity?', 'single',
   '{"options":["Woman","Man","Non-binary","Prefer not to say"]}', 1),
  ('en', 'What styles do you like most?', 'multi',
   '{"options":["Minimal","Casual","Street","Classic","Athleisure","Vintage","Preppy"]}', 2),
  ('en', 'Preferred fit for tops?', 'single',
   '{"options":["Slim","Regular","Relaxed","Oversized"]}', 3),
  ('en', 'Preferred fit for bottoms?', 'single',
   '{"options":["Skinny","Straight","Wide","Relaxed"]}', 4),
  ('en', 'Colors you wear most?', 'multi',
   '{"options":["Black","White","Gray","Navy","Beige","Brown","Olive","Blue","Red","Pastels"]}', 5),
  ('en', 'Seasonal preference?', 'multi',
   '{"options":["Spring","Summer","Fall","Winter"]}', 6),
  ('en', 'Budget per item?', 'single',
   '{"options":["Under ₩50,000","₩50,000-₩100,000","₩100,000-₩200,000","₩200,000+"]}', 7),
  ('en', 'Occasions you shop for?', 'multi',
   '{"options":["Work","Casual","Date","Travel","Workout","Events"]}', 8),
  ('en', 'Fabric preference?', 'multi',
   '{"options":["Cotton","Linen","Wool","Denim","Knit","Technical"]}', 9),
  ('en', 'How bold is your style?', 'scale',
   '{"min":1,"max":5,"labels":{"1":"Very subtle","3":"Balanced","5":"Bold"}}', 10),
  ('ko', '당신의 성별 정체성은 무엇인가요?', 'single',
   '{"options":["여성","남성","논바이너리","응답하지 않음"]}', 1),
  ('ko', '가장 선호하는 스타일은 무엇인가요?', 'multi',
   '{"options":["미니멀","캐주얼","스트릿","클래식","애슬레저","빈티지","프레피"]}', 2),
  ('ko', '상의 핏 선호를 선택해주세요.', 'single',
   '{"options":["슬림","레귤러","릴랙스드","오버사이즈"]}', 3),
  ('ko', '하의 핏 선호를 선택해주세요.', 'single',
   '{"options":["스키니","스트레이트","와이드","릴랙스드"]}', 4),
  ('ko', '자주 입는 색상을 선택해주세요.', 'multi',
   '{"options":["블랙","화이트","그레이","네이비","베이지","브라운","올리브","블루","레드","파스텔"]}', 5),
  ('ko', '선호하는 계절을 선택해주세요.', 'multi',
   '{"options":["봄","여름","가을","겨울"]}', 6),
  ('ko', '아이템 1개당 예산은 어느 정도인가요?', 'single',
   '{"options":["₩50,000 이하","₩50,000-₩100,000","₩100,000-₩200,000","₩200,000+"]}', 7),
  ('ko', '주로 필요한 착용 상황은 무엇인가요?', 'multi',
   '{"options":["출근","일상","데이트","여행","운동","이벤트"]}', 8),
  ('ko', '선호하는 소재를 선택해주세요.', 'multi',
   '{"options":["코튼","린넨","울","데님","니트","기능성"]}', 9),
  ('ko', '스타일의 과감함은 어느 정도인가요?', 'scale',
   '{"min":1,"max":5,"labels":{"1":"차분함","3":"균형","5":"과감함"}}', 10)
on conflict (locale, order_index) do update
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
