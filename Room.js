module.exports = class Room {
  constructor(admin) {
    this.admin = admin;
    this.id = admin.username.slice(0,3) + '_' + Math.round(Math.random()*999999+100000);
    this.users = [admin];
  }
  addUser(user) {
    this.users.push(user);
  }
  removeUser(user) {
    const userIndex = this.users.indexOf(user);
    this.users.splice(userIndex, 1);
  }
  getUsers() {
    return this.users;
  }
  getId() {
    return this.id;
  }
  getAdminId() {
    return this.admin.getId();
  }
}
