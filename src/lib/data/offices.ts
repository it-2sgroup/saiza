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
    mapSrc:
      "https://www.google.com/maps?q=131+%C4%90%C6%B0%E1%BB%9Dng+s%E1%BB%91+1A+KDC+Nam+H%C3%B9ng+V%C6%B0%C6%A1ng+An+L%E1%BA%A1c+B%C3%ACnh+T%C3%A2n+H%E1%BB%93+Ch%C3%AD+Minh&output=embed",
  },
  {
    id: "danang",
    address: "Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, TP. Đà Nẵng",
    mapSrc:
      "https://www.google.com/maps?q=S%E1%BB%91+4+%C4%90%C6%B0%E1%BB%9Dng+M%E1%BB%B9+%C4%90a+T%C3%A2y+9+Ng%C5%A9+H%C3%A0nh+S%C6%A1n+%C4%90%C3%A0+N%E1%BA%B5ng&output=embed",
  },
];
