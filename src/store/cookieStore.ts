import { TokenStore } from "./tokenStore";

export default class CookieStore implements TokenStore {
    setToken(token: string): void {
        document.cookie = `accessToken=${token}; path=/`
    }

    getToken(): string {
        return document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")
    }

    removeToken(): void {
        document.cookie = 'accessToken=; path=/'
    }
}