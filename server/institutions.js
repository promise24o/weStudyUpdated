const csvFilePath = 'institutions.csv';
const MongoClient = require('mongodb').MongoClient;
const csvtojson = require('csvtojson');

async function insertCsvDataIntoMongoDB() {
    const client = await MongoClient.connect('mongodb+srv://root:dbpassword@cluster0.tyyktaq.mongodb.net/test');

    const db = client.db('test');
    const collection = db.collection('institutions');

    const jsonArray = await csvtojson().fromFile(csvFilePath);

    await collection.insertMany(jsonArray);

    console.log('CSV data inserted into MongoDB');
    client.close();
}

insertCsvDataIntoMongoDB();