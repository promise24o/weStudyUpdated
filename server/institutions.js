const csvFilePath = 'institutions.csv';
const { MongoClient, ObjectId } = require('mongodb');
const csvtojson = require('csvtojson');

async function insertCsvDataIntoMongoDB() {
    const client = await MongoClient.connect('mongodb+srv://root:dbpassword@cluster0.tyyktaq.mongodb.net/test');

    const db = client.db('test');
    const collection = db.collection('institutions');

    const jsonArray = await csvtojson().fromFile(csvFilePath);

    const validJsonArray = jsonArray.filter(item => {
        // Check if all required fields have values
        return item.institution && item.logo && item.type && item.region && item.country;
    });

    if (validJsonArray.length === 0) {
        console.log('No valid CSV data to insert into MongoDB');
        client.close();
        return;
    }

    await collection.insertMany(validJsonArray);

    console.log('CSV data with complete information inserted into MongoDB');
    client.close();
}

async function deleteDocumentsFromSpecificDocument() {
    const client = await MongoClient.connect('mongodb+srv://root:dbpassword@cluster0.tyyktaq.mongodb.net/test');
    const db = client.db('test');
    const collection = db.collection('institutions');

    const specificDocumentId = '64d40034dd4ef792769cb25a'; // Use the actual document ID value

    const query = { _id: { $gte: new ObjectId(specificDocumentId) } };
    await collection.deleteMany(query);

    console.log('Documents deleted starting from the specific document');
    client.close(); 
}


// Call the insertCsvDataIntoMongoDB function
insertCsvDataIntoMongoDB();
// Call the deleteDocumentsFromSpecificDocument function
// deleteDocumentsFromSpecificDocument();
