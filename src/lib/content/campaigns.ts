// Nội dung các chương trình khuyến mãi / hoạt động thương hiệu.
//
// Cố ý để ở dạng TypeScript tĩnh thay vì bảng Supabase: thể lệ là văn bản pháp
// lý có cấu trúc (bảng cơ cấu giải, danh sách điều kiện, mục đánh số La Mã) —
// nhét vào một trình soạn thảo text phẳng trong admin sẽ vừa khó sửa vừa dễ
// làm hỏng cấu trúc. Khi nào cần cho người không-lập-trình tự đăng chương
// trình mới thì chuyển sang bảng riêng, giữ nguyên các type bên dưới làm schema.

export type LocalizedText = { vi: string; en: string };

export type CampaignStatus = "running" | "upcoming" | "ended";

/** Một dòng trong bảng cơ cấu giải thưởng. */
export type PrizeTier = {
  /** Mệnh giá tiền mặt, dùng để render con số lớn. null = dòng không phải giải tiền. */
  amount: number | null;
  label: LocalizedText;
  /**
   * KHÔNG hiển thị ra trang — xem ghi chú ở `totalPrizeValue`. Vẫn giữ lại vì
   * đây là số liệu trong bản thể lệ đã duyệt. Giữ dạng chuỗi vì thể lệ ghi
   * ">1000", ">814" chứ không phải số chính xác.
   */
  quantity: string;
  /** Quyết định cách tô màu: giải nhất / giải tiền mặt / dòng phụ (không trúng). */
  tone: "top" | "cash" | "muted";
};

export type CampaignStep = {
  title: LocalizedText;
  desc: LocalizedText;
};

/** Mỗi combo sản phẩm tặng kèm bao nhiêu thẻ cào. */
export type ComboTier = {
  combo: number;
  cards: number;
  label: LocalizedText;
};

/** Một khối nội dung bên trong một mục thể lệ. */
export type RuleBlock =
  | { kind: "paragraph"; text: LocalizedText }
  | { kind: "list"; items: LocalizedText[] };

export type RuleSection = {
  /** Số La Mã đúng theo bản thể lệ gốc, để đối chiếu với file PDF đã duyệt. */
  numeral: string;
  heading: LocalizedText;
  blocks: RuleBlock[];
};

export type Campaign = {
  slug: string;
  status: CampaignStatus;
  /** Dòng nhỏ phía trên tên chương trình. */
  eyebrow: LocalizedText;
  name: LocalizedText;
  /** Phần tên được tô accent trong H1 — phải là hậu tố của `name`. */
  nameAccent: LocalizedText;
  tagline: LocalizedText;
  /** Dòng tóm tắt hiển thị ở trang danh sách. */
  summary: LocalizedText;
  period: LocalizedText;
  redeemWindow: LocalizedText;
  /**
   * KHÔNG hiển thị ra trang, cùng với `cashPrizeCount` và `PrizeTier.quantity`.
   * Theo yêu cầu marketing: công bố "1 giải 500k, 5 giải 200k" trên tổng số
   * hơn 2.000 thẻ làm chương trình kém hấp dẫn. Giữ lại trong mã nguồn vì đây
   * là số liệu của bản thể lệ đã duyệt và là thứ cần đối chiếu nếu phải nộp/
   * công bố cơ cấu giải; muốn bật lại chỉ cần render các trường này.
   */
  totalPrizeValue: number;
  /** Tổng số giải có mệnh giá tiền (1 + 5 + 10 + 20 + 150). Không hiển thị. */
  cashPrizeCount: number;
  productUrl: string;
  organizer: LocalizedText;
  steps: CampaignStep[];
  prizes: PrizeTier[];
  prizeNote: LocalizedText;
  comboTiers: ComboTier[];
  comboNote: LocalizedText;
  rules: RuleSection[];
};

export const CAMPAIGNS: Campaign[] = [
  {
    slug: "cao-nhanh-tay-trung-ngay-500k",
    status: "running",
    eyebrow: { vi: "Chương trình trúng thưởng", en: "Prize campaign" },
    name: { vi: "Cào nhanh tay — Trúng ngay 500K", en: "Scratch fast — Win 500K now" },
    nameAccent: { vi: "Trúng ngay 500K", en: "Win 500K now" },
    tagline: {
      vi: "Mỗi gói hàng bột vệ sinh lồng giặt SAIZA đều có một thẻ cào. Cào lớp phủ bạc, quét mã QR, nhận thưởng tiền mặt.",
      en: "Every SAIZA washing-machine drum cleaner parcel contains a scratch card. Scratch the silver layer, scan the QR code, receive your cash prize.",
    },
    summary: {
      vi: "Tặng thẻ cào trong mỗi đơn combo bột vệ sinh lồng giặt. Cào lớp bạc, quét mã QR, nhận ngay tiền mặt — giải cao nhất 500.000đ.",
      en: "A scratch card in every drum-cleaner combo order. Scratch, scan the QR code and get cash straight away — top prize 500,000₫.",
    },
    period: {
      vi: "Từ tháng 10/2026 đến khi hết giải thưởng",
      en: "From October 2026 until all prizes are claimed",
    },
    redeemWindow: {
      vi: "Quét mã và đổi giải trong vòng 30 ngày kể từ ngày đơn hàng được giao thành công",
      en: "Scan and redeem within 30 days of successful order delivery",
    },
    totalPrizeValue: 5_000_000,
    cashPrizeCount: 186,
    productUrl: "https://shop.tiktok.com/vn/pdp/1730178865953081820?_t=ZS-9A7wijvUYdQ",
    organizer: { vi: "Công ty TNHH Sova Group", en: "Sova Group Company Limited" },

    steps: [
      {
        title: { vi: "Tìm thẻ cào", en: "Find the card" },
        desc: {
          vi: "Thẻ cào nằm bên trong mỗi gói hàng SAIZA (hộp carton).",
          en: "The scratch card is inside every SAIZA parcel (carton box).",
        },
      },
      {
        title: { vi: "Cào lớp phủ bạc", en: "Scratch the silver layer" },
        desc: {
          vi: "Cào để xem giải thưởng và mã nhận thưởng của bạn.",
          en: "Scratch to reveal your prize and your redemption code.",
        },
      },
      {
        title: { vi: "Quét mã QR", en: "Scan the QR code" },
        desc: {
          vi: "Nếu mã trúng thưởng, quét mã QR trên thẻ cào để nhập thông tin và chờ nhận thưởng.",
          en: "If your code wins, scan the QR code on the card to submit your details and await your prize.",
        },
      },
      {
        title: { vi: "Nhận thưởng qua Zalo", en: "Get paid via Zalo" },
        desc: {
          vi: "Sau khi trả thưởng, BTC liên hệ qua Zalo để gửi thông tin xác nhận trả thưởng.",
          en: "After payout, the organiser contacts you on Zalo with the payment confirmation.",
        },
      },
    ],

    prizes: [
      {
        amount: 500_000,
        label: { vi: "Thẻ cào trúng thưởng trị giá 500.000 đ", en: "Winning card worth 500,000₫" },
        quantity: "1",
        tone: "top",
      },
      {
        amount: 200_000,
        label: { vi: "Thẻ cào trúng thưởng trị giá 200.000 đ", en: "Winning card worth 200,000₫" },
        quantity: "5",
        tone: "cash",
      },
      {
        amount: 100_000,
        label: { vi: "Thẻ cào trúng thưởng trị giá 100.000 đ", en: "Winning card worth 100,000₫" },
        quantity: "10",
        tone: "cash",
      },
      {
        amount: 50_000,
        label: { vi: "Thẻ cào trúng thưởng trị giá 50.000 đ", en: "Winning card worth 50,000₫" },
        quantity: "20",
        tone: "cash",
      },
      {
        amount: 10_000,
        label: { vi: "Thẻ cào trúng thưởng trị giá 10.000 đ", en: "Winning card worth 10,000₫" },
        quantity: "150",
        tone: "cash",
      },
      {
        amount: null,
        label: {
          vi: "Thẻ cào để ở hộp quà đóng ngoài, có giá trị hiện kim là 1 trong 6 giá trị trên",
          en: "Scratch cards placed in the outer gift box, each carrying one of the six values above",
        },
        quantity: ">1000",
        tone: "muted",
      },
      {
        amount: null,
        label: { vi: "Chúc bạn may mắn lần sau", en: "Better luck next time" },
        quantity: ">814",
        tone: "muted",
      },
    ],
    prizeNote: {
      vi: "Giải thưởng có giá trị quy đổi thành tiền.",
      en: "All prizes are redeemable for their cash value.",
    },

    comboTiers: [
      { combo: 3, cards: 1, label: { vi: "Combo 3 gói", en: "3-pack combo" } },
      { combo: 6, cards: 2, label: { vi: "Combo 6 gói", en: "6-pack combo" } },
      { combo: 10, cards: 3, label: { vi: "Combo 10 gói", en: "10-pack combo" } },
    ],
    comboNote: {
      vi: "Áp dụng cho các sản phẩm bột vệ sinh lồng giặt SAIZA combo 3, combo 6 và combo 10.",
      en: "Applies to SAIZA washing-machine drum cleaner powder in 3-, 6- and 10-pack combos.",
    },

    rules: [
      {
        numeral: "I",
        heading: { vi: "Đối tượng tham gia", en: "Eligibility" },
        blocks: [
          {
            kind: "list",
            items: [
              {
                vi: 'Tất cả công dân Việt Nam từ 16 tuổi trở lên (nếu dưới 16 tuổi cần có người giám hộ), đang sinh sống tại Việt Nam và có đủ năng lực hành vi dân sự trong thời gian tham gia Chương Trình "Cào nhanh tay - Trúng ngay 500K" ("Chương Trình") (sau đây được gọi tắt là "Người Tham Gia" hoặc "Người Chơi").',
                en: 'All Vietnamese citizens aged 16 or above (participants under 16 require a legal guardian), residing in Vietnam and having full civil capacity throughout the "Scratch fast - Win 500K now" campaign (the "Campaign"), hereinafter referred to as the "Participant" or "Player".',
              },
              {
                vi: 'Người Tham Gia phải có tài khoản Zalo (sau đây gọi là "Tài Khoản"), Tài Khoản của Người Tham Gia phải là tài khoản chính chủ và là tài khoản thật.',
                en: 'The Participant must hold a Zalo account (the "Account"). The Account must be genuine and belong to the Participant personally.',
              },
              {
                vi: "Nhân viên Công ty TNHH Sova Group, nhân viên các nhà phân phối, các công ty dịch vụ và các bên thứ ba khác là các đối tác của Sova Group, nhân viên các công ty quảng cáo, truyền thông và in ấn phục vụ Chương Trình đều không được tham gia Chương Trình này.",
                en: "Employees of Sova Group Company Limited, its distributors, service providers and other third-party partners, as well as employees of the advertising, media and printing companies serving the Campaign, are not permitted to participate.",
              },
              {
                vi: 'Lưu ý: Xin vui lòng đọc kỹ Thể lệ Chương Trình này ("Thể lệ") để hiểu rõ các điều kiện và điều khoản khi tham gia Chương Trình. Bằng việc tham gia Chương Trình này, bạn được xem là đồng ý với tất cả điều khoản và điều kiện được nêu ra trong Thể lệ.',
                en: 'Note: Please read these Campaign Rules (the "Rules") carefully to understand the terms and conditions of participation. By taking part in the Campaign, you are deemed to accept all terms and conditions set out in the Rules.',
              },
            ],
          },
        ],
      },
      {
        numeral: "II",
        heading: { vi: "Thời gian tham gia", en: "Campaign period" },
        blocks: [
          {
            kind: "paragraph",
            text: {
              vi: "Từ ngày xx/10/2026 đến khi hết giải thưởng.",
              en: "From xx/10/2026 until all prizes have been awarded.",
            },
          },
          {
            kind: "paragraph",
            text: {
              vi: "Hạn chót quét mã và đổi giải: trong 30 ngày kể từ ngày đơn hàng được giao thành công đến người nhận.",
              en: "Deadline to scan and redeem: within 30 days from the date the order is successfully delivered to the recipient.",
            },
          },
        ],
      },
      {
        numeral: "III",
        heading: { vi: "Cách thức tham gia", en: "How to participate" },
        blocks: [
          {
            kind: "paragraph",
            text: {
              vi: "Bước 1: Tìm thẻ cào bên trong mỗi gói hàng Saiza (hộp carton).",
              en: "Step 1: Find the scratch card inside every Saiza parcel (carton box).",
            },
          },
          {
            kind: "paragraph",
            text: {
              vi: "Bước 2: Cào lớp phủ bạc, xem giải thưởng và mã nhận thưởng của bạn.",
              en: "Step 2: Scratch off the silver layer to reveal your prize and redemption code.",
            },
          },
          {
            kind: "paragraph",
            text: {
              vi: "Bước 3: Nếu mã trúng thưởng, quét mã QR trên thẻ cào để nhập thông tin và chờ nhận thưởng (cơ cấu giải thưởng được công bố ở mục IV).",
              en: "Step 3: If your code is a winner, scan the QR code on the card to submit your details and await your prize (the prize structure is published in Section IV).",
            },
          },
          {
            kind: "paragraph",
            text: {
              vi: "Bước 4: Sau khi trả thưởng, BTC sẽ tiến hành liên hệ với Người Chơi thông qua Zalo để gửi thông tin xác nhận trả thưởng.",
              en: "Step 4: After payout, the organiser will contact the Player via Zalo to send the payment confirmation.",
            },
          },
          {
            kind: "paragraph",
            text: { vi: "Sản phẩm áp dụng:", en: "Applicable products:" },
          },
          {
            kind: "list",
            items: [
              {
                vi: "Các sản phẩm bột vệ sinh lồng giặt combo 3, combo 6, combo 10.",
                en: "Washing-machine drum cleaner powder in 3-pack, 6-pack and 10-pack combos.",
              },
              {
                vi: "Mỗi khách hàng đặt combo 3 gói sẽ được tặng 1 thẻ cào, đặt combo 6 gói sẽ được tặng 2 thẻ cào, đặt combo 10 sẽ được tặng 3 thẻ cào.",
                en: "Each customer ordering a 3-pack combo receives 1 scratch card, a 6-pack combo receives 2 cards, and a 10-pack combo receives 3 cards.",
              },
            ],
          },
        ],
      },
      {
        numeral: "IV",
        heading: {
          vi: "Cơ cấu giải thưởng và cách thức trao giải thưởng",
          en: "Prize structure and award process",
        },
        blocks: [
          {
            kind: "paragraph",
            text: {
              vi: "1. Cách chọn Người Chơi thắng giải và cơ cấu giải thưởng — Các mệnh giá giải thưởng được công bố ở mục “Cơ cấu giải thưởng” phía trên. Lưu ý: Giải thưởng có giá trị quy đổi thành tiền.",
              en: "1. Winner selection and prize structure — The prize denominations are published in the “Prize structure” section above. Note: prizes are redeemable for their cash value.",
            },
          },
          {
            kind: "paragraph",
            text: { vi: "2. Cách thức trao giải", en: "2. Award process" },
          },
          {
            kind: "list",
            items: [
              {
                vi: "Chương trình áp dụng với số lượng giải thưởng có giới hạn. Giải thưởng sẽ được trao theo nguyên tắc người tham gia hợp lệ sẽ nhận thưởng cho đến khi số lượng thẻ cào được phát hết, căn cứ trên thời điểm ghi nhận tham gia thành công.",
                en: "The Campaign offers a limited number of prizes. Prizes are awarded to valid participants until all scratch cards have been distributed, based on the recorded time of successful participation.",
              },
              {
                vi: "Khi quét mã nhận thưởng, Người Chơi sẽ được yêu cầu cung cấp thông tin Người Chơi cho chương trình bao gồm: Tên Người Chơi, số điện thoại, mã nhận thưởng, thông tin tài khoản nhận thưởng bao gồm (tên chủ tài khoản, số tài khoản, ngân hàng).",
                en: "When scanning the redemption code, the Player must provide: full name, phone number, redemption code, and payout account details (account holder name, account number, bank).",
              },
              {
                vi: "Giải thưởng sẽ được chuyển về cho Người Chơi đến thông tin tài khoản mà Người Chơi trúng thưởng hợp lệ cung cấp, là người đang sinh sống tại Việt Nam, có quốc tịch Việt Nam.",
                en: "Prizes are transferred to the account details provided by the valid winning Player, who must reside in Vietnam and hold Vietnamese nationality.",
              },
              {
                vi: "Người Chơi thắng giải tự chịu trách nhiệm trong việc nhận giải thưởng. Trường hợp giải thưởng đã được giao thành công cho Người Chơi đáp ứng đầy đủ các quy định trên thì BTC sẽ không chịu bất kỳ trách nhiệm nào nếu quá thời hạn trao thưởng mà người trúng thưởng vẫn không nhận được giải thưởng.",
                en: "Winning Players are responsible for claiming their prize. Where a prize has been successfully delivered to a Player meeting all the above conditions, the organiser bears no liability if the winner has still not received the prize after the award deadline.",
              },
              {
                vi: "Trường hợp thông tin số tài khoản không đúng với thông tin mà người trúng thưởng cung cấp, BTC sẽ tiến hành liên hệ qua số điện thoại người chơi cung cấp. Nếu BTC liên hệ 2 lần mà người chơi không phản hồi hoặc không liên hệ được, BTC được quyền hiểu rằng Người Chơi thắng giải không muốn nhận giải và giải thưởng này sẽ được trả về cho BTC xử lý theo quy định của chương trình.",
                en: "If the account details do not match those supplied by the winner, the organiser will call the phone number provided. If the Player does not respond to, or cannot be reached on, two attempts, the organiser may treat this as a decision not to claim, and the prize returns to the organiser for handling under the Campaign rules.",
              },
              {
                vi: "Người Chơi thắng giải chịu trách nhiệm về tính đầy đủ và chính xác của thông tin cung cấp cho BTC cho mục đích của thể lệ này. BTC sẽ không chịu trách nhiệm trong trường hợp không thể trao thưởng cho Người Chơi thắng giải nếu Người Chơi thắng giải không cung cấp hoặc cung cấp không đầy đủ/chính xác/trung thực các thông tin theo thể lệ Chương trình này, hoặc do các lý do khách quan,… BTC xem là hoàn tất nghĩa vụ khi đã gửi giải thưởng theo đúng thông tin mà Người Tham Gia thắng giải đã cung cấp và có hóa đơn xác nhận đã chuyển thưởng cho Người Chơi.",
                en: "Winning Players are responsible for the completeness and accuracy of the information they provide. The organiser is not liable where a prize cannot be awarded because the winner failed to provide, or provided incomplete/inaccurate/untruthful, information under these Rules, or for reasons beyond its control. The organiser's obligation is considered discharged once the prize has been sent according to the details supplied by the winning Participant and a transfer receipt exists.",
              },
              {
                vi: "Trong vòng 30 ngày kể từ thời điểm BTC tiến hành trả thưởng cho Người Chơi trúng thưởng mà không nhận được bất kì thông tin khiếu nại/phản ánh nào liên quan đến việc Người Chơi không nhận được phần thưởng, thì việc trao thưởng mặc nhiên được xác định là hoàn tất. Quá thời hạn này, nếu Người Chơi trúng thưởng liên hệ khiếu nại với BTC thì giải thưởng sẽ được xử lý theo quyết định của BTC.",
                en: "If no complaint about non-receipt of a prize is raised within 30 days of the organiser issuing payment, the award is automatically deemed complete. After this period, any complaint from a winning Player will be handled at the organiser's discretion.",
              },
              {
                vi: "Người trao thưởng chỉ có trách nhiệm đối chiếu thông tin xuất trình của Người Chơi thắng giải với thông tin nhận thưởng đã được cung cấp cho BTC.",
                en: "The payer's sole responsibility is to reconcile the information presented by the winning Player against the redemption details provided to the organiser.",
              },
              {
                vi: "BTC có quyền từ chối trao thưởng cho Người Chơi thắng giải không thỏa các điều kiện nhận giải nêu trên. Phần thưởng không có người nhận sẽ được xử lý theo quy định của pháp luật hiện hành.",
                en: "The organiser may refuse to award a prize to a winning Player who does not meet the above conditions. Unclaimed prizes will be handled in accordance with applicable law.",
              },
              {
                vi: "Trong trường hợp BTC phát hiện Người Tham Gia có dấu hiệu gian lận hoặc có mục đích hoặc hành vi vi phạm quy định của Chương Trình thì BTC có quyền loại bỏ giải thưởng mà không cần thông báo trước.",
                en: "If the organiser detects signs of fraud, or intent or conduct breaching the Campaign rules, it may disqualify the prize without prior notice.",
              },
            ],
          },
        ],
      },
      {
        numeral: "V",
        heading: { vi: "Thu thập dữ liệu", en: "Data collection" },
        blocks: [
          {
            kind: "paragraph",
            text: {
              vi: "BTC/Công ty TNHH Sova Group và người chuyển thưởng sẽ thu thập thông tin cá nhân Người Tham Gia chương trình này, bao gồm:",
              en: "The organiser / Sova Group Company Limited and the payout agent will collect the following personal data from Participants:",
            },
          },
          {
            kind: "list",
            items: [
              { vi: "Họ và tên", en: "Full name" },
              { vi: "Số điện thoại", en: "Phone number" },
              { vi: "Mã nhận thưởng", en: "Redemption code" },
              { vi: "Giá trị giải thưởng", en: "Prize value" },
              {
                vi: "Thông tin tài khoản ngân hàng nhận thưởng (tên chủ tài khoản, số tài khoản, tên ngân hàng)",
                en: "Payout bank account details (account holder name, account number, bank name)",
              },
            ],
          },
        ],
      },
    ],
  },
];

/* ———————————— Bản rút gọn để gửi xuống trình duyệt ———————————— */

export type PublicPrizeTier = Omit<PrizeTier, "quantity">;
export type PublicCampaign = Omit<Campaign, "totalPrizeValue" | "cashPrizeCount" | "prizes"> & {
  prizes: PublicPrizeTier[];
};

/**
 * Cắt bỏ số lượng giải / tổng giá trị trước khi dữ liệu rời server.
 *
 * KHÔNG được truyền thẳng `Campaign` xuống client component: Next serialize
 * toàn bộ props vào RSC payload nhúng trong HTML, nên dù không render ra màn
 * hình thì `totalPrizeValue`, `cashPrizeCount`, `quantity` từng giải và dòng
 * "Chúc bạn may mắn lần sau" vẫn đọc được bằng Xem nguồn trang — đúng những
 * con số marketing yêu cầu không công bố (xem ghi chú ở `totalPrizeValue`).
 *
 * Cố ý liệt kê từng trường thay vì dùng destructuring-omit: thêm trường nhạy
 * cảm mới vào `Campaign` sau này sẽ KHÔNG tự động lọt ra ngoài, mà phải khai
 * báo ở đây một cách có ý thức.
 */
export function toPublicCampaign(c: Campaign): PublicCampaign {
  return {
    slug: c.slug,
    status: c.status,
    eyebrow: c.eyebrow,
    name: c.name,
    nameAccent: c.nameAccent,
    tagline: c.tagline,
    summary: c.summary,
    period: c.period,
    redeemWindow: c.redeemWindow,
    productUrl: c.productUrl,
    organizer: c.organizer,
    steps: c.steps,
    // tone "muted" = các dòng chỉ dùng để thống kê số lượng (>1000 thẻ hiện
    // kim, >814 "chúc may mắn"), không hiển thị nên cũng không gửi đi.
    prizes: c.prizes
      .filter((p) => p.tone !== "muted")
      .map((p) => ({ amount: p.amount, label: p.label, tone: p.tone })),
    prizeNote: c.prizeNote,
    comboTiers: c.comboTiers,
    comboNote: c.comboNote,
    rules: c.rules,
  };
}

export function getCampaignBySlug(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

/** Đang chạy trước, đã kết thúc sau — trang danh sách luôn mở đầu bằng thứ còn tham gia được. */
const STATUS_ORDER: Record<CampaignStatus, number> = { running: 0, upcoming: 1, ended: 2 };

export function getSortedCampaigns(): Campaign[] {
  return [...CAMPAIGNS].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

/** "5.000.000" — dấu chấm phân nhóm theo quy ước tiếng Việt, dùng chung cho cả 2 ngôn ngữ. */
export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN");
}
