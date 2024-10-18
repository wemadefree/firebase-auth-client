import { TokenStore } from "./tokenStore";

export default class SessionStore implements TokenStore {
    setToken(token: string): void {
        window.sessionStorage.setItem('accessToken', token)
    }

    getToken(): string {
        return window.sessionStorage.getItem('accessToken') ?? ''
    }

    removeToken(): void {
        window.sessionStorage.removeItem('accessToken')
    }
}