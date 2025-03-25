// These helpers are calling this template's own server-side routes
// so, they are not directly calling Marketplace API or Integration API.
// You can find these api endpoints from 'server/api/...' directory

import appSettings from '../config/settings';
import { types as sdkTypes, transit } from './sdkLoader';
import Decimal from 'decimal.js';

export const apiBaseUrl = marketplaceRootURL => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the given marketplaceRootURL parameter or the same domain and port as the frontend
  return marketplaceRootURL ? marketplaceRootURL.replace(/\/$/, '') : `${window.location.origin}`;
};

// Application type handlers for JS SDK.
//
// NOTE: keep in sync with `typeHandlers` in `server/api-util/sdk.js`
export const typeHandlers = [
  // Use Decimal type instead of SDK's BigDecimal.
  {
    type: sdkTypes.BigDecimal,
    customType: Decimal,
    writer: v => new sdkTypes.BigDecimal(v.toString()),
    reader: v => new Decimal(v.value),
  },
];

const serialize = data => {
  return transit.write(data, { typeHandlers, verbose: appSettings.sdk.transitVerbose });
};

const deserialize = str => {
  return transit.read(str, { typeHandlers });
};

const methods = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  let { credentials, headers, body, ...rest } = options;

  // If headers are not set, assume body should be serialized as transit format
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};

  // Ajouter les headers par défaut après la déclaration de bodyMaybe
  headers = {
    ...getTransactionHeaders(),
    ...headers,
    'Accept': 'application/json, application/transit+json'
  };

  const fetchOptions = {
    credentials: credentials || 'include',
    headers,
    ...bodyMaybe,
    ...rest
  };

  return window.fetch(url, fetchOptions)
    .then(async response => {
      const contentTypeHeader = response.headers.get('Content-Type');
      const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

      if (response.status === 403) {
        const errorData = await response.json();
        console.error('Erreur d\'autorisation:', {
          status: response.status,
          headers: headers,
          error: errorData,
          endpoint: path
        });
        
        if (errorData.code === 'missing-capabilities') {
          throw new Error('MISSING_CAPABILITIES');
        }
        if (errorData.code === 'invalid-client-id') {
          throw new Error('INVALID_CLIENT_ID');
        }
        
        throw new Error(errorData.code || 'AUTHORIZATION_ERROR');
      }

      if (response.status >= 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      if (contentType === 'application/transit+json') {
        return response.text().then(deserialize);
      } else if (contentType === 'application/json') {
        return response.json();
      }
      return response.text();
    });
};




export const checkApiCapabilities = async () => {
  try {
    const response = await request('/api/capabilities', {
      method: methods.GET,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.capabilities?.includes('transactionWithoutPayment');
  } catch (error) {
    console.error('Erreur lors de la vérification des capabilities:', error);
    return false;
  }
};

/* vrai
// If server/api returns data from SDK, you should set Content-Type to 'application/transit+json'
const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  const { credentials, headers, body, ...rest } = options;

  // If headers are not set, we assume that the body should be serialized as transit format.
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};

  const fetchOptions = {
    credentials: credentials || 'include',
    // Since server/api mostly talks to Marketplace API using SDK,
    // we default to 'application/transit+json' as content type (as SDK uses transit).
    headers: headers || { 'Content-Type': 'application/transit+json' },
    ...bodyMaybe,
    ...rest,
  };
  
  return window.fetch(url, fetchOptions).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);

        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};*/

/* chat
const request = (path, options = {}) => {
  const url = `${apiBaseUrl()}${path}`;
  let { credentials, headers, body, ...rest } = options;

  // If headers are not set, we assume that the body should be serialized as transit format.
  const shouldSerializeBody =
    (!headers || headers['Content-Type'] === 'application/transit+json') && body;
  const bodyMaybe = shouldSerializeBody ? { body: serialize(body) } : {};

  // Supprimer les en-têtes liés à Stripe
  if (headers) {
    delete headers['Stripe-Account'];
    delete headers['Stripe-Version'];
  } else {
    headers = {};
  }

  const fetchOptions = {
    credentials: credentials || 'include',
    // Since server/api mostly talks to Marketplace API using SDK,
    // we default to 'application/transit+json' as content type (as SDK uses transit).
    headers: headers || { 'Content-Type': 'application/transit+json' },
    ...bodyMaybe,
    ...rest,
  };
  
  return window.fetch(url, fetchOptions).then(res => {
    const contentTypeHeader = res.headers.get('Content-Type');
    const contentType = contentTypeHeader ? contentTypeHeader.split(';')[0] : null;

    if (res.status >= 400) {
      return res.json().then(data => {
        let e = new Error();
        e = Object.assign(e, data);

        throw e;
      });
    }
    if (contentType === 'application/transit+json') {
      return res.text().then(deserialize);
    } else if (contentType === 'application/json') {
      return res.json();
    }
    return res.text();
  });
};


*/

// Keep the previous parameter order for the post method.
// For now, only POST has own specific function, but you can create more or use request directly.
const post = (path, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: methods.POST,
    body,
  };

  return request(path, requestOptions);
};

// Fetch transaction line items from the local API endpoint.
//
// See `server/api/transaction-line-items.js` to see what data should
// be sent in the body.

export const transactionLineItems = body => {
  const headers = {
    'Content-Type': 'application/transit+json',
    'X-Transaction-Type': 'no-payment',
    'X-Line-Items-Mode': 'no-payment'
  };
  
  return post('/api/transaction-line-items', body, { headers }).catch(error => {
    console.error('Transaction line items error:', error);
    // Retourner un tableau vide en cas d'erreur pour éviter l'erreur undefined
    return { data: [] };
  });
};


//vraie
// export const transactionLineItems = body => {
//   return post('/api/transaction-line-items', body);
// };



// Initiate a privileged transaction.
//
// With privileged transitions, the transactions need to be created
// from the backend. This endpoint enables sending the order data to
// the local backend, and passing that to the Marketplace API.
//
// See `server/api/initiate-privileged.js` to see what data should be
// sent in the body.

const REQUIRED_CAPABILITIES = {
  TRANSACTIONS: [
    'transition/inquire',
    'transition/request-booking',
    'transition/accept',
    'transition/decline'
  ],
  PRIVILEGED: [
    'privileged-set-line-items',
    'privileged/transition-privileged'
  ],
  BOOKING: ['booking/manage-bookings'],
  AUTH: ['auth/privileged-set-client-id']
};

const getTransactionHeaders = () => {
  return {
    'Content-Type': 'application/transit+json',
    'X-Capabilities': [
      ...REQUIRED_CAPABILITIES.TRANSACTIONS,
      ...REQUIRED_CAPABILITIES.BOOKING
    ].join(','),
    'X-Process-Capabilities': REQUIRED_CAPABILITIES.PRIVILEGED.join(','),
    'X-Client-Type': 'web-template',
    'Authorization': `Client-ID ${process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID}`
  };
};

export const initiatePrivileged = async (params) => {
  const headers = {
    ...getTransactionHeaders(),
    //22/03/2025
    'X-Privileged-Mode': 'false',
    'X-Transaction-Process': 'default-booking/release-44', // Utilisez le processus défini dans process.edn
  };

  const body = {
    ...params,
    meta: {
      ...params.meta,
      transactionProcessAlias: 'default-booking/release-44', // Utilisez le processus défini dans process.edn
    }
  };

  try {
    const response = await post('/api/initiate-privileged', body, { headers });
    return response;
  } catch (error) {
    if (error.status === 403) {
      console.error('Détails de l\'erreur d\'autorisation:', {
        message: error.message,
        capabilities: headers['X-Capabilities'],
        processCapabilities: headers['X-Process-Capabilities'],
        clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID
      });
      throw new Error('MISSING_CAPABILITIES');
    }
    throw error;
  }
};

// export const initiatePrivileged = body => {
//   return post('/api/initiate-privileged', body);
// };



// Transition a transaction with a privileged transition.
//
// This is similar to the `initiatePrivileged` above. It will use the
// backend for the transition. The backend endpoint will add the
// payment line items to the transition params.
//
// See `server/api/transition-privileged.js` to see what data should
// be sent in the body.
export const transitionPrivileged = body => {
  return post('/api/transition-privileged', body);
}; 

// Create user with identity provider (e.g. Facebook or Google)
//
// If loginWithIdp api call fails and user can't authenticate to Marketplace API with idp
// we will show option to create a new user with idp.
// For that user needs to confirm data fetched from the idp.
// After the confirmation, this endpoint is called to create a new user with confirmed data.
//
// See `server/api/auth/createUserWithIdp.js` to see what data should
// be sent in the body.
export const createUserWithIdp = body => {
  return post('/api/auth/create-user-with-idp', body);
};


export const verifyAuthentication = async () => {
  try {
    const headers = {
      ...getTransactionHeaders(),
      'X-Auth-Check': 'true'
    };
    
    const response = await request('/api/auth/verify', { 
      method: methods.GET,
      headers 
    });
    
    return response.authenticated;
  } catch (error) {
    console.error('Erreur de vérification d\'authentification:', error);
    return false;
  }
};