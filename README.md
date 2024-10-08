## Firebase auth client
This package is an authentication client for the [PointerClient](https://github.com/wemadefree/pointer-client-ts). This client allows you to utilize the PointerClient client side with firebase as authentication.

The package is written in TypeScript and utilizes Axios.

### Setup
```npm install @we-made/firebase-auth-client-ts```

Import the package into you main javascript file and create a new pointer client.

The ```FirebaseAuthClient``` requires a ```baseUrl``` and an object for firebase credentials containing ```projectId```, ```authDomain```, ```apiKey```, ```appId```, ```measurementId```, and ```tenantId```.  

Example for Vue.js (main.js):

```
import { createApp } from 'vue'
import App from './App.vue'
import { PointerClient, FirebaseAuthClient } from '@we-made/pointer-client'

const app = createApp(App)

const authClient = new FirebaseAuthClient(
    process.env.VUE_APP_POINTER_BASE_URL, // Base URL for the API
    {
        projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID, // Firebase project ID
        authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN, // Firebase auth domain
        apiKey: process.env.VUE_APP_FIREBASE_API_KEY, // Firebase API key
        appId: process.env.VUE_APP_FIREBASE_APP_ID, // Firebase app ID
        measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID, // Firebase measurement ID
        tenantId: process.env.VUE_APP_FIREBASE_TENANT_ID // Firebase tenant ID
    }
)

await authClient.build();

const pointerClient = new PointerClient(
    process.env.VUE_APP_POINTER_TENANT_ID // Tenant ID in pointer
    process.env.VUE_APP_POINTER_BASE_URL,
    authClient
)

await pointerClient.build()
app.config.globalProperties.$pointerClient = pointerClient
app.mount('#app')
```

It's possible to pass the pointerConfig key (as i ```string```) instead of the firebase credentials ```object``` in the ```FirebaseAuthClient```. 

```

const authClient = new FirebaseAuthClient(
    process.env.VUE_APP_POINTER_BASE_URL, // Base URL for the API
    process.env.VUE_APP_POINTER_PORTAL_CONFIG_KEY // Portal config key for pointer. Used to fetch firebase credentials
)
```
### Authentication 
The ```FirebaseAuthClient``` requires a user to authenticate to be able to query the pointer API. To authenticate the user, call the ```login``` function. This function will trigger a google login by default. Use the ```getLoginOptions``` function to get all available login providers. 

Check the [PointerClient](https://github.com/wemadefree/pointer-client-ts?tab=readme-ov-file#available-functions) available functions section of the github repository for more information about the ```login``` and ```getLoginOptions``` functions.
