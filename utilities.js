const ACCESS_TOKEN = 'access_token';
export function getAccessTokenFromCookie(cookieString) {
  return cookieString.split(`${ACCESS_TOKEN}=`).filter(Boolean)[0];
}
