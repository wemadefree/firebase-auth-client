export interface TokenStore {
    setToken(token: string): void;
    getToken(): string;
    removeToken(): void;
}
