export type OfficeId = "hcm" | "danang";

export type Office = {
  id: OfficeId;
  address: string;
  mapSrc: string;
};

export const offices: Office[] = [
  {
    id: "hcm",
    address: "131 Đường số 1A, KDC Nam Hùng Vương, P. An Lạc, Q. Bình Tân, TP.HCM",
    // Address-text search kept returning ambiguous "Nam Hùng Vương" housing
    // developments instead of this specific one; pinned by verified coordinates
    // instead (confirmed against the Khu dân cư Nam Hùng Vương / 33 Đ. Số 1 listing,
    // Plus Code PJXC+76).
    mapSrc: "https://www.google.com/maps?q=10.7482316,106.6205113&output=embed",
  },
  {
    id: "danang",
    address: "Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, TP. Đà Nẵng",
    // Text search for this address embeds to the wrong street (Lê Văn Hiến);
    // pinned by verified coordinates instead — matches the "Thương hiệu SAIZA -
    // 2S GROUP" business listing exactly, Plus Code 26PV+5C.
    mapSrc: "https://www.google.com/maps?q=16.0353916,108.2436164&output=embed",
  },
];
