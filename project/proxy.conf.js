// const target = 'https://lastprojectbackend-production.up.railway.app';
const target = 'http://localhost:8080';
module.exports = {
  '/api': {
    target,
    changeOrigin: true,
    secure: false
  }
}
