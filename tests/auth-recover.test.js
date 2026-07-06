const assert = require('assert');
const path = require('path');

function loadControllerWithStubs() {
  const nodemailerPath = require.resolve('nodemailer');
  const usuariosRepoPath = require.resolve('../src/Entities/usuarios/usuarios.repository');
  const authRepoPath = require.resolve('../src/Entities/auth/auth.repository');
  const controllerPath = require.resolve('../src/Entities/auth/auth.controller');

  const fakeTransport = {
    verify: async () => {
      throw new Error('SMTP authentication failed');
    },
    sendMail: async () => ({})
  };

  const fakeUsuariosRepo = {
    getUsuarioByEmail: async () => ({ id_usuario: 7, email: 'usuario@test.cl' }),
    updateUsuarioPassword: async () => ({}),
    insertUsuarioAuditLog: async () => ({})
  };

  const fakeAuthRepo = {
    createRecoveryAttempt: async () => ({})
  };

  require.cache[nodemailerPath] = {
    id: nodemailerPath,
    filename: nodemailerPath,
    loaded: true,
    exports: {
      createTransport: () => fakeTransport
    }
  };

  require.cache[usuariosRepoPath] = {
    id: usuariosRepoPath,
    filename: usuariosRepoPath,
    loaded: true,
    exports: fakeUsuariosRepo
  };

  require.cache[authRepoPath] = {
    id: authRepoPath,
    filename: authRepoPath,
    loaded: true,
    exports: fakeAuthRepo
  };

  delete require.cache[controllerPath];

  return require('../src/Entities/auth/auth.controller');
}

(() => {
  console.log('Running auth recover tests...');

  const controller = loadControllerWithStubs();
  const requests = [];
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  const req = {
    body: { email: 'usuario@test.cl' },
    headers: { 'user-agent': 'test-agent' },
    ip: '127.0.0.1'
  };

  controller.recover(req, res, (err) => {
    requests.push(err);
  }).then(() => {
    assert.strictEqual(res.statusCode, 502, 'recover should return 502 when SMTP fails');
    assert.match(String(res.body?.message || ''), /No fue posible enviar/i, 'error should be explicit');
    console.log('All auth recover tests passed.');
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
})();
