INSERT INTO facilities (name, prefecture, city, address, lat, lng, tattoo_policy, description, sauna_types, water_temp, price, open_hours, website, photos)
VALUES
('サンプル温泉 東京店','東京都','港区','サンプル住所 1',35.658581,139.745433,'cover_ok','カバーシールで入浴可',ARRAY['dry','steam'],18,'900円','10:00-22:00','https://example.com', ARRAY['/photos/sample1.jpg'])
ON CONFLICT DO NOTHING;
