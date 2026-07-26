import { Linking, Platform } from 'react-native';

/** Open a URL, failing quietly if the platform can't handle tel:/sms:. */
function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

export function callLine(number: string) {
  open(`tel:${number}`);
}

export function textLine(number: string, body?: string) {
  if (!body) {
    open(`sms:${number}`);
    return;
  }
  const sep = Platform.OS === 'ios' ? '&' : '?';
  open(`sms:${number}${sep}body=${encodeURIComponent(body)}`);
}
