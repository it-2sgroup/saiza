// Static list of the most common breached/weak passwords — checked in
// lowercase, no external API call needed (keeps this dependency-free and
// works even if the network to a public breach-check API is unavailable).
const COMMON_WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456789",
  "12345678",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "admin12345",
  "administrator",
  "iloveyou12",
  "sunshine12",
  "princess12",
  "football12",
  "baseball12",
  "monkey12345",
  "dragon12345",
  "master12345",
  "superman12",
  "trustno1234",
  "abc123456",
  "changeme123",
  "letmein@123",
  "passw0rd123",
  "p@ssw0rd123",
  "saiza123456",
  "saiza@12345",
  "vietnam12345",
]);

export type PasswordCheck = { valid: boolean; error: string | null };

/**
 * Applied both client-side (immediate feedback) and server-side (real
 * enforcement — the client check can always be bypassed by calling the API
 * directly, so the server must never trust it alone).
 */
export function validatePassword(password: string): PasswordCheck {
  if (password.length < 10) {
    return { valid: false, error: "Mật khẩu cần ít nhất 10 ký tự." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Mật khẩu quá dài." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Mật khẩu cần có ít nhất 1 chữ thường." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Mật khẩu cần có ít nhất 1 chữ hoa." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Mật khẩu cần có ít nhất 1 chữ số." };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, error: "Mật khẩu này quá phổ biến, dễ bị dò. Hãy chọn mật khẩu khác." };
  }
  return { valid: true, error: null };
}
