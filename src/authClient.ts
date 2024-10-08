export interface AuthClient {
    loginPossibilities?: string[];
    build(): void;
    login?(providerId: string): void;
    getAccessToken(): Promise<string>;
    isTokenExpired(token: string): boolean;
}
