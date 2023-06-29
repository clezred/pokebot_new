const pg = require('pg');

/**
 * Function to delete a row inside of a table (VARCHAR VALUES)
 * @param {pg.Client} psqlClient 
 * @param {String} table_name 
 * @param {String} attribute_name 
 * @param {String} attribute_value
 */
function deleteInTable(psqlClient, table_name, attribute_name, attribute_value) {
    try {
        psqlClient.query(`DELETE FROM ${table_name} WHERE ${attribute_name} = ${attribute_value}`)
    } catch (error) {
        console.error(error);
    }
}

module.exports = { deleteInTable };