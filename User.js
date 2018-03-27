module.exports = class User {
  constructor(id) {
    this.id = id;
    this.username = '';
    this.isSpy = false;
    this.location = '';
    this.role = '';
  }
  setUsername(username) {
    this.username = username;
  }
  getUsername() {
    return this.username;
  }
  reset() {
    this.isSpy = false;
    this.location = '';
    this.role = '';
  }
  getId() {
    return this.id;
  }
}
