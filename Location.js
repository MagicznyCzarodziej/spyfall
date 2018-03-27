class Location {
  constructor(locationsPack) {
    const locations = require('./lib/locations.js');
    const locationsCount = locations[locationsPack].length;
    const location = locations[locationsPack][Math.floor(Math.random() * locationsCount)];
    this.place = location.place;
    this.roles = location.roles;
  }
  getRandomRole() {
    const rolesCount = this.roles.length;
    return this.roles[Math.floor(Math.random() * rolesCount)];
  }
  getName() {
    return this.place;
  }
}

module.exports = Location;
