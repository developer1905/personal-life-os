import crypto from 'crypto';
import { TelegramInitData, TelegramUser } from './types';

/**
 * Telegram WebApp initData ni HMAC-SHA256 orqali validatsiya qilish
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): {
  valid: boolean;
  data?: TelegramInitData;
  error?: string;
} {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { valid: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
    }

    // initData string ni parse qilamiz
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
      return { valid: false, error: 'Hash not found in initData' };
    }

    // Hash ni olib tashlaymiz
    urlParams.delete('hash');

    // Kalitlarni alifbo tartibida saralab, data-check-string yaratamiz
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // HMAC-SHA256 secret key yaratamiz
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Hisoblangan hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { valid: false, error: 'Invalid hash - data may be tampered' };
    }

    // Auth date ni tekshiramiz (86400 sekund = 24 soat)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = parseInt(process.env.TELEGRAM_AUTH_MAX_AGE || '86400', 10);

    if (now - authDate > maxAge) {
      return { valid: false, error: 'InitData expired' };
    }

    // Ma'lumotlarni parse qilamiz
    const userStr = urlParams.get('user');
    const user: TelegramUser | undefined = userStr
      ? JSON.parse(userStr)
      : undefined;

    const parsedData: TelegramInitData = {
      query_id: urlParams.get('query_id') || undefined,
      user,
      auth_date: authDate,
      hash,
      start_param: urlParams.get('start_param') || undefined,
    };

    return { valid: true, data: parsedData };
  } catch (error) {
    console.error('Telegram validation error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Development rejimida sinov uchun mock initData
 */
export function createMockInitData(user: TelegramUser): string {
  const data = {
    user: JSON.stringify(user),
    auth_date: Math.floor(Date.now() / 1000).toString(),
    query_id: 'mock_query_id',
  };

  const dataCheckString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const botToken = process.env.TELEGRAM_BOT_TOKEN || 'dev_token';
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const params = new URLSearchParams({ ...data, hash });
  return params.toString();
}

/**
 * Server Action / API Route da foydalanish uchun helper
 */
export async function validateAndGetUser(initData: string): Promise<{
  success: boolean;
  user?: TelegramUser;
  error?: string;
}> {
  // Development rejimida validatsiyani o'tkazib yuboramiz
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TELEGRAM_AUTH === 'true') {
    return {
      success: true,
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'uz',
      },
    };
  }

  const result = validateTelegramInitData(initData);

  if (!result.valid || !result.data?.user) {
    return {
      success: false,
      error: result.error || 'User not found in initData',
    };
  }

  return { success: true, user: result.data.user };
}
