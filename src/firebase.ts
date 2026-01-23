import { AuthClient } from './authClient';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import axios from 'axios';
import { TokenStore } from './store/tokenStore';
import CookieStore from './store/cookieStore';
import SessionStore from './store/sessionStore';

export class FirebaseAuthClient implements AuthClient {
    provider: any = new GoogleAuthProvider();
    auth: any = null;
    app: any = null;
    baseUrl: string;
    config: Object|string;
    loginPossibilities: string[] = ['google.com'];
    loginPossibilitiesCustomParams: {[key: string]: any} = {}
    tokenStorage: TokenStore;
    constructor(baseUrl: string, config: Object|string, tokenStorage: string = 'sessionStorage') {
        this.baseUrl = baseUrl;
        this.config = config;
        if (tokenStorage === 'cookie') {
            this.tokenStorage = new CookieStore();
        } else {
            this.tokenStorage = new SessionStore();
        }
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

    async loginWithEmailAndPassword(email: string, password: string) {
        await signInWithEmailAndPassword(this.auth, email, password)
        .then((result) => {
            const user = result.user;
            window.sessionStorage.setItem('authenticatedUser', JSON.stringify(user))
            user.getIdToken().then((token: any) => {
                window.sessionStorage.removeItem('loginFailed')
                this.tokenStorage.setToken(token)
                window.location.reload()
            });
        }).catch((error) => {
            const errorCode = error.code
            const errorMessage = error.message
            console.log('Errors: ' + errorCode, errorMessage)
            window.sessionStorage.setItem('loginFailed', errorMessage)
            window.sessionStorage.removeItem('authenticatedUser')
            window.location.reload()
        });
    }

    async sendPasswordResetEmail(email: string) {
        console.log('Send password reset email to ' + email);
        await firebase.auth().sendPasswordResetEmail(email, {
            url: `${location.origin}/#/login/`
          })
    }

    async createUserWithEmailAndPassword(email: string, password: string): Promise<boolean> {
        console.log('Create user with email ' + email);
        let success = false;
        await firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log('User created: ', user);
            success = true;
            // ...
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error creating user: ', errorCode, errorMessage);
            window.sessionStorage.setItem('signupFailed', errorCode)
            success = false;
            // ..
          });
        return success;
    }

    async sendEmailVerification() {
        const user = firebase.auth().currentUser;
        if (user) {
            await user.sendEmailVerification({
                url: location.href
            })
        } else {
            console.error('No user is signed in.');
        }
    }

    async getAccessToken(): Promise<string> {
        const token: string|null = this.tokenStorage.getToken();
        if (!token) {
            console.error('Not authenticated');
        } else if (this.isTokenExpired(token)) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    user.getIdToken().then((token: any) => {
                        this.tokenStorage.setToken(token)
                    })
                } else {
                    console.error('Not authenticated');
                    this.tokenStorage.removeToken()
                }
            }); 
        }

        return this.tokenStorage.getToken();
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
            if(this.loginPossibilitiesCustomParams[providerId]) {
                this.provider.setCustomParameters({
                    ...this.loginPossibilitiesCustomParams[providerId],
                });
            }
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
            window.sessionStorage.setItem('authenticatedUser', JSON.stringify(user))
            user.getIdToken().then((token: any) => {
                window.sessionStorage.removeItem('loginFailed')
                this.tokenStorage.setToken(token)
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
            window.sessionStorage.removeItem('authenticatedUser')
            window.location.reload()
            // ...
        });
    }

    signOut() {
        const auth = getAuth()
        auth.signOut().then(() => {
            this.tokenStorage.removeToken()
            window.sessionStorage.removeItem('authenticatedUser')
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

                        if(option.providerCustomParams) {
                        // Transform { key: "tenant", value: "someValue" } into { "tenant": "someValue" }
                        const transformedParams = option.providerCustomParams.reduce((acc: any, param: any) => {
                            acc[param.key] = param.val;
                            return acc;
                        }, {});
                        this.loginPossibilitiesCustomParams[option.providerId] = transformedParams;
                        }
                    }
                })
            }).catch((error) => {
                console.error('something went wrong', error)
                result = error.response.data;
            })
        return result;
    }
}