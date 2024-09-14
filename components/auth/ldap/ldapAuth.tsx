// ldapAuth.js
const ldap = require("ldapjs");

const authenticate = (username, password) => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: "ldap://your-ldap-server.com",
    });

    // DN (Distinguished Name) format may vary depending on LDAP server
    const dn = `uid=${username},ou=users,dc=example,dc=com`;

    client.bind(dn, password, (err) => {
      if (err) {
        reject("Credenciales Invalidas");
      } else {
        resolve("Autenticado correctamente");
      }
      client.unbind();
    });
  });
};

module.exports = authenticate;
