import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "us-east-1_cvE0MffDj",
  ClientId: "7gcdsm4uh70sqgoorro3sg6k21",
};

const userPool = new CognitoUserPool(poolData);

export const signUp = (name, phone, email, password) => {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({
        Name: "email",
        Value: email,
      }),
      new CognitoUserAttribute({
        Name: "name",
        Value: name,
      }),
      new CognitoUserAttribute({
        Name: "phone_number",
        Value: phone,
      }),
    ];

    userPool.signUp(email, password, attributes, null, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
};

export const confirmSignUp = (email, code) => {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
};

export const login = (email, password) => {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userEmail", email);

        resolve(result);
      },

      onFailure: (error) => {
        reject(error);
      },
    });
  });
};

export const logout = () => {
  const currentUser = userPool.getCurrentUser();

  if (currentUser) {
    currentUser.signOut();
  }

  localStorage.removeItem("idToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userEmail");
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("idToken");
  return !!token;
};

export const getCurrentUserEmail = () => {
  return localStorage.getItem("userEmail");
};

export const getIdToken = () => {
  return localStorage.getItem("idToken");
};