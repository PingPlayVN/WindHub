// tests/donateSystem.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DONATE_CONFIG, buildVietQrUrl } from '../src/config/donateConfig.js';

test('1. Kiểm tra cấu hình gói Donate 10k và 20k', () => {
  const pkgs = DONATE_CONFIG.packages;
  assert.equal(pkgs.length, 2, 'Hiện tại phải có đúng 2 gói ưu tiên');

  const pkg10k = pkgs.find(p => p.id === 'pkg_10k');
  assert.ok(pkg10k, 'Phải có gói 10k');
  assert.equal(pkg10k.amountVnd, 10000);
  assert.equal(pkg10k.rewardCoins, 100000, '10k VNĐ = 100k xu (1k = 10k xu)');

  const pkg20k = pkgs.find(p => p.id === 'pkg_20k');
  assert.ok(pkg20k, 'Phải có gói 20k');
  assert.equal(pkg20k.amountVnd, 20000);
  assert.equal(pkg20k.rewardCoins, 250000, '20k VNĐ = 250k xu (thưởng thêm 50k xu ~ +25%)');
  assert.equal(pkg20k.bonusPercent, 25);
});

test('2. Hàm buildVietQrUrl sinh URL đúng chuẩn động VietQR', () => {
  const url = buildVietQrUrl({
    bankId: 'MB',
    accountNo: '0987654321',
    accountName: 'TRINH GIA PHONG',
    amount: 10000,
    memo: 'WINDHUB 849201'
  });

  assert.ok(url.startsWith('https://img.vietqr.io/image/MB-0987654321-compact2.png'), 'URL phải đúng định dạng VietQR');
  assert.ok(url.includes('amount=10000'), 'Phải chứa tham số amount');
  assert.ok(url.includes('addInfo=WINDHUB%20849201'), 'Nội dung memo phải được encode an toàn');
  assert.ok(url.includes('accountName=TRINH%20GIA%20PHONG'), 'Tên tài khoản phải được encode an toàn');
});

test('3. Regex tách mã đơn WINDHUB từ nội dung webhook SePay ngân hàng', () => {
  const sePaySampleContents = [
    'WINDHUB 849201 MB1234567',
    'WH 849201 chuyen tien ung ho server',
    'windhub 123456',
    'FT26381923 WINDHUB 902184 cam on admin'
  ];

  for (const text of sePaySampleContents) {
    const match = text.match(/(?:WINDHUB|WH)\s*([0-9]{5,8})/i);
    assert.ok(match, `Phải trích xuất được mã đơn từ: "${text}"`);
    assert.ok(match[1].length >= 5 && match[1].length <= 8, 'Mã đơn phải từ 5-8 chữ số');
  }
});

