export interface AuthClient {
    loginPossibilities?: string[];
    build(): void;
    login?(providerId: string): void;
    loginWithEmailAndPassword?(email: string, password: string): void;
    getAccessToken(): Promise<string>;
    isTokenExpired(token: string): boolean;
    sendPasswordResetEmail?(email: string): void;
    createUserWithEmailAndPassword?(email: string, password: string): Promise<boolean>;
    sendEmailVerification?(): void;
}
