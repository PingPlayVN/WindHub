import {
  CHAR_TO_HEX,
  CHAR_TO_BUTTON,
  TAKE_CHARS,
  CHARS_HEX_LIST,
} from '../data/casio580AxesmcData.js';

/**
 * Căn giữa chuỗi theo quy tắc chuẩn của web hack Casio 580
 * @param {string} line Chuỗi đầu vào (tối đa 17 ký tự)
 * @returns {{ ds_chu: string[], space_l: number, space_r: number, strDisplay: string }}
 */
export function centerTextWeb(line) {
  const chars = Array.from((line || '').slice(0, 17));
  const spaces = 17 - chars.length;
  let space_l = 0;
  let space_r = 0;

  if (spaces % 2 === 0) {
    space_l = spaces / 2;
    space_r = space_l;
  } else {
    // Nếu lẻ (như 11 spaces): bên trái 6, bên phải 5
    space_l = Math.ceil(spaces / 2);
    space_r = Math.floor(spaces / 2);
  }

  const ds_chu = Array(space_l).fill(' ').concat(chars).concat(Array(space_r).fill(' '));
  const strDisplay = '\\'.repeat(space_l) + line.replace(/ /g, '\\') + '\\'.repeat(space_r);

  return { ds_chu, space_l, space_r, strDisplay };
}

/**
 * Thuật toán lấp hex vào biến A, B, C (Basic Overflow)
 * @param {Array<string>} hexListInput Danh sách mã hex cần nạp
 */
export function fill580(hexListInput) {
  const A = ['1.0000', '__', '__', '_!', '!_', '__', '×10', '!!'];
  const B = ['1.', '__', '__', '__', '_!', '!_', '__', '×10', '!!'];
  const C = ['1.', '__', '__', '__', '_!', '!_', '__', '×10', '!!'];

  let pos = 0;
  let pos1 = 0;
  const filled = ['x:'];
  let id = 0;
  const hex_list_edited = [];

  // Xóa khoảng cách giữa 2 bytes
  const hex_list_clean = hexListInput.map((ph) => (ph.length === 5 ? ph.replace(' ', '') : ph));

  // Tách 2 bytes
  for (const phantu of hex_list_clean) {
    let pos2 = 0;
    while (pos2 <= phantu.length) {
      const byte_edited = phantu.slice(pos2, pos2 + 2);
      if (byte_edited === '') break;
      hex_list_edited.push(byte_edited);
      pos2 += 2;
    }
  }
  const flattenedHexList = hex_list_edited;

  let status = true;
  if (flattenedHexList.length > 20) {
    status = false;
  }

  for (let i = 0; i < 100; i++) {
    let slot;
    if (id === 0) slot = A[pos1];
    else if (id === 1) slot = B[pos1];
    else if (id === 2) slot = C[pos1];

    if (slot === '1.0000' || slot === '1.') {
      if (id === 0) filled.push('A = ');
      if (id === 1) filled.push('B = ');
      if (id === 2) filled.push('C = ');
      filled.push(slot);
      pos1 += 1;
    }

    if (slot === '×10') {
      filled.push(slot);
      pos1 += 1;
    } else {
      const byte = flattenedHexList[pos];
      if (slot === '__') {
        filled.push(byte);
        pos += 1;
        pos1 += 1;
      } else if (slot === '_!') {
        if (/[a-zA-Z]/.test(byte?.[1] || '')) {
          filled.push('20');
        } else {
          filled.push(byte);
          pos += 1;
        }
        pos1 += 1;
      } else if (slot === '!_') {
        if (/[a-zA-Z]/.test(byte?.[0] || '')) {
          filled.push('20');
        } else {
          filled.push(byte);
          pos += 1;
        }
        pos1 += 1;
      } else if (slot === '!!') {
        if (/^\d+$/.test(byte || '')) {
          filled.push(byte);
          filled.push('\n');
          pos += 1;
        } else if (/[a-zA-Z]/.test(byte?.[0] || '') || /[a-zA-Z]/.test(byte?.[1] || '')) {
          if (flattenedHexList[pos - 1] === 'F4') {
            const idx = filled.lastIndexOf('F4');
            if (idx !== -1) {
              filled.splice(idx, 1, '20');
            }
            pos -= 1;
            filled.push('20');
          } else {
            filled.push('20');
          }
          filled.push('\n');
        }
        pos1 = 0;
        id += 1;
      }
    }

    if (flattenedHexList.length === pos) {
      break;
    }
  }

  if (filled.length - 6 > 20) {
    status = false;
  }

  return { filled, id, status, flattenedHexList };
}

/**
 * Thuật toán Spell biến A, B, C (Basic Overflow) cho fx-580VN X
 * Chuẩn 100% theo web tool và dự án Tool-spell-on-CASIO-fx-580VN-X của Phong2k11® & AxesMC
 */
export function generate580Var(inputText) {
  const line = (inputText || '').trim();
  if (line.length > 17) {
    const errorMsg = 'Câu không hợp lệ. Tool chỉ hỗ trợ spell tối đa 17 ký tự!';
    return {
      isValid: false,
      error: errorMsg,
      rawTerminalOutput: `${errorMsg}\nVui lòng nhập nội dung có độ dài từ 1 đến 17 ký tự.`,
      steps: [],
      breakdown: [],
      variablesPrinted: [],
      char1: [],
      filledOutputs: [],
      centeredText: '',
      status: false,
      id: 0,
    };
  }

  // Căn lề giữa
  const { ds_chu, strDisplay } = centerTextWeb(line);
  const neededChars = line.split('').map((c) => (c === ' ' ? 'Space' : c)).join(' ');

  const all_ascii_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const chars_by_hex = [];
  const chars_by_key = [];
  const found_keys = {};
  const hex_chars = [];

  for (const ki_tu of ds_chu) {
    if (CHARS_HEX_LIST.includes(ki_tu)) {
      if (!chars_by_hex.includes(ki_tu)) chars_by_hex.push(ki_tu);
    } else if (!CHARS_HEX_LIST.includes(ki_tu) && all_ascii_chars.includes(ki_tu)) {
      chars_by_key.push(ki_tu);
    } else if (!CHARS_HEX_LIST.includes(ki_tu) && !all_ascii_chars.includes(ki_tu) && ki_tu !== ' ' && !/^\d$/.test(ki_tu)) {
      if (ki_tu !== '!' && !chars_by_hex.includes(ki_tu)) {
        chars_by_hex.push(ki_tu);
      }
    } else if (ki_tu === '!' && !/^\d$/.test(ki_tu)) {
      chars_by_key.push(ki_tu);
    } else if (/^\d$/.test(ki_tu)) {
      chars_by_key.push(ki_tu);
    }
  }

  // Lấy danh sách hex theo thứ tự xuất hiện trong ds_chu
  const hex_list_ordered = [];
  for (const ki_tu of ds_chu) {
    if (chars_by_hex.includes(ki_tu)) {
      const hex_code = CHAR_TO_HEX[ki_tu];
      if (hex_code) hex_list_ordered.push(hex_code);
    }
  }

  for (const char of chars_by_key) {
    const key = CHAR_TO_BUTTON[char];
    if (key) found_keys[char] = key;
  }

  for (const byte of hex_list_ordered) {
    for (const ki_tu_hex of byte) {
      if (['A', 'B', 'C', 'D', 'E', 'F'].includes(ki_tu_hex)) {
        hex_chars.push(ki_tu_hex);
      }
    }
  }
  hex_chars.push('C');
  hex_list_ordered.push('3C');
  hex_list_ordered.push('23');

  // Fill hex_list vào A, B, C
  const { filled, id, status } = fill580(hex_list_ordered);

  // Nhóm các biến hiển thị
  const varMap = {};
  let curVar = '';
  for (const item of filled) {
    if (item === 'A = ' || item === 'B = ' || item === 'C = ') {
      curVar = item.trim().replace(' =', '');
      varMap[curVar] = [];
    } else if (item === '\n') {
      curVar = '';
    } else if (curVar && item !== 'x:') {
      varMap[curVar].push(item);
    }
  }
  const varKeys = Object.keys(varMap);

  // Màn hình Casio hiển thị (chuỗi)
  const displayTemplates = [];
  varKeys.forEach((v, idx) => {
    const isLast = idx === varKeys.length - 1;
    displayTemplates.push(`${v} = ${varMap[v].join(' ')}${isLast ? '' : ':'}`);
  });

  // Cách nhập từng biến cho Bước 4
  const waysToInput = [];
  varKeys.forEach((v, idx) => {
    const isLast = idx === varKeys.length - 1;
    const tokens = [];
    const varBtn = v === 'A' ? '[alpha] [(-)]' : v === 'B' ? '[alpha] [□ \' "]' : '[alpha] [x⁻¹]';
    tokens.push(varBtn, '[alpha] [CALC]');
    for (const b of varMap[v]) {
      if (b === '1.0000') tokens.push('[1] [.] [0] [0] [0] [0]');
      else if (b === '1.') tokens.push('[1] [.]');
      else if (b === '×10') tokens.push('[×10]');
      else {
        for (const ch of b) {
          if (/\d/.test(ch)) tokens.push(`[${ch}]`);
          else if (['A', 'B', 'C', 'D', 'E', 'F'].includes(ch)) tokens.push('[>]');
          else if (ch === '.') tokens.push('[.]');
        }
      }
    }
    if (!isLast) tokens.push('[alpha] [∫]');
    waysToInput.push(`• ${tokens.join(' ')}`);
  });

  // Bước 4 keys
  const step4TakeKeys = hex_chars.map((c) => TAKE_CHARS[c] || c).join(' ');
  const step4Keys = `${step4TakeKeys}\n([<] [9] [DEL])×${hex_chars.length} [DEL]×10 [alpha] [∫]`;

  // Bước 5 keys (mode 100an)
  const step5Keys = '[x] [alpha] [CALC] [shift] [x] [x] [shift] [)] [9] [shift] [)] [9] [CALC] [=] [<] [shift] [.] [shift] [.] [<] [<] [DEL] [∨] [shift] [8] [∨] [2] [6] [<] [<] [>] [9] [DEL] [<] [)] [+] [100 số bất kì]\n[CALC] [=]';

  // Bước 6 keys (Lấy @)
  const step6Ext = varKeys
    .map((v, i) => (i === 0 ? '[shift] [7] [4] [8]' : i === 1 ? '[shift] [7] [4] [9]' : '[shift] [7] [1] [4]'))
    .join(' ');
  const step6Keys = `[x] [alpha] [CALC] [shift] [x] [x] [shift] [)] [9] [shift] [)] [9] [CALC] [=] [<] [shift] [.] ${step6Ext}\n([<] [9] [DEL])×${varKeys.length}`;

  const atDisplayTemplates = [];
  varKeys.forEach((v, idx) => {
    const isLast = idx === varKeys.length - 1;
    atDisplayTemplates.push(`@=${v}${isLast ? '' : ':'}`);
  });

  let step6HowTo = '[DEL]×10 [<] [1] [2] [3] [4] [5] [6] [7] [8] [9] [>] [alpha] [∫]';
  varKeys.forEach((v, i) => {
    const btn = v === 'A' ? '[alpha] [(-)]' : v === 'B' ? '[alpha] [□ \' "]' : '[alpha] [x⁻¹]';
    if (i === 0) {
      step6HowTo += ` [>] [alpha] [CALC] ${btn}`;
    } else {
      step6HowTo += ` [alpha] [∫] [>] [alpha] [CALC] ${btn}`;
    }
  });

  // Bước 7 keys (Xóa Byte thừa)
  const list_lo = filled.filter((x) => x !== 'A = ' && x !== 'B = ' && x !== 'C = ');
  const listLoRev = [...list_lo].reverse().filter((x) => x !== 'x:' && x !== '\n');
  let countDel = 0;
  const step7Tokens = [];
  for (const i of listLoRev) {
    if (i === '20') {
      step7Tokens.push(countDel === 0 ? '[DEL]' : `[<]x${countDel} [DEL]`);
      countDel = 0;
    } else if (i === '1.') {
      step7Tokens.push(countDel === 0 ? '[DEL]x2' : `[<]x${countDel} [DEL]x2`);
      countDel = 0;
    } else if (i === '1.0000') {
      if (countDel !== 0) step7Tokens.push(`[<]x${countDel}`);
      countDel = 0;
    } else if (i === '×10' || i === 'F4') {
      // pass
    } else {
      countDel++;
    }
  }
  step7Tokens.push('[<]x5');
  const step7DeleteKeys = step7Tokens.join(' ');

  // Bước 8 keys (Gán kí tự và hoàn thiện Hackstring)
  let b = 0;
  const step8Tokens = [];
  for (const char of ds_chu) {
    if (char === ' ') {
      step8Tokens.push('[shift] [8] [3] [4]');
      b++;
    } else if (!all_ascii_chars.includes(char)) {
      step8Tokens.push('[>]');
      b++;
    } else if (CHARS_HEX_LIST.includes(char)) {
      step8Tokens.push('[>]');
      // Không tăng b cho ký tự ascii lấy bằng hex
    } else if (found_keys[char]) {
      step8Tokens.push(found_keys[char]);
    }
  }
  const remNums = Math.max(0, 17 - b);
  const step8Keys = `${step8Tokens.join(' ')}\n[${remNums} số bất kì] [shift] [(] [>] [2] [x]`;

  // BƯỚC CUỐI
  const stepLastKeys = '[CALC] [=]';

  // Chuỗi hex summary
  const hexSummary = chars_by_hex.map((c) => `${c} = ${CHAR_TO_HEX[c] || ''}`).join(' · ');

  // Format Text Raw Terminal chuẩn 100% y hệt Web Gốc
  let raw = `Kí tự cần: ${neededChars}\n`;
  raw += `Kí tự lấy qua Biến: ${chars_by_hex.join(' ')}\n`;
  raw += `hex: ${hexSummary}\n\n`;
  raw += `Hiển thị: ${strDisplay}\n\n`;
  raw += 'Ký hiệu: [∨] xuống · [<] trái · [>] phải · [∧] lên\n\n';

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 1 · Reset máy\n[shift] [9] [3] [=] [=]\n\n';

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 2 · Vào LineI/O\n[shift] [menu] [1] [3]\n\n';

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 3 · Basic Overflow\n';
  raw += '[x] [alpha] [CALC] [shift] [x] [x] [shift] [)] [9] [shift] [)] [9] [9] [9] [CALC] [=] [AC] [<] [DEL] [DEL] [CALC] [=] [<] [shift] [. ]\n\n'.replace('. ]', '.]');

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 4 · Lấy kí tự cần thiết và Gán biến\n';
  raw += `${step4Keys}\n\n`;
  raw += 'Màn hình Casio hiển thị:\nx:\n';
  raw += `${displayTemplates.join('\n')}\n\n`;
  raw += 'Cách nhập từng biến:\n';
  raw += `${waysToInput.join('\n')}\n\n`;
  raw += `Rồi bấm: [CALC] ([=])×${id + 2} lần\n\n`;

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 5 · Vào mode 100an\n';
  raw += `${step5Keys}\n\n`;

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += `BƯỚC 6 · Lấy "${'@'.repeat(varKeys.length)}"\n`;
  raw += `${step6Keys}\n\n`;
  raw += 'Màn hình Casio hiển thị:\n123456789x:\n';
  raw += `${atDisplayTemplates.join('\n')}\n\n`;
  raw += 'Cách làm:\n';
  raw += `${step6HowTo}\n`;
  raw += `[CALC] ([=])×${id + 2} [∧]\n\n`;

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 7 · Xóa Byte thừa\n';
  raw += `${step7DeleteKeys}\n\n`;

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC 8 · Gán kí tự và hoàn thiện Hackstring\n';
  raw += `${step8Keys}\n\n`;

  raw += '━━━━━━━━━━━━━━━━━━━━━━━━\n';
  raw += 'BƯỚC CUỐI\n';
  raw += `${stepLastKeys}\n`;

  // Các thẻ bước cho StepGuide (Card View)
  const steps = [
    {
      step: 1,
      title: 'BƯỚC 1 · Reset máy',
      desc: 'Khôi phục cài đặt gốc máy tính Casio fx-580VN X',
      keys: '[shift] [9] [3] [=] [=]',
    },
    {
      step: 2,
      title: 'BƯỚC 2 · Vào LineI/O',
      desc: 'Chuyển sang chế độ nhập một dòng (LineIO)',
      keys: '[shift] [menu] [1] [3]',
    },
    {
      step: 3,
      title: 'BƯỚC 3 · Basic Overflow',
      desc: 'Tạo tràn bộ nhớ để mở cổng ghi đè RAM máy tính',
      keys: '[x] [alpha] [CALC] [shift] [x] [x] [shift] [)] [9] [shift] [)] [9] [9] [9] [CALC] [=] [AC] [<] [DEL] [DEL] [CALC] [=] [<] [shift] [.]',
    },
    {
      step: 4,
      title: 'BƯỚC 4 · Lấy kí tự cần thiết và Gán biến',
      desc: `Lấy ${hex_chars.length} ký tự Hex (${hex_chars.join(', ')}) và gán vào các biến ${varKeys.join(', ')}`,
      keys: step4Keys,
      displayTemplates: ['x:', ...displayTemplates],
      waysTitle: 'Cách nhập từng biến:',
      waysToInput,
      calcRepeat: `[CALC] ([=])×${id + 2} lần`,
    },
    {
      step: 5,
      title: 'BƯỚC 5 · Vào mode 100an',
      desc: 'Trích xuất ký tự điều khiển "an" và tạo vùng đệm tràn 100 số',
      keys: step5Keys,
    },
    {
      step: 6,
      title: `BƯỚC 6 · Lấy "${'@'.repeat(varKeys.length)}"`,
      desc: `Trích xuất ký tự '@' tương ứng cho ${varKeys.length} biến (${varKeys.join(', ')})`,
      keys: step6Keys,
      displayTemplates: ['123456789x:', ...atDisplayTemplates],
      waysTitle: 'Cách làm:',
      waysToInput: [step6HowTo, `[CALC] ([=])×${id + 2} [∧]`],
    },
    {
      step: 7,
      title: 'BƯỚC 7 · Xóa Byte thừa',
      desc: 'Di chuyển con trỏ và xóa các byte đệm rác để chừa chỗ hiển thị',
      keys: step7DeleteKeys,
    },
    {
      step: 8,
      title: 'BƯỚC 8 · Gán kí tự và hoàn thiện Hackstring',
      desc: `Gõ chuỗi ký tự hiển thị đã căn giữa: "${strDisplay}"`,
      keys: step8Keys,
    },
    {
      step: 9,
      title: 'BƯỚC CUỐI',
      desc: 'Bấm CALC rồi bấm = để chuỗi chữ hiển thị chính xác lên màn hình',
      keys: stepLastKeys,
    },
  ];

  // Bảng breakdown
  const breakdown = ds_chu.map((char) => {
    const isHex = chars_by_hex.includes(char);
    const hex = CHAR_TO_HEX[char] || '20';
    return {
      char,
      hex,
      isMultiByte: hex.includes(' ') || hex.startsWith('F4'),
      source: isHex ? 'Biến Hex' : 'Phím bấm',
      button: found_keys[char] || (char === ' ' ? '[shift] [8] [3] [4]' : '[>]'),
    };
  });

  return {
    isValid: true,
    status,
    rawTerminalOutput: raw,
    steps,
    breakdown,
    centeredText: line,
    strDisplay,
    char1: hex_chars,
    variablesPrinted: varKeys,
    filledOutputs: displayTemplates,
    id,
  };
}

/**
 * Thuật toán QuickCPY++ (Inject nhiều dòng tối đa 8 dòng x 32 ký tự)
 */
export function generateAxesMC580Inj(linesArray = []) {
  const lines = linesArray.slice(0, 8);
  const numLines = Math.max(1, lines.length);

  if (numLines <= 4) {
    let rawOutput = 'Inject các đoạn code sau vào EA30 (Vào bằng QuickCPY++)\n\n';
    const formattedBlocks = [];

    for (let idx = 0; idx < numLines; idx++) {
      const lineText = lines[idx] || '';
      const { ds_chu } = centerTextWeb(lineText);
      const hexList = [];

      for (const ch of ds_chu) {
        const hex = CHAR_TO_HEX[ch];
        if (hex) {
          const parts = hex.trim().split(/\s+/);
          for (const p of parts) hexList.push(p);
        } else {
          hexList.push('20');
        }
      }

      while (hexList.length < 32) hexList.push('20');
      const hex32 = hexList.slice(0, 32);

      const row1 = hex32.slice(0, 16).join(' ');
      const row2 = hex32.slice(16, 32).join(' ');

      const blockStr = `${row1}\n${row2}\n[menu] [3]`;
      formattedBlocks.push(blockStr);
      rawOutput += `${blockStr}\n\n`;
    }

    for (let z = 0; z < 4 - numLines; z++) {
      const emptyRow = Array(16).fill('20').join(' ');
      const blockStr = `${emptyRow}\n${emptyRow}\n[menu] [3]`;
      formattedBlocks.push(blockStr);
      rawOutput += `${blockStr}\n\n`;
    }

    rawOutput += '5A 32 30 30 08 01 30 EA 30 30 30 30 CC 3D 32 30\n';
    rawOutput += '12 9D 30 30 08 09 CC 3D 32 30 12 9D 30 30 08 11\n';
    rawOutput += 'CC 3D 32 30 12 9D 30 30 08 19 CC 3D 32 30 7E 94\n';
    rawOutput += '30 30 DE 3D 32 30 00 00 00 00 00 00 00 00 00 00\n';
    rawOutput += '[Menu] [3]\n';

    return {
      isValid: true,
      method: 'inj_4',
      address: 'EA30',
      numLines,
      rawTerminalOutput: rawOutput,
      steps: [
        {
          step: 1,
          title: 'Vào QuickCPY++ tại địa chỉ EA30',
          desc: 'Sử dụng QuickCPY++ để mở bảng nạp dữ liệu tại offset EA30.',
          keys: '[OPTN] [QuickCPY++] [EA30]',
        },
        {
          step: 2,
          title: 'Nạp các block dữ liệu hex vào bộ nhớ',
          desc: 'Nhập chính xác từng dòng hex 16 bytes và kết thúc mỗi block bằng [MENU] [3].',
          keys: '[MENU] [3]',
        },
      ],
      breakdown: [],
      centeredText: lines.join(' | '),
      char1: [],
      variablesPrinted: [],
      filledOutputs: [],
    };
  }

  let rawOutput = 'Inject các đoạn code sau vào E9E0 (Vào bằng QuickCPY++)\n\n';
  const allHex = [];

  for (let idx = 0; idx < numLines; idx++) {
    const lineText = lines[idx] || '';
    const { ds_chu } = centerTextWeb(lineText);
    const hexList = [];

    for (const ch of ds_chu) {
      const hex = CHAR_TO_HEX[ch];
      if (hex) {
        const parts = hex.trim().split(/\s+/);
        for (const p of parts) hexList.push(p);
      } else {
        hexList.push('20');
      }
    }

    while (hexList.length < 32) hexList.push('20');
    for (const h of hexList.slice(0, 32)) allHex.push(h);
  }

  for (let z = 0; z < 8 - numLines; z++) {
    for (let a = 0; a < 32; a++) {
      allHex.push('20');
    }
  }

  let i = 0;
  while (i < allHex.length) {
    const groupOf96 = allHex.slice(i, i + 96);
    while (groupOf96.length < 96) groupOf96.push('00');
    for (let j = 0; j < 96; j += 16) {
      const row = groupOf96.slice(j, j + 16);
      rawOutput += `${row.join(' ')}\n`;
    }
    rawOutput += '[menu] [3]\n';
    i += 96;
  }

  rawOutput += 'DA 7B 31 30 08 01 30 EA 30 30 30 30 CC 3D 32 30\n';
  rawOutput += '12 9D 30 30 08 09 CC 3D 32 30 12 9D 30 30 08 11\n';
  rawOutput += 'CC 3D 32 30 12 9D 30 30 08 19 CC 3D 32 30 12 9D\n';
  rawOutput += '30 30 08 21 CC 3D 32 30 12 9D 30 30 08 29 CC 3D\n';
  rawOutput += '32 30 12 9D 30 30 08 31 CC 3D 32 30 12 9D 30 30\n';
  rawOutput += '08 39 CC 3D 32 30 7E 94 30 30 DE 3D 32 30 00 00\n';
  rawOutput += '[Menu] [3]\n';

  return {
    isValid: true,
    method: 'inj_8',
    address: 'E9E0',
    numLines,
    rawTerminalOutput: rawOutput,
    steps: [
      {
        step: 1,
        title: 'Vào QuickCPY++ tại địa chỉ E9E0',
        desc: 'Mở bảng nạp dữ liệu tại offset E9E0 cho chế độ 8 dòng.',
        keys: '[OPTN] [QuickCPY++] [E9E0]',
      },
      {
        step: 2,
        title: 'Nạp khối dữ liệu hex',
        desc: 'Nhập từng nhóm 96 bytes và kết thúc mỗi nhóm bằng [MENU] [3].',
        keys: '[MENU] [3]',
      },
    ],
    breakdown: [],
    centeredText: lines.join(' | '),
    char1: [],
    variablesPrinted: [],
    filledOutputs: [],
  };
}

/**
 * Entry point cho Spell Casio fx-580VN X
 */
export function generate580Spell(input, method = 'var') {
  if (method === 'inj') {
    const lines = Array.isArray(input) ? input : [input];
    return generateAxesMC580Inj(lines);
  }
  const text = Array.isArray(input) ? input[0] || '' : input;
  return generate580Var(text);
}
