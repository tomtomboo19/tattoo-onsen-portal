import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.facility.createMany({
    data: [
      { name: 'すなみの湯', description: 'タトゥー可（小さめのワンポイントは問題なし）', prefecture: '東京都', city: '新宿区', address: '歌舞伎町1-1', isTattooOk: true, tags: '温泉,サウナ', latitude: 35.6938, longitude: 139.7034, source: 'seed', status: 'approved' },
      { name: 'しろかぜサウナ', description: '要確認だが基本的にタトゥーOKの方針', prefecture: '東京都', city: '渋谷区', address: '渋谷2-2', isTattooOk: true, tags: 'サウナ,温浴', latitude: 35.6595, longitude: 139.7005, source: 'seed', status: 'approved' },
      { name: 'みなと湯', description: '家族経営の温泉。タトゥーは小さめなら可', prefecture: '東京都', city: '港区', address: '港1-3', isTattooOk: true, tags: '温泉', latitude: 35.6586, longitude: 139.7454, source: 'seed', status: 'approved' },
      { name: 'あかねの湯', description: '露天風呂とサウナあり。タトゥーは要相談', prefecture: '東京都', city: '世田谷区', address: '世田谷4-5', isTattooOk: false, tags: '温泉,露天', latitude: 35.6467, longitude: 139.6532, source: 'seed', status: 'approved' },
      { name: 'ねむの湯', description: '貸切風呂あり。タトゥー可', prefecture: '東京都', city: '目黒区', address: '目黒2-8', isTattooOk: true, tags: '温泉,家族風呂', latitude: 35.6411, longitude: 139.6982, source: 'seed', status: 'approved' },
      { name: 'はなれサウナ', description: '静かな個室サウナ。タトゥー可', prefecture: '東京都', city: '中野区', address: '中野3-9', isTattooOk: true, tags: 'サウナ,個室', latitude: 35.7074, longitude: 139.6639, source: 'seed', status: 'approved' },
      { name: 'ほしの湯', description: 'サウナ小屋と水風呂が人気', prefecture: '東京都', city: '墨田区', address: '業平1-1', isTattooOk: true, tags: '温泉,サウナ', latitude: 35.7101, longitude: 139.8089, source: 'seed', status: 'approved' },
      { name: 'ゆらら温泉', description: '温泉と岩盤浴あり。タトゥーは要確認', prefecture: '東京都', city: '江東区', address: '東陽2-6', isTattooOk: false, tags: '温泉,岩盤浴', latitude: 35.6733, longitude: 139.8176, source: 'seed', status: 'approved' },
      { name: 'ふるさと湯', description: '昔ながらの銭湯型温泉。タトゥーは小さめ可', prefecture: '東京都', city: '台東区', address: '浅草1-5', isTattooOk: true, tags: '銭湯,温泉', latitude: 35.7148, longitude: 139.7967, source: 'seed', status: 'approved' },
      { name: 'かぜのサウナ', description: '都会の中のサウナ。短時間プランあり', prefecture: '東京都', city: '豊島区', address: '池袋3-4', isTattooOk: true, tags: 'サウナ', latitude: 35.7295, longitude: 139.7101, source: 'seed', status: 'approved' },
      { name: 'おもて湯', description: '観光客にも人気。タトゥーは事前連絡推奨', prefecture: '東京都', city: '中央区', address: '日本橋2-2', isTattooOk: false, tags: '温泉,観光', latitude: 35.6824, longitude: 139.7745, source: 'seed', status: 'approved' },
      { name: 'さくらサウナ', description: '女性専用時間帯あり。タトゥー可', prefecture: '東京都', city: '渋谷区', address: '恵比寿1-2', isTattooOk: true, tags: 'サウナ,女性専用', latitude: 35.6467, longitude: 139.7093, source: 'seed', status: 'approved' },
      { name: 'まちの温泉', description: '地域密着型。リーズナブル', prefecture: '東京都', city: '板橋区', address: '板橋4-4', isTattooOk: false, tags: '温泉,地域', latitude: 35.7512, longitude: 139.7050, source: 'seed', status: 'approved' },
      { name: 'こもれびの湯', description: '自然光の入る露天が魅力', prefecture: '東京都', city: '練馬区', address: '練馬5-3', isTattooOk: true, tags: '温泉,露天', latitude: 35.7356, longitude: 139.6529, source: 'seed', status: 'approved' },
      { name: 'ひるまサウナ', description: '昼割プランあり。タトゥー可', prefecture: '東京都', city: '台東区', address: '上野2-3', isTattooOk: true, tags: 'サウナ,割引', latitude: 35.7120, longitude: 139.7752, source: 'seed', status: 'approved' },
      { name: 'みやこ温泉', description: '温泉と簡易宿泊あり', prefecture: '東京都', city: '江戸川区', address: '小岩1-1', isTattooOk: false, tags: '温泉,宿泊', latitude: 35.7330, longitude: 139.8760, source: 'seed', status: 'approved' },
      { name: 'なごみサウナ', description: 'アットホームなサウナ。タトゥー可', prefecture: '東京都', city: '葛飾区', address: '亀有3-7', isTattooOk: true, tags: 'サウナ,地域', latitude: 35.7462, longitude: 139.8637, source: 'seed', status: 'approved' }
    ],
    skipDuplicates: true
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
