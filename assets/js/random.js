module.exports = {
    random: /**
    * Nombre aléatoire
    * @param {number} min borne minimum
    * @param {number} max borne maximum
    * @returns Nombre aléatoire entre min et max
    */
   function aleatoire(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
   }
}