// src/modules/Tools/CasioSpell/data/snakeGameData.js

export const SNAKE_GAME_DATA = {
  title: 'Game "Rắn săn mồi" (Snake Game)',
  subtitle: 'Hướng dẫn chi tiết từ A-Z trên máy tính Casio fx-580VN X',
  author: 'Cre: Baidu · Dịch: casio2009 · Làm file: @tapchoicasio580',
  description: 'Hack RAM Casio fx-580VN X thông qua lỗi tràn bộ nhớ Basic Overflow và nạp mã máy (hex injection) qua Quickcpymax để chơi game Rắn săn mồi trực tiếp trên màn hình máy tính.',

  concepts: [
    {
      name: '1/2 Basic overflow',
      keys: '[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [CALC] [=] [←] [SHIFT] [ • ]',
      note: 'Dùng để tạo tràn phân nửa bộ nhớ nhằm thiết lập trạng thái con trỏ và vùng nhớ đệm.',
    },
    {
      name: 'Basic overflow',
      keys: '[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [9] [9] [CALC] [=] [AC] [←] [DEL] [DEL] [CALC] [=] [←] [SHIFT] [ • ]',
      note: 'Dùng để kích hoạt tràn bộ nhớ hoàn toàn, mở quyền ghi đè ô nhớ trong RAM.',
    },
  ],

  hexKeyMap: [
    { char: 'a', key: '[(-)]', example: 'a = [(-)] (Phím A)' },
    { char: 'b', key: '[°\'"]', example: 'b = [°\'"] (Phím B)' },
    { char: 'c', key: '[x⁻¹]', example: 'c = [x⁻¹] (Phím C)' },
    { char: 'd', key: '[sin]', example: 'd = [sin] (Phím D)' },
    { char: 'e', key: '[cos]', example: 'e = [cos] (Phím E)' },
    { char: 'f', key: '[tan]', example: 'f = [tan] (Phím F)' },
    { char: '0-9', key: '[0]...[9]', example: 'Ví dụ: 4e bấm [4] [cos]' },
  ],

  steps: [
    {
      stepNumber: 1,
      title: 'Bước 1: Clear vùng e9e0',
      description: 'Làm sạch vùng nhớ đệm tại địa chỉ e9e0 trước khi nạp mã máy.',
      actions: [
        {
          label: '1. Reset thiết lập ban đầu',
          keys: '[SHIFT] [9] [3] [=] [=]',
        },
        {
          label: '2. Khởi tạo Basic overflow thiết lập cấu hình',
          keys: '[SHIFT] [MENU] [1] [3] [x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [9] [9] [CALC] [=] [AC] [←] [DEL] [DEL] [CALC] [=] [←] [SHIFT] [ • ]',
        },
        {
          label: '3. Nhập chuỗi địa chỉ biến hệ thống',
          keys: '[SHIFT] [7] [4] [8] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [°\'"] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [4] [9]',
        },
        {
          label: '4. Thao tác căn chỉnh con trỏ và xóa ô nhớ',
          keys: '[←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL]',
        },
        {
          label: '5. Nạp cấu trúc dữ liệu vùng e9e0',
          keys: '[←] [1] [2] [3] [4] [5] [6] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [→] [→] [2] [4] [→] [9] [2] [0] [9] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [2] [3] [CALC] [=] [=] [=] [AC] [▲]',
        },
        {
          label: '6. Căn chỉnh con trỏ hoàn tất',
          keys: '[←] [DEL] [DEL] [DEL] [←] [DEL] [←]',
        },
        {
          label: '7. Ghi đè địa chỉ kết thúc',
          keys: '[0] [0] [4] [SHIFT] [cos] [1] [0] [OPTN] [3] [8] [→] [SHIFT] [8] [1] [5] [6] [→] [0] [0] [0] [0] [3] [0] [=] [ON]',
        },
      ],
    },
    {
      stepNumber: 2,
      title: 'Bước 2: Vào font chữ nhỏ',
      description: 'Chuyển màn hình Casio fx-580VN X về chế độ hiển thị font chữ nhỏ độ phân giải cao.',
      actions: [
        {
          label: '1. Kích hoạt Basic overflow',
          keys: '[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [9] [9] [CALC] [=] [AC] [←] [DEL] [DEL] [CALC] [=] [←] [SHIFT] [ • ]',
        },
        {
          label: '2. Điều chỉnh con trỏ font',
          keys: '[SHIFT] [ • ] [←] [←] [DEL] [▲] [SHIFT] [8] [▲] [2] [6] [←] [←] [→] [9] [DEL] [←] [ ) ] [ + ]',
        },
        {
          label: '3. Nhập 100 số bất kì và 13 số bất kì',
          keys: 'Nhập 100 số bất kì [ + ] 13 số bất kì [CALC] [=]',
          note: 'Có thể bấm liên tục phím [1] đủ 100 lần, sau đó bấm [+] rồi bấm phím [1] đủ 13 lần, sau đó bấm [CALC] [=].',
        },
        {
          label: '4. Nhập 48 số bất kì và xác nhận font nhỏ',
          keys: 'Nhập 48 số bất kì [SHIFT] [cos] [SHIFT] [x⁻¹] [2] [=] [AC]',
          note: 'Bấm 48 số bất kì (ví dụ phím 1), tiếp tục bấm [SHIFT] [cos] [SHIFT] [x⁻¹] [2] [=] [AC].',
        },
      ],
    },
    {
      stepNumber: 3,
      title: 'Bước 3: Vào Quickcpymax & Nạp mã Hex (e9e0)',
      description: 'Nạp 4 đoạn cấu hình Quickcpymax và 7 block mã máy (Hex Injection) của game Rắn săn mồi.',
      subSections: [
        {
          name: '3.1: Thực hiện 1/2 Basic overflow và nạp đoạn 1',
          keys: 'Thực hiện 1/2 Basic overflow, sau đó bấm:\n[SHIFT] [7] [3] [7] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [°\'"] [SHIFT] [7] [3] [(-)] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [ALPHA] [(-)] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [→] [0] [→] [1] [→] [2] [1] [→] [8] [0] [ALPHA] [S<=>D] [ALPHA] [°\'"] [ALPHA] [CALC] [1] [0] [ • ] [2] [8] [0] [→] [1] [0] [2] [2] [0] [3] [→] [9] [CALC] [=] [=] [=]\n\nTiếp tục bấm:\n[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [CALC] [=] [←] [SHIFT] [ • ] [SHIFT] [7] [4] [8] [SHIFT] [7] [4] [9] [SHIFT] [7] [1] [4] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [ALPHA] [(-)] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [ALPHA] [°\'"] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [2] [3] [CALC] [=] [=] [=] [=] [▼] [←] [DEL] [DEL] [DEL] [←] [←] [DEL] [←] [←] [←] [←] [DEL] [DEL] [DEL] [▼]\n\nNhập 48 số bất kì rồi bấm:\n[OPTN] [2] [2] [SHIFT] [cos] [1] [0] [→] [SHIFT] [x⁻¹] [□/□] [→] [0] [0] [→] [x²] [□/□] [OPTN] [3] [3] [0] [0] [√] [→] [2] [0] [0] [0] [3] [ALPHA] [S<=>D] [0] [0] [0] [0] [0] [→] [0] [→] [ • ] [OPTN] [2] [1] [→] [→] [6] [OPTN] [3] [6] [2] [0] [→] [ln] [1] [0] [SHIFT] [x^□] [SHIFT] [x⁻¹] [0] [0] [→] [→] [0] [0] [ ( ] [=] [AC]',
        },
        {
          name: '3.2: Thực hiện 1/2 Basic overflow và nạp đoạn 2',
          keys: 'Thực hiện 1/2 Basic overflow, sau đó bấm:\n[SHIFT] [7] [4] [8] [SHIFT] [7] [3] [8] [SHIFT] [7] [3] [°\'"] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [3] [7] [SHIFT] [7] [4] [9] [SHIFT] [7] [3] [9] [SHIFT] [7] [3] [°\'"] [SHIFT] [7] [3] [°\'"] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [→] [→] [→] [1] [→] [2] [1] [→] [→] [0] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [9] [→] [6] [2] [→] [0] [→] [9] [2] [3] [CALC] [=] [=] [=] [▼] [←] [←] [←] [←] [←] [DEL] [DEL] [DEL] [▼]\n\nNhập 48 số bất kì rồi bấm:\n[OPTN] [2] [2] [SHIFT] [cos] [1] [0] [→] [SHIFT] [x⁻¹] [□/□] [→] [0] [0] [→] [x²] [□/□] [OPTN] [3] [3] [0] [0] [√] [→] [2] [0] [0] [0] [3] [ALPHA] [S<=>D] [→] [→] [0] [0] [0] [0] [(-)] [0] [ • ] [→] [1] [0] [→] [→] [ALPHA] [tan] [OPTN] [2] [1] [6] [ALPHA] [÷] [1] [0] [ ( ] [=] [AC]',
        },
        {
          name: '3.3: Thực hiện 1/2 Basic overflow và nạp đoạn 3',
          keys: 'Thực hiện 1/2 Basic overflow, sau đó bấm:\n[SHIFT] [7] [4] [8] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [4] [9] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [8] [SHIFT] [7] [3] [x⁻¹] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [→] [4] [→] [1] [→] [2] [1] [→] [6] [2] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [→] [2] [0] [3] [6] [2] [→] [0] [→] [→] [2] [3] [CALC] [=] [=] [=] [▼] [←] [←] [←] [←] [←] [←] [DEL] [DEL] [DEL] [▼]\n\nNhập 48 số bất kì rồi bấm:\n[OPTN] [2] [2] [SHIFT] [cos] [1] [0] [→] [SHIFT] [x⁻¹] [□/□] [→] [0] [0] [→] [x²] [□/□] [OPTN] [3] [3] [0] [0] [√] [→] [2] [0] [0] [0] [3] [ALPHA] [S<=>D] [0] [0] [ • ] [→] [1] [0] [SHIFT] [ + ] [SHIFT] [x²] [SHIFT] [x] [0] [→] [→] [2] [0] [ • ] [→] [1] [0] [0] [SHIFT] [x²] [→] [SHIFT] [x⁻¹] [OPTN] [3] [4] [→] [0] [SHIFT] [x²] [=] [AC]',
        },
        {
          name: '3.4: Thực hiện 1/2 Basic overflow và nạp đoạn 4 (Mở Quickcpymax)',
          keys: 'Thực hiện 1/2 Basic overflow, sau đó bấm:\n[SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [8] [SHIFT] [7] [3] [x⁻¹] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [ALPHA] [(-)] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [6] [2] [1] [1] [→] [1] [0] [2] [→] [2] [ALPHA] [S<=>D] [ALPHA] [°\'"] [ALPHA] [CALC] [1] [2] [ • ] [0] [0] [3] [6] [2] [→] [0] [6] [2] [0] [CALC] [=] [=] [=]\n\nTiếp tục bấm:\n[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [CALC] [=] [←] [SHIFT] [ • ] [SHIFT] [7] [4] [8] [SHIFT] [7] [4] [9] [SHIFT] [7] [1] [4] [SHIFT] [7] [3] [7] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [7] [8] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [ALPHA] [(-)] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [ALPHA] [°\'"] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [5] [→] [2] [3] [CALC] [=] [=] [=] [=] [▼] [←] [←] [DEL] [DEL] [DEL] [←] [←] [←] [←] [←] [←] [DEL] [DEL] [DEL] [DEL] [▼]\n\nNhập 48 số bất kì rồi bấm:\n[ • ] [→] [1] [0] [→] [→] [→] [0] [→] [→] [2] [0] [ • ] [→] [1] [0] [0] [SHIFT] [x²] [→] [SHIFT] [x⁻¹] [→] [→] [2] [0] [0] [SHIFT] [x²] [OPTN] [3] [4] [→] [0] [0] [=] [AC]',
        },
      ],
      hexBlocks: [
        {
          blockIndex: 1,
          title: 'Khối Hex 1/7',
          hex: [
            '4e d7 86 53 01 00 ea f5 02 00 d0 08 03 00 30 07',
            '02 00 92 d9 92 d9 a6 7c 01 00 02 26 01 00 00 00',
            '20 9c 00 00 e8 08 02 00 dc 98 02 00 ff ff ff ff',
            'ce 4f 01 00 74 89 01 00 5e ec 9a 6d 01 00 ff ff',
            '74 89 01 00 86 ec 9e 3b 01 00 e4 9c 00 00 74 89',
            '01 00 86 ec d4 76 01 00 74 89 01 00 20 00 a8 c7',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 2,
          title: 'Khối Hex 2/7',
          hex: [
            '00 00 d6 4b 01 00 3a 89 01 00 a8 d7 0a 00 7e 3b',
            '01 00 4e 97 01 00 74 1f 02 00 b0 3a 01 00 78 d9',
            '74 1f 02 00 72 89 01 00 86 ec 14 66 01 00 74 89',
            '01 00 84 ec 9e 3b 01 00 00 4c 01 00 02 00 d6 4b',
            '01 00 70 61 01 00 9e 3b 01 00 d6 4b 01 00 a2 9c',
            '00 00 82 ec ff ff 7a 6d 01 00 ff ff 18 96 01 00',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 3,
          title: 'Khối Hex 3/7',
          hex: [
            'd0 08 03 00 d6 4b 01 00 3a 89 01 00 ca d7 58 00',
            '7e 3b 01 00 9e 93 01 00 74 89 01 00 d4 e3 9e 3b',
            '01 00 74 89 01 00 03 03 48 98 00 00 02 26 01 00',
            '90 ec d0 08 03 00 74 89 01 00 84 ec 9e 3b 01 00',
            '70 61 01 00 00 4c 01 00 30 1c d8 4b 01 00 74 89',
            '01 00 d6 e3 00 4c 01 00 d4 e3 32 89 01 00 60 d8',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 4,
          title: 'Khối Hex 4/7',
          hex: [
            'd0 08 03 00 86 53 01 00 d6 4b 01 00 9e 93 01 00',
            '34 7b 01 00 9a d8 1a d3 22 79 01 00 36 16 02 00',
            '1a d3 82 60 01 00 f8 60 01 00 d0 08 03 00 74 89',
            '01 00 82 ec 9a 6d 01 00 ff ff 74 89 01 00 02 00',
            'a6 a8 00 00 84 ec a0 9c 00 00 b0 d9 ff ff 9e 3b',
            '01 00 70 61 01 00 74 89 01 00 03 03 48 98 00 00',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 5,
          title: 'Khối Hex 5/7',
          hex: [
            '02 26 01 00 78 ec d0 08 03 00 02 26 01 00 03 03',
            'e6 9a 00 00 d6 4b 01 00 3a 89 01 00 9e d8 36 00',
            '7e 3b 01 00 86 53 01 00 9e 93 01 00 80 0e 01 00',
            'd4 e3 ff ff ff ff 20 9c 00 00 5a 9e 01 00 86 53',
            '01 00 d6 4b 01 00 28 9c 00 00 e6 9a 00 00 d6 4b',
            '01 00 3a 89 01 00 d4 d8 46 00 7e 3b 01 00 9e 93',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 6,
          title: 'Khối Hex 6/7',
          hex: [
            '01 00 34 7b 01 00 d4 dd 00 0c 36 9d 00 00 34 7b',
            '01 00 82 ec 7c ec c8 e5 00 00 03 04 02 26 01 00',
            'd4 e3 d8 39 01 00 00 00 02 26 01 00 5e ec d8 39',
            '01 00 03 03 02 26 01 00 03 04 48 98 00 00 02 26',
            '01 00 78 ec d0 08 03 00 74 89 01 00 82 ec 9e 3b',
            '01 00 74 89 01 00 03 03 48 98 00 00 02 26 01 00',
          ],
          endKey: '[MENU] [3]',
        },
        {
          blockIndex: 7,
          title: 'Khối Hex 7/7',
          hex: [
            '76 ec 7e 94 00 00 d0 08 03 00 34 7b 01 00 94 d9',
            '01 00 d8 39 01 00 a4 30 01 00 a0 02 e0 e9 30 d7',
            '30 d7 32 89 38 00 ff ff 74 1f 02 00 80 04 00 fd',
            '40 08 00 03 80 08 03 00 40 04 fd ff 00 00 00 00',
            '37 36 38 87 31 2c 31 39 d0 a6 33 87 31 2c 36 32',
            'd0 a6 32 35 36 00 e0 a0 e0 e0 e0 00 30 04 d4 e3',
          ],
          endKey: '[MENU] [3]',
        },
      ],
    },
    {
      stepNumber: 4,
      title: 'Bước 4: Thoát Quickcpymax',
      description: 'Lưu cấu trúc bộ nhớ và thoát khỏi trình soạn thảo Quickcpymax.',
      actions: [
        {
          label: 'Thao tác thoát an toàn',
          keys: '[ON] [MENU] [2] [MENU] [1] [SHIFT] [MENU] [1] [3]',
          note: 'Sau khi bấm [MENU] [3] ở khối hex 7 cuối cùng, bấm chuỗi trên để trở về giao diện tính toán.',
        },
      ],
    },
    {
      stepNumber: 5,
      title: 'Bước 5: Nhập Launcher khởi chạy game',
      description: 'Nạp mã kích hoạt để chuyển quyền điều khiển CPU sang mã game Rắn săn mồi.',
      actions: [
        {
          label: '1. Thực hiện Basic overflow',
          keys: '[x] [ALPHA] [CALC] [SHIFT] [x] [x] [SHIFT] [ ) ] [9] [SHIFT] [ ) ] [9] [9] [9] [CALC] [=] [AC] [←] [DEL] [DEL] [CALC] [=] [←] [SHIFT] [ • ]',
        },
        {
          label: '2. Nạp cấu trúc Launcher (Dòng 1)',
          keys: '[SHIFT] [7] [4] [8] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [(-)] [SHIFT] [7] [3] [x⁻¹] [SHIFT] [7] [4] [9] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [7] [SHIFT] [7] [3] [°\'"] [SHIFT] [7] [3] [x⁻¹] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [←] [×] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [DEL] [←] [1] [2] [3] [4] [5] [6] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [0] [ • ] [0] [0] [0] [→] [→] [2] [0] [→] [1] [2] [0] [9] [→] [ALPHA] [S<=>D] [→] [ALPHA] [CALC] [1] [ • ] [→] [0] [→] [0] [→] [9] [1] [→] [2] [3] [CALC] [=] [=] [=] [AC] [▲] [←] [←] [←] [←] [←] [DEL] [DEL] [DEL] [←] [DEL] [←]',
        },
        {
          label: '3. Nạp địa chỉ thực thi game (Dòng 2 & Khởi chạy)',
          keys: '[0] [SHIFT] [8] [3] [4] [OPTN] [2] [1] [0] [0] [0] [0] [0] [0] [0] [0] [4] [SHIFT] [cos] [1] [SHIFT] [8] [1] [1] [0] [9] [→] [x⁻¹] [SHIFT] [√] [1] [0] [×] [→] [0] [SHIFT] [7] [3] [ ( ] [→] [0] [0] [OPTN] [3] [8] [→] [0] [0] [4] [SHIFT] [cos] [1] [0] [0] [SHIFT] [Ans] [OPTN] [3] [8] [→] [6] [ALPHA] [÷] [1] [0] [ + ] [→] [0] [0] [√] [→] [2] [x] [CALC] [=]',
          note: 'Ngay khi bấm [CALC] [=] ở cuối dòng 2, CPU Casio fx-580VN X sẽ kích hoạt và bắt đầu vào game Rắn săn mồi!',
        },
      ],
    },
  ],

  controls: [
    { key: '[▲] / [^]', action: 'Di chuyển con rắn lên trên' },
    { key: '[▼] / [v]', action: 'Di chuyển con rắn xuống dưới' },
    { key: '[◀] / [<]', action: 'Di chuyển con rắn sang trái' },
    { key: '[▶] / [>]', action: 'Di chuyển con rắn sang phải' },
  ],
};
