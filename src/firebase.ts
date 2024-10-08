import { AuthClient } from './authClient';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import axios from 'axios';

export class FirebaseAuthClient implements AuthClient {
    provider: any = new GoogleAuthProvider();
    auth: any = null;
    app: any = null;
    baseUrl: string;
    config: Object|string;
    loginPossibilities: string[] = ['google.com'];
    constructor(baseUrl: string, config: Object|string) {
        this.baseUrl = baseUrl;
        this.config = config;
    }

    async build() {
        if(typeof this.config === 'string') {
            this.config = await this.getFireBaseConfig();
        }
        this.initilizeFirebase(this.config);
    }

    async login(providerId: string = 'google.com') {
        if (this.loginPossibilities.includes(providerId)) {
            return await this.authenticate(providerId);
        } else {
            console.error('This login provider is not enabled')
        }
    }

    async getAccessToken(): Promise<string> {
        const token: string|null = window.sessionStorage.getItem('accessToken')
        if (!token) {
            console.error('Not authenticated');
        } else if (this.isTokenExpired(token)) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    user.getIdToken().then((token: any) => {
                        window.sessionStorage.setItem('accessToken', token)
                    })
                } else {
                    console.error('Not authenticated');
                    window.sessionStorage.removeItem('accessToken')
                }
            }); 
        }

        return window.sessionStorage.getItem('accessToken') ?? ''
    }

    initilizeFirebase(configOptions: any) {
        const options = {
            projectId: configOptions.projectId,
            authDomain: configOptions.authDomain,
            apiKey: configOptions.apiKey,
            appId: configOptions.appId,
            measurementId: configOptions.measurementId
        }
        this.app = firebase.initializeApp(options)
        this.app.auth().tenantId = configOptions.tenantId
        this.auth = getAuth()
    }

    authenticate(providerId: string = 'google.com') {
        if (providerId === 'google.com') {
            this.provider = new GoogleAuthProvider();
        } else {
            this.provider = new OAuthProvider(providerId)
        }
        signInWithPopup(this.auth, this.provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential !== null) {
                const token = credential.accessToken
            }
            // The signed-in user info.
            const user = result.user;
            user.getIdToken().then((token: any) => {
                window.sessionStorage.removeItem('loginFailed')
                window.sessionStorage.setItem('accessToken', token)
                window.location.reload()
            });
            // IdP data available using getAdditionalUserInfo(result)
            // ...
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code
            const errorMessage = error.message
            console.log('Errors: ' + errorCode, errorMessage)
            // The email of the user's account used.
            const email = error.customData.email
            // The AuthCredential type that was used
            const credential = GoogleAuthProvider.credentialFromError(error)
            window.sessionStorage.setItem('loginFailed', errorMessage)
            window.location.reload()
            // ...
        });
    }

    signOut() {
        const auth = getAuth()
        auth.signOut().then(() => {
            window.sessionStorage.removeItem('accessToken')
            window.location.reload()
        }).catch((error) => {
            console.log(error)
        });
    }

    isTokenExpired(token: string) {
        const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
        const expired = (Math.floor((new Date()).getTime() / 1000)) >= expiry;
        return expired
    }

    async getFireBaseConfig() {
        let result = {};
        const client = axios.create({
            baseURL: this.baseUrl,
        })
        await client.get(`/xrm-tenants/v1/login/portalConfig?key=${this.config}`)
            .then((res) => {
                const fireBaseResponse = res.data.firebaseConfigs[0];
                result = {
                    projectId: fireBaseResponse.options.projectId,
                    authDomain: fireBaseResponse.options.authDomain,
                    apiKey: fireBaseResponse.options.apiKey,
                    appId: fireBaseResponse.options.appId,
                    measurementId: fireBaseResponse.options.measurementId,
                    tenantId: fireBaseResponse.firebaseAuthTenant
                };

                const loginOptions = res.data.loginProviders;
                this.loginPossibilities = [];
                loginOptions.forEach((option: any) => {
                    if (option.isEnabled) {
                        this.loginPossibilities.push(option.providerId);
                    }
                })
            }).catch((error) => {
                console.error('something went wrong', error)
                result = error.response.data;
            })
        return result;
    }
}